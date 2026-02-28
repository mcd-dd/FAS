class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True)
    incident_id = Column(String, unique=True, index=True)

    device_id = Column(String, ForeignKey("devices.device_id"), index=True)

    alarm_type = Column(String, nullable=True)

    # 🔥 Updated status lifecycle
    status = Column(String, default="PENDING")
    # PENDING | ACCEPTED | DESPATCHED | REJECTED | ESCALATED | TRANSFERRED | CLOSED

    confidence = Column(Float, default=0.0)
    payload = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

    device = relationship("Device", back_populates="incidents")

    # 🔹 Station assignment
    assigned_station_id = Column(String, index=True)

    # 🔹 Escalation fields
    escalated_to_nfs = Column(Boolean, default=False)
    rejected_by_station = Column(String, nullable=True)
    escalated_at = Column(DateTime, nullable=True)

    # 🔹 Transfer fields (NFS → station)
    transferred_to_station = Column(String, nullable=True)
    transferred_at = Column(DateTime, nullable=True)

    # 🔹 Vehicle
    vehicle_id = Column(String, ForeignKey("fire_vehicles.vehicle_id"), nullable=True)
    vehicle = relationship("FireVehicle", back_populates="incidents")