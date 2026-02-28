# app/mqtt_worker.py

import asyncio
import json
import os

from aiomqtt import Client, MqttError
from confluent_kafka import Producer

MQTT_BROKER = os.environ.get("MQTT_BROKER", "80.225.236.160")
MQTT_PORT = int(os.environ.get("MQTT_PORT", 1883))

TOPIC_ALARMS = "devices/+/alarms"
TOPIC_LIVE = "device/data"
TOPIC_FLASH = "device/logs"

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")

producer = Producer({
    "bootstrap.servers": KAFKA_BOOTSTRAP,
    "acks": "all",
    "retries": 5,
})

def publish(topic, key, payload):
    producer.produce(topic, key=key, value=json.dumps(payload))
    producer.poll(0)

# ---------------------------------------------------------------------
# def ensure_device_exists(device_id: str):
#     db = SessionLocal()
#     try:
#         if not db.query(Device).filter_by(device_id=device_id).first():
#             db.add(Device(device_id=device_id, name=f"Device {device_id}"))
#             db.commit()
#             print(f"DB → Registered new device {device_id}")
#     finally:
#         db.close()

# def save_sensor_sample(device_id, ts, temp, smoke, rssi=None):
#     ensure_device_exists(device_id)
#     db = SessionLocal()
#     try:
#         db.add(SensorData(
#             device_id=device_id,
#             ts=ts,
#             temp=temp,
#             smoke=smoke,
#             rssi=rssi,
#         ))
#         db.commit()
#     except Exception as ex:
#         print("DB Sensor Insert Error:", ex)
#     finally:
#         db.close()

# ---------------------------------------------------------------------
# async def route_message(topic, payload_raw):
#     try:
#         payload = json.loads(payload_raw)
#     except json.JSONDecodeError:
#         return

#     if topic == TOPIC_FLASH:
#         save_sensor_sample(
#             payload["device_id"],
#             payload["ts"],
#             payload["temp"] / 10,
#             payload["smoke"] / 10,
#         )

#     elif topic == TOPIC_LIVE:
#         for s in payload.get("samples", []):
#             save_sensor_sample(
#                 payload["device_id"],
#                 s["ts"],
#                 float(s["temp"]),
#                 float(s["smoke"]),
#                 payload.get("rssi"),
#             )

#     elif topic.startswith("devices/") and topic.endswith("/alarms"):
#         await asyncio.to_thread(insert_incident_sync, payload)

# ---------------------------------------------------------------------
async def mqtt_loop():
    while True:
        try:
            async with Client(MQTT_BROKER, MQTT_PORT) as client:
                await client.subscribe(TOPIC_ALARMS)
                await client.subscribe(TOPIC_LIVE)
                await client.subscribe(TOPIC_FLASH)

                async for msg in client.messages:
                    print("MQTT RX →", msg.topic, msg.payload.decode())
                    topic = str(msg.topic)
                    payload = json.loads(msg.payload.decode())
                    device_id = payload.get("device_id", "unknown")
                    # asyncio.create_task(
                    #     route_message(
                    #         str(msg.topic),
                    #         msg.payload.decode()
                    #     )
                    # )
                    if topic == TOPIC_FLASH:
                        publish("sensor.flash", device_id, payload)

                    elif topic == TOPIC_LIVE:
                        publish("sensor.live", device_id, payload)

                    elif topic.startswith("devices/") and topic.endswith("/alarms"):
                        publish("alarms.raw", device_id, payload)
        except MqttError:
            await asyncio.sleep(3)

if __name__ == "__main__":
    asyncio.run(mqtt_loop())                                                        