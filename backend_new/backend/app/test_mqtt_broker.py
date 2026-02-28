import time
import json
import uuid
import paho.mqtt.client as mqtt
import random

# ------------------------------------------------------------
# MQTT Setup
# ------------------------------------------------------------
BROKER = "localhost"
PORT = 1883

client = mqtt.Client()
client.connect(BROKER, PORT, 60)

# ------------------------------------------------------------
# 🔥 MULTIPLE DEVICES
# ------------------------------------------------------------
DEVICES = [
    "dev-001",
    "dev-002",
    "dev-003",
    "dev-004",
]

# ------------------------------------------------------------
# Helper: Generate one flash sample
# ------------------------------------------------------------
def generate_sample():
    return {
        "ts": int(time.time()),
        "temp": round(250 + random.random() * 50),   # scaled *10
        "smoke": round(100 + random.random() * 50),
        "rssi": -70,
    }

# ------------------------------------------------------------
# MAIN TEST LOOP
# ------------------------------------------------------------
while True:
    for device_id in DEVICES:

        now = int(time.time())

        # --------------------------------------------------------
        # 1️⃣  ALARM MESSAGE
        # --------------------------------------------------------
        alarm_msg = {
            "device_id": device_id,
            "message_id": str(uuid.uuid4()),
            "smoke": round(120 + random.random() * 20, 2),
            "temp": round(40 + random.random() * 5, 2),
            "alarm_type": "FIRE",
            "ts": now,
            "rssi": -70
        }

        client.publish(f"devices/{device_id}/alarms", json.dumps(alarm_msg))
        print(f"[ALARM][{device_id}] →", alarm_msg)

        # --------------------------------------------------------
        # 2️⃣  LIVE SENSOR DATA
        # --------------------------------------------------------
        live_msg = {
            "device_id": device_id,
            "message_id": str(uuid.uuid4()),
            "samples": [
                {
                    "ts": now,
                    "temp": round(25 + random.random() * 5, 2),
                    "smoke": round(30 + random.random() * 10, 2),
                },
                {
                    "ts": now,
                    "temp": round(25 + random.random() * 5, 2),
                    "smoke": round(30 + random.random() * 10, 2),
                }
            ]
        }

        client.publish("device/data", json.dumps(live_msg))
        print(f"[LIVE][{device_id}] →", live_msg)

        # --------------------------------------------------------
        # 3️⃣  FLASH LOG DATA
        # --------------------------------------------------------
        flash_record = generate_sample()
        flash_record["device_id"] = device_id
        flash_record["message_id"] = str(uuid.uuid4())

        client.publish("device/logs", json.dumps(flash_record))
        print(f"[FLASH][{device_id}] →", flash_record)

        # small stagger so timestamps differ
        time.sleep(0.5)

    print("---- cycle complete ----\n")
    time.sleep(3)
