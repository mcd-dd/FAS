class OperatorActionPayload(BaseModel):
    incident_id: str
    action: str
    station_id: str | None = None
    transfer_to_station: str | None = None
    user: str

@app.post("/api/v1/operator/action")
async def operator_action(
    payload: OperatorActionPayload,
    current=Depends(get_current_user)
):
    db = SessionLocal()

    try:

        if current["role"] not in ["STATION", "NFS"]:
            return

        incident = db.query(Incident).filter_by(
            incident_id=payload.incident_id
        ).first()

        if not incident:
            raise HTTPException(404, "Incident not found")

        # -----------------------------
        # ACCEPT
        # -----------------------------
        if payload.action == "ACCEPT":

            if current["role"] == "STATION":
                if payload.station_id != current["station_id"]:
                    raise HTTPException(403, "Invalid station")
            
            # find available vehicle
            vehicle = db.query(FireVehicle).filter_by(
                station_id=payload.station_id,
                status="AVAILABLE"
            ).first()

            if not vehicle:
                raise HTTPException(400, "No available vehicle")

            vehicle.status = "ASSIGNED"

            incident.vehicle_id = vehicle.vehicle_id
            incident.status = "ACCEPTED"
            incident.assigned_station_id = payload.station_id

        # -----------------------------
        # DESPATCH
        # -----------------------------
        elif payload.action == "DESPATCH":

            if not incident.vehicle_id:
                raise HTTPException(400, "No vehicle assigned")


            vehicle = db.query(FireVehicle).filter_by(
                vehicle_id=incident.vehicle_id
            ).first()

            vehicle.status = "IN_OPERATION"
            incident.status = "DESPATCHED"

        # -----------------------------
        # REJECT → Transfer
        # -----------------------------
        elif payload.action == "REJECT":

            if incident.vehicle:
                incident.vehicle.status = "AVAILABLE"

            incident.vehicle_id = None
            incident.status = "ESCALATED"
            incident.escalated_to_nfs = True
            incident.rejected_by_station = current["station_id"]
            incident.escalated_at = datetime.utcnow()
            incident.vehicle_id = None
            incident.assigned_station_id = None

        elif payload.action == "TRANSFER":

            if current["role"] != "NFS":
                raise HTTPException(403)

            incident.status = "TRANSFERRED"
            incident.transferred_to_station = payload.transfer_to_station
            incident.transferred_at = datetime.utcnow()
            incident.assigned_station_id = payload.transfer_to_station
            incident.escalated_to_nfs = False

        # log action
        action_log = OperatorAction(
            incident_id=payload.incident_id,
            action=payload.action,
            station_id=payload.station_id,
            user=payload.user,
            ts=datetime.utcnow()
        )

        db.add(action_log)
        db.commit()

        # Broadcast update to websocket clients
        await broadcaster.broadcast_incident({
            "type": "incident:update",
            "payload": {
                "id": incident.incident_id,
                "status": incident.status,
                "assigned_station_id": incident.assigned_station_id,
                "vehicle_ready": incident.vehicle_ready,
                "vehicle_despatched": incident.vehicle_despatched,
            }
        })

        return {"status": "ok"}

    finally:
        db.close()

@app.get("/api/v1/incidents")
def list_incidents(limit: int = 100, station_id: str | None = None, device_id: str | None = None, current=Depends(get_current_user)):
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
            q = q.join(Device).filter(
                or_(
                    Incident.assigned_station_id == current["station_id"],
                    Device.primary_station_id == current["station_id"],
                )
            )
            q = q.filter(Incident.alarm_type.in_(["FIRE", "TEMP"]))

        elif role == "VEHICLE_OPERATOR":

            # Get logged-in user
            assignment = db.query(VehicleOperatorAssignment).filter_by(
                user_id=current["user_id"],
                active=True
            ).first()

            if not assignment:
                return []

            q = q.filter(Incident.vehicle_id == assignment.vehicle_id)

        elif role == "NFS":
            # Access all
            q = q.filter(Incident.alarm_type.in_(["FIRE", "TEMP"]))
            q = q.filter(
                Incident.escalated_to_nfs == True
            )
            pass
    
        # if station_id:
        #     q = q.join(Device).filter(
        #         or_(
        #             Incident.assigned_station_id == station_id,
        #             Device.primary_station_id == station_id,
        #         )
        #     )

        if device_id:
            q = q.filter(Incident.device_id == device_id)
            
        result = []
        for inc in q.limit(limit):
            device = inc.device
            user = device.user if device else None

            samples = (
                db.query(SensorData)
                .filter_by(device_id=inc.device_id)
                .order_by(SensorData.ts.desc())
                .limit(50)
                .all()
            )

            result.append({
                "id": inc.incident_id,
                "device_id": inc.device_id,
                "alarm_type": inc.alarm_type,
                "confidence": inc.confidence,
                "status": inc.status,
                "created_at": inc.created_at.isoformat(),
                "assigned_station_id": inc.assigned_station_id,
                "lat": device.lat if device and device.lat else 12.9716,
                "lon": device.lon if device and device.lon else 77.5946,
                "user": {
                    "name": user.name,
                    "phone": user.phone,
                    "address": user.address,
                    "photo": user.photo_path,
                } if user else None,
                "sensor_timeline": [
                    {"ts": s.ts, "temp": s.temp, "smoke": s.smoke}
                    for s in reversed(list(samples))
                ],
                "payload": inc.payload,
            })

        return result
    finally:
        db.close()