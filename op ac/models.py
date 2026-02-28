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




class FireStation(Base):
    __tablename__ = "fire_stations"

    station_id = Column(String, primary_key=True)
    name = Column(String)
    lat = Column(Float)
    lon = Column(Float)

    status = Column(String, default="available")  # available | busy | offline

    vehicles = relationship("FireVehicle", back_populates="station")


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