from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .db import Base
import time
import datetime

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
    # CUSTOMER | INSTALL_OPERATOR | ADMIN

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

    created_at = Column(DateTime, default=datetime.datetime.utcnow)  # <-- ADD THIS
    activated_at = Column(DateTime, nullable=True)


class FireStation(Base):
    __tablename__ = "fire_stations"

    station_id = Column(String, primary_key=True)
    name = Column(String)
    lat = Column(Float)
    lon = Column(Float)

    status = Column(String, default="available")  # available | busy | offline

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
    status = Column(String, default="new")      # new, acknowledged…

    confidence = Column(Float, default=0.0)
    payload = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

    device = relationship("Device", back_populates="incidents")

    assigned_station_id = Column(String, index=True)


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
