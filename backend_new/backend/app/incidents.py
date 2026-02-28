# app/services/incidents.py

import asyncio
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Device, Incident, SensorData
from app.event_bus import publish_incident_event

# # injected at runtime
# broadcaster = None
# _event_loop = None

# def set_broadcaster(b):
#     global broadcaster
#     broadcaster = b

# def set_event_loop(loop):
#     global _event_loop
#     _event_loop = loop

def insert_sensor_sync(payload: dict):
    db = SessionLocal()
    try:
        data = payload["data"]
        row = SensorData(
            device_id=payload["device_id"],
            ts=payload["ts"],
            temp=float(data["temp"]),
            smoke=float(data["smoke"]),
            rssi=payload.get("rssi"),
        )
        db.add(row)
        db.commit()
        return row
    finally:
        db.close()


def insert_incident_sync(payload: dict) -> bool:
    db: Session = SessionLocal()
    try:
        device_id = payload.get("device_id", "unknown")

        # ensure device exists
        dev = db.query(Device).filter(Device.device_id == device_id).first()
        if dev is None:
            dev = Device(device_id=device_id, created_at=datetime.utcnow())
            db.add(dev)
            db.commit()
            db.refresh(dev)

        station_hint = payload.get("meta", {}).get("station_hint")
        assigned_station = dev.primary_station_id or station_hint

        # Store sensor data
        data = payload["data"]
        row = SensorData(
            device_id=device_id,
            ts=payload["ts"],
            temp=data.get("temp"), # / 10.0,
            smoke=data.get("smoke"), # / 10.0,
            rssi=payload.get("rssi"),
        )
        db.add(row)
        db.commit()
        db.refresh(row)

        # Store Incident data
        alarm_data = payload["alarm"]
        inc = Incident(
            incident_id=str(uuid.uuid4()),
            device_id=device_id,
            alarm_type=alarm_data.get("type"), #, "FIRE"),
            confidence=alarm_data.get("threshold"), #payload.get("confidence", 0.9),
            payload=payload,
            assigned_station_id=assigned_station,
        )

        db.add(inc)
        db.commit()
        db.refresh(inc)

        incident_payload = {
            "id": inc.incident_id,
            "device_id": inc.device_id,
            "alarm_type": inc.alarm_type,
            "created_at": inc.created_at.isoformat(),
            "status": inc.status,
            "confidence": inc.confidence,
            "lat": dev.lat,
            "lon": dev.lon,
            "assigned_station_id": inc.assigned_station_id,
            "payload": inc.payload,
        }

        # publish to Redis (fire and forget)
        asyncio.run(publish_incident_event(incident_payload))
            

        return True

    finally:
        db.close()