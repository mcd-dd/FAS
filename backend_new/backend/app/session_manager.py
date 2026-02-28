# app/session_manager.py

import uuid
import json
from datetime import datetime, timedelta
from app.redis_client import redis_client

SESSION_TTL_SECONDS = 60 * 60 * 24  # 24 hours

async def create_session(user_id: str, role: str, station_id: str, vehicle_id=None):
    session_id = str(uuid.uuid4())

    session_data = {
        "user_id": user_id,
        "role": role,
        "created_at": datetime.utcnow().isoformat(),
        "station_id": station_id,
        "vehicle_id": vehicle_id
    }

    await redis_client.set(
        f"session:{session_id}",
        json.dumps(session_data),
        ex=SESSION_TTL_SECONDS
    )

    return session_id


async def get_session(session_id: str):
    data = await redis_client.get(f"session:{session_id}")
    if not data:
        return None

    return json.loads(data)


async def delete_session(session_id: str):
    await redis_client.delete(f"session:{session_id}")