from fastapi import WebSocket
from typing import List
import asyncio
# ---------------------------------------------------------------------
# Broadcaster
# ---------------------------------------------------------------------
class Broadcaster:
    def __init__(self):
        self.clients: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self._lock:
            self.clients.append(ws)

    async def disconnect(self, ws: WebSocket):
        async with self._lock:
            if ws in self.clients:
                self.clients.remove(ws)

    async def broadcast_incident(self, incident: dict):
        async with self._lock:
            dead = []
            for ws in self.clients:
                try:
                    await ws.send_json({
                        "type": "incident:new",
                        "payload": incident
                    })
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.clients.remove(ws)

    async def broadcast_sensor(self, data: dict):
        async with self._lock:
            dead = []
            for ws in self.clients:
                try:
                    await ws.send_json({
                        "type": "sensor:update",
                        "payload": data
                    })
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.clients.remove(ws)