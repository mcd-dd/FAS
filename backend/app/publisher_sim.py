import paho.mqtt.publish as publish
import json
import time
import uuid

MQTT_HOST = "localhost"
MQTT_PORT = 1883

def publish_alarm(device_id, smoke):
    topic = f"devices/{device_id}/alarms"
    payload = {
        "device_id": device_id,
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "message_id": str(uuid.uuid4()),
        "sensor_data": {
            "smoke_ppm": smoke,
            "temp_c": 40
        }
    }
    publish.single(topic, json.dumps(payload), hostname=MQTT_HOST, port=MQTT_PORT)

if __name__ == "__main__":
    for i in range(3):
        publish_alarm("dev-1001", 180 if i==1 else 10)
        time.sleep(2)
