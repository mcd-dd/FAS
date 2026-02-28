from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .db import Base
import time
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, unique=True, index=True)

    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=True)

    photo_path = Column(String, nullable=True)  # jpg/png path or URL

    created_at = Column(DateTime, server_default=func.now())

    devices = relationship("Device", back_populates="user")

    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)

    plan = Column(String)  # monthly | quarterly | yearly
    plan_amount = Column(Float)

    status = Column(String, default="pending_activation")  
    # pending_activation | active | suspended

    role = Column(String, default="CUSTOMER")  
    # CUSTOMER | INSTALL_OPERATOR | ADMIN | STATION | NFS | VEHICLE_OPERATOR

    # Link Vehicle Operator to Vehicle
    # vehicle_id = Column(String, ForeignKey("fire_vehicles.vehicle_id"), nullable=True)
    # vehicle = relationship("FireVehicle", back_populates="operators")
    vehicle_assignments = relationship(
        "VehicleOperatorAssignment",
        back_populates="user"
    )

# -------------------------------------------------------------------
# DEVICE TABLE
# -------------------------------------------------------------------
class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True)
    device_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)

    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

    primary_station_id = Column(String, index=True)   # NEW
    
    # 🔗 LINK TO USER
    user_id = Column(String, ForeignKey("users.user_id"), nullable=True)
    # ✅ ADD THIS (MISSING)
    user = relationship("User", back_populates="devices")

    last_seen = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # one-to-many relations
    sensor_data = relationship("SensorData", back_populates="device")
    incidents = relationship("Incident", back_populates="device")

    created_at = Column(DateTime, default=datetime.utcnow)  # <-- ADD THIS
    activated_at = Column(DateTime, nullable=True)


class FireStation(Base):
    __tablename__ = "fire_stations"

    station_id = Column(String, primary_key=True)
    name = Column(String)
    lat = Column(Float)
    lon = Column(Float)

    status = Column(String, default="available")  # available | busy | offline

    vehicles = relationship("FireVehicle", back_populates="station")

# -------------------------------------------------------------------
# SENSOR DATA TABLE (NEW)
# Stores routine temperature + smoke samples from STM32
# -------------------------------------------------------------------
class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True)
    device_id = Column(String, ForeignKey("devices.device_id"), index=True)

    ts = Column(Float)        # timestamp from STM32
    temp = Column(Float)
    smoke = Column(Float)
    rssi = Column(Integer, nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    device = relationship("Device", back_populates="sensor_data")


# -------------------------------------------------------------------
# INCIDENT TABLE — ONLY FOR ALARMS
# -------------------------------------------------------------------
class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True)
    incident_id = Column(String, unique=True, index=True)

    device_id = Column(String, ForeignKey("devices.device_id"), index=True)

    alarm_type = Column(String, nullable=True)  # smoke, overheat, flash_log, etc.
    status = Column(String, default="new")      # NEW | ACCEPTED | DESPATCHED | TRANSFERRED | CLOSED

    confidence = Column(Float, default=0.0)
    payload = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

    device = relationship("Device", back_populates="incidents")

    assigned_station_id = Column(String, index=True)

    vehicle_ready = Column(Boolean, default=False)
    vehicle_despatched = Column(Boolean, default=False)

    vehicle_id = Column(String, ForeignKey("fire_vehicles.vehicle_id"), nullable=True)
    vehicle = relationship("FireVehicle", back_populates="incidents")

    # 🔹 Escalation fields
    escalated_to_nfs = Column(Boolean, default=False)
    rejected_by_station = Column(String, nullable=True)
    escalated_at = Column(DateTime, nullable=True)

    # 🔹 Transfer fields (NFS → station)
    transferred_to_station = Column(String, nullable=True)
    transferred_at = Column(DateTime, nullable=True)


class OperatorAction(Base):
    __tablename__ = "operator_actions"

    id = Column(Integer, primary_key=True)
    incident_id = Column(String)
    action = Column(String)  # ACCEPT | DESPATCH | REJECT
    station_id = Column(String)
    user = Column(String)
    ts = Column(DateTime, default=datetime.utcnow)


# -------------------------------------------------------------------
# AUDIT LOG
# -------------------------------------------------------------------
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    incident_id = Column(String, index=True)
    action = Column(String)
    user = Column(String)
    details = Column(JSON)
    ts = Column(DateTime, server_default=func.now())


# Each station → one or more vehicles
# Each vehicle → many incidents
# Each incident → assigned to one vehicle

# -------------------------------------------------------------------
# FIRE VEHICLE TABLE
# -------------------------------------------------------------------
class FireVehicle(Base):
    __tablename__ = "fire_vehicles"

    id = Column(Integer, primary_key=True)
    vehicle_id = Column(String, unique=True, index=True)

    station_id = Column(String, ForeignKey("fire_stations.station_id"))
    name = Column(String)

    status = Column(String, default="AVAILABLE")
    # AVAILABLE | ASSIGNED | IN_OPERATION | MAINTENANCE

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    station = relationship("FireStation", back_populates="vehicles")
    incidents = relationship("Incident", back_populates="vehicle")

    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    last_location_update = Column(DateTime)

    operator_assignments = relationship(
        "VehicleOperatorAssignment",
        back_populates="vehicle"
    )


class RechargeHistory(Base):
    __tablename__ = "recharge_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)

    plan = Column(String)
    amount = Column(Float)
    payment_method = Column(String)

    status = Column(String, default="SUCCESS")  # SUCCESS | FAILED

    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")

class VehicleOperatorAssignment(Base):
    __tablename__ = "vehicle_operator_assignments"

    id = Column(Integer, primary_key=True)

    vehicle_id = Column(String, ForeignKey("fire_vehicles.vehicle_id"))
    user_id = Column(String, ForeignKey("users.user_id"))

    assigned_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)

    vehicle = relationship("FireVehicle", back_populates="operator_assignments")
    user = relationship("User", back_populates="vehicle_assignments")