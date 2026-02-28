# app/main.py

import asyncio
import os
import uuid
from datetime import datetime
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db import init_db, SessionLocal
from app.models import (
    Incident, Device, SensorData, User, FireStation
)
from app.incidents import set_broadcaster
from app.incidents import set_event_loop
# from app.mqtt_worker import mqtt_loop
from app.incidents import set_broadcaster
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# ---------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------
app = FastAPI(title="FAS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

broadcaster = Broadcaster()
set_broadcaster(broadcaster)

# ---------------------------------------------------------------------
# Fire station seed
# ---------------------------------------------------------------------
def seed_fire_stations():
    db = SessionLocal()
    try:
        stations = [
            FireStation(
                station_id="STATION_A",
                name="Station A",
                lat=12.9716,
                lon=77.5946,
                status="available",
            ),
            FireStation(
                station_id="STATION_B",
                name="Station B",
                lat=12.9616,
                lon=77.5846,
                status="available",
            ),
            FireStation(
                station_id="STATION_C",
                name="Station C",
                lat=12.9816,
                lon=77.60466,
                status="available",
            ),
        ]
        for s in stations:
            if not db.query(FireStation).filter_by(station_id=s.station_id).first():
                db.add(s)
        db.commit()
    finally:
        db.close()


class UserCreate(BaseModel):
    name: str
    phone: str
    address: str | None = None
    photo: str | None = None

class DeviceRegister(BaseModel):
    device_id: str
    lat: float | None = None
    lon: float | None = None
    primary_station_id: str

    user: UserCreate

class DeviceCreate(BaseModel):
    device_id: str
    name: str | None = None
    lat: float | None = None
    lon: float | None = None

class UserSignup(BaseModel):
    name: str
    phone: str
    address: str
    email: str
    username: str
    password: str
    plan: str  # monthly | quarterly | yearly

class DeviceActivation(BaseModel):
    user_id: str
    device_id: str
    primary_station_id: str
    plan: str



class UserLogin(BaseModel):
    username: str
    password: str

# ---------------------------------------------------------------------
# API
# ---------------------------------------------------------------------
@app.get("/")
def root():
    return {"ok": True}

@app.get("/api/devices")
def list_devices():
    db = SessionLocal()
    try:
        return [
            {
                "device_id": d.device_id,
                "created_at": d.created_at.isoformat(),
                "meta": d.meta,
            }
            for d in db.query(Device)
            .order_by(Device.created_at.desc())
            .limit(500)
        ]
    finally:
        db.close()

@app.get("/api/sensors")
def list_sensor_data(
    device_id: str | None = None,
    incident_id: str | None = None,
    limit: int = 100
):
    db = SessionLocal()
    try:
        q = db.query(SensorData).order_by(SensorData.ts.desc())

        if incident_id:
            inc = db.query(Incident).filter_by(incident_id=incident_id).first()
            if not inc:
                raise HTTPException(status_code=404, detail="Incident not found")
            q = q.filter(SensorData.device_id == inc.device_id)

        if device_id:
            q = q.filter(SensorData.device_id == device_id)

        rows = q.limit(limit).all()

        return [
            {
                "device_id": r.device_id,
                "ts": r.ts,
                "temp": r.temp,
                "smoke": r.smoke,
            }
            for r in reversed(rows)  # chronological
        ]
    finally:
        db.close()


@app.get("/api/incidents")
def list_incidents(limit: int = 100, station_id: str | None = None):
    db = SessionLocal()
    try:
        q = db.query(Incident).order_by(Incident.created_at.desc())

        if station_id:
            q = q.join(Device).filter(
                or_(
                    Incident.assigned_station_id == station_id,
                    Device.primary_station_id == station_id,
                )
            )

        result = []
        for inc in q.limit(limit):
            device = inc.device
            user = device.user if device else None

            samples = (
                db.query(SensorData)
                .filter_by(device_id=inc.device_id)
                .order_by(SensorData.ts.desc())
                .limit(50)
            )

            result.append({
                "id": inc.incident_id,
                "device_id": inc.device_id,
                "alarm_type": inc.alarm_type,
                "confidence": inc.confidence,
                "status": inc.status,
                "created_at": inc.created_at.isoformat(),
                "assigned_station_id": inc.assigned_station_id,
                "lat": device.lat if device and device.lat else 12.9716,
                "lon": device.lon if device and device.lon else 77.5946,
                "user": {
                    "name": user.name,
                    "phone": user.phone,
                    "address": user.address,
                    "photo": user.photo_path,
                } if user else None,
                "sensor_timeline": [
                    {"ts": s.ts, "temp": s.temp, "smoke": s.smoke}
                    for s in reversed(list(samples))
                ],
                "payload": inc.payload,
            })

        return result
    finally:
        db.close()

# @app.post("/api/devices/register")
# def register_device(payload: DeviceRegister):
#     db: Session = SessionLocal()
#     try:
#         # 1️⃣ Check device
#         existing = db.query(Device).filter_by(device_id=payload.device_id).first()
#         if existing:
#             return {"status": "already_registered"}

#         # 2️⃣ Create user
#         user = User(
#             user_id=str(uuid.uuid4()),
#             name=payload.user.name,
#             phone=payload.user.phone,
#             address=payload.user.address,
#             photo_path=payload.user.photo,
#         )
#         db.add(user)
#         db.flush()  # get user_id

#         # 3️⃣ Create device
#         device = Device(
#             device_id=payload.device_id,
#             lat=payload.lat,
#             lon=payload.lon,
#             user_id=user.user_id,
#             primary_station_id=payload.primary_station_id,
#         )
#         db.add(device)
#         db.commit()

#         return {"status": "registered"}

#     finally:
#         db.close()

@app.post("/api/users/login")
def login_user(payload: UserLogin):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(username=payload.username).first()

        if not user:
            raise HTTPException(401, "Invalid credentials")

        if not pwd_context.verify(payload.password, user.password_hash):
            raise HTTPException(401, "Invalid credentials")

        if user.status != "active":
            raise HTTPException(403, "Account not activated")

        # get user's device
        device = db.query(Device).filter_by(user_id=user.user_id).first()

        return {
            "user_id": user.user_id,
            "username": user.username,
            "role": "CUSTOMER",
            "device_id": device.device_id if device else None
        }

    finally:
        db.close()

@app.post("/api/users/register")
def register_user(payload: UserSignup):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(
            or_(User.email == payload.email,
                User.username == payload.username)
        ).first()

        if existing:
            raise HTTPException(400, "User already exists")

        # plan pricing logic
        pricing = {
            "monthly": 500,
            "quarterly": 1400,
            "yearly": 5000
        }

        amount = pricing.get(payload.plan.lower())
        if not amount:
            raise HTTPException(400, "Invalid plan")

        user = User(
            user_id=str(uuid.uuid4()),
            name=payload.name,
            phone=payload.phone,
            address=payload.address,
            email=payload.email,
            username=payload.username,
            password_hash=pwd_context.hash(payload.password),
            plan=payload.plan,
            plan_amount=amount,
            status="pending_activation",
            role="CUSTOMER"
        )

        db.add(user)
        db.commit()

        return {"status": "registered", "amount": amount}

    finally:
        db.close()

@app.get("/api/users/pending")
def list_pending_users():
    db = SessionLocal()
    try:
        users = db.query(User).filter_by(
            status="pending_activation"
        ).all()

        return [
            {
                "user_id": u.user_id,
                "name": u.name,
                "phone": u.phone,
                "plan": u.plan,
                "amount": u.plan_amount
            }
            for u in users
        ]
    finally:
        db.close()


@app.post("/api/devices/activate")
def activate_device(payload: DeviceActivation):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(user_id=payload.user_id).first()
        if not user:
            raise HTTPException(404, "User not found")

        # update plan if changed
        pricing = {
            "monthly": 500,
            "quarterly": 1400,
            "yearly": 5000
        }

        user.plan = payload.plan
        user.plan_amount = pricing.get(payload.plan)
        user.status = "active"

        # create device
        device = Device(
            device_id=payload.device_id,
            user_id=user.user_id,
            primary_station_id=payload.primary_station_id,
            activated_at=datetime.utcnow()
        )

        db.add(device)
        db.commit()

        return {"status": "activated"}

    finally:
        db.close()


@app.get("/api/fire-stations")
def list_fire_stations():
    db = SessionLocal()
    try:
        stations = db.query(FireStation).all()
        return [
            {
                "station_id": s.station_id,
                "name": s.name,
                "lat": s.lat,
                "lon": s.lon,
                "status": s.status,
            }
            for s in stations
        ]
    finally:
        db.close()

# ---------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------
@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await broadcaster.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        await broadcaster.disconnect(ws)

# ---------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    init_db()
    seed_fire_stations()
    loop = asyncio.get_running_loop()
    set_event_loop(loop)

    # 🚀 START MQTT WORKER
    # asyncio.create_task(mqtt_loop())