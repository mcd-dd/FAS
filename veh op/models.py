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
    vehicle_id = Column(String, ForeignKey("fire_vehicles.vehicle_id"), nullable=True)
    vehicle = relationship("FireVehicle")



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