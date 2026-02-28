class VehicleLocationUpdate(BaseModel):
    vehicle_id: str
    lat: float
    lon: float


@app.get("/api/v1/incidents")
def list_incidents(limit: int = 100, station_id: str | None = None, current=Depends(get_current_user)):
    db = SessionLocal()
    try:

        q = db.query(Incident).order_by(Incident.created_at.desc())

        role = current["role"]

        if role == "CUSTOMER":
            # Only their device
            q = q.join(Device).filter(
                Device.user_id == current["user_id"]
            )

        elif role == "STATION":
            # Only their station
            q = q.filter(
                Incident.assigned_station_id ==
                current["station_id"]
            )

        elif role == "VEHICLE_OPERATOR":

            q = q.filter(
                Incident.vehicle_id == current["vehicle_id"]
            )

        elif role == "NFS":
            # Access all
            pass

@app.get("/api/v1/sensors")
def list_sensor_data(
    device_id: str | None = None,
    incident_id: str | None = None,
    limit: int = 100,
    current=Depends(get_current_user)
):
    db = SessionLocal()
    try:

        role = current["role"]

        # Base query
        q = db.query(SensorData).join(Device)

        if role == "CUSTOMER":
            q = q.filter(Device.user_id == current["user_id"])

        elif role == "STATION":
            q = q.filter(
                Device.primary_station_id == current["station_id"]
            )

        elif role == "VEHICLE_OPERATOR":

            q = q.filter(
                SensorData.device_id == current["vehicle_id"]
            )

        elif role == "NFS":
            pass

        else:
            # raise HTTPException(403, "Invalid role")
            return


@app.post("/api/v1/users/login")
async def login_user(payload: UserLogin):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(username=payload.username).first()

        if not user:
            raise HTTPException(401, "Invalid credentials")

        if not pwd_context.verify(payload.password, user.password_hash):
            raise HTTPException(401, "Invalid credentials")

        if user.status != "active":
            raise HTTPException(403, "Account not activated")

        # get user's device
        device = db.query(Device).filter_by(user_id=user.user_id).first()

        session_id = await create_session(user.user_id, user.role, user.station_id)

        return {
            "user_id": user.user_id,
            "username": user.username,
            "role": user.role,
            "device_id": device.device_id if device else None,
            "station_id": user.station_id,
            "session_id": session_id,
            "vehicle_id": user.vehicle_id,
        }

    finally:
        db.close()

@app.post("/api/v1/vehicle/location")
async def update_vehicle_location(
    payload: VehicleLocationUpdate,
    current=Depends(get_current_user)
):
    db = SessionLocal()
    try:

        if current["role"] != "VEHICLE_OPERATOR":
            raise HTTPException(403)

        vehicle = db.query(FireVehicle).filter_by(
            vehicle_id=payload.vehicle_id
        ).first()

        if not vehicle:
            raise HTTPException(404)

        vehicle.lat = payload.lat
        vehicle.lon = payload.lon
        vehicle.last_location_update = datetime.utcnow()

        db.commit()

        # 🔴 Broadcast to dashboards
        await broadcaster.broadcast_incident({
            "type": "vehicle:update",
            "payload": {
                "vehicle_id": vehicle.vehicle_id,
                "lat": vehicle.lat,
                "lon": vehicle.lon
            }
        })

        return {"status": "updated"}

    finally:
        db.close()