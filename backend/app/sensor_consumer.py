import json
from confluent_kafka import Consumer
from app.db import SessionLocal
from app.models import SensorData, Device
from app.db import init_db
from app.incidents import broadcaster, _event_loop
import asyncio

init_db()  # 🔥 REQUIRED

consumer = Consumer({
    "bootstrap.servers": "kafka:9092",
    "group.id": "sensor-consumer",
    "enable.auto.commit": False,
    "auto.offset.reset": "earliest",
})

consumer.subscribe(["sensor.live", "sensor.flash"])

def ensure_device(db, device_id):
    dev = db.query(Device).filter(Device.device_id == device_id).first()
    if not dev:
        db.add(Device(device_id=device_id))
        db.commit()

while True:
    msg = consumer.poll(1.0)
    if msg is None or msg.error():
        continue

    payload = json.loads(msg.value().decode())
    db = SessionLocal()

    try:
        print('Sensor consumer payload: ',payload)
        device_id = payload["device_id"]
        ensure_device(db, device_id)

        # if msg.topic() == "sensor.flash":
        data = payload["data"]
        row = SensorData(
            device_id=device_id,
            ts=payload["ts"],
            temp=data.get("temp"), # / 10.0,
            smoke=data.get("smoke"), # / 10.0,
            rssi=payload.get("rssi"),
        )
        db.add(row)

        # else:  # sensor.live
        #     for s in payload.get("samples", []):
        #         row = SensorData(
        #             device_id=device_id,
        #             ts=s["ts"],
        #             temp=float(s["temp"]),
        #             smoke=float(s["smoke"]),                    
        #         )
        #         db.add(row)
        
        db.commit()
        consumer.commit(msg)

        if broadcaster and _event_loop:
            _event_loop.call_soon_threadsafe(
                asyncio.create_task,
                broadcaster.broadcast_sensor({
                    "device_id": payload["device_id"],
                    "ts": payload["ts"],
                    "temp": data["temp"],
                    "smoke": data["smoke"],
                })
            )

    except Exception as e:
        print("Sensor insert failed:", e)
        db.rollback()
    finally:
        db.close()