import json
from app.redis_client import redis_client

async def publish_incident_event(payload: dict):
    await redis_client.publish("incident_events", json.dumps(payload))

async def publish_sensor_event(payload: dict):
    await redis_client.publish("sensor_events", json.dumps(payload))