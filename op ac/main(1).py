class VehicleCreate(BaseModel):
    vehicle_id: str
    name: str
    station_id: str

class VehicleUpdate(BaseModel):
    status: str  # AVAILABLE | MAINTENANCE

@app.post("/api/v1/vehicles")
def create_vehicle(payload: VehicleCreate, current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        if current["role"] != "STATION":
            raise HTTPException(403)

        vehicle = FireVehicle(
            vehicle_id=payload.vehicle_id,
            name=payload.name,
            station_id=payload.station_id,
            status="AVAILABLE"
        )

        db.add(vehicle)
        db.commit()

        return {"status": "created"}
    finally:
        db.close()


@app.get("/api/v1/vehicles")
def list_vehicles(current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        if current["role"] == "STATION":
            vehicles = db.query(FireVehicle).filter_by(
                station_id=current["station_id"]
            ).all()
        else:
            vehicles = db.query(FireVehicle).all()

        return [
            {
                "vehicle_id": v.vehicle_id,
                "name": v.name,
                "status": v.status,
                "station_id": v.station_id
            }
            for v in vehicles
        ]
    finally:
        db.close()


@app.put("/api/v1/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: str, payload: VehicleUpdate, current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        vehicle = db.query(FireVehicle).filter_by(vehicle_id=vehicle_id).first()

        if not vehicle:
            raise HTTPException(404)

        vehicle.status = payload.status
        db.commit()

        return {"status": "updated"}
    finally:
        db.close()


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
            incident.status = "TRANSFERRED"

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