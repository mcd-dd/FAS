import json
from confluent_kafka import Consumer
from app.incidents import insert_incident_sync
from app.db import init_db
init_db()
consumer = Consumer({
    "bootstrap.servers": "kafka:9092",
    "group.id": "alarm-consumer",
    "enable.auto.commit": False,
    "auto.offset.reset": "earliest",
})

consumer.subscribe(["alarms.raw"])

while True:
    msg = consumer.poll(1.0)
    if msg is None or msg.error():
        continue

    payload = json.loads(msg.value().decode())

    try:
        print('Alarm consumer payload: ',payload)
        insert_incident_sync(payload)
        consumer.commit(msg)   # commit only after DB success
    except Exception as e:
        print("Alarm insert failed:", e)