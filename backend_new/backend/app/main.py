# app/main.py

import asyncio
import uuid
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import or_

from app.db import init_db, SessionLocal
from app.models import (
    Incident, Device, SensorData, User, FireStation, OperatorAction, FireVehicle, RechargeHistory, VehicleOperatorAssignment
)
# from app.incidents import set_broadcaster
# from app.incidents import set_event_loop
# from app.mqtt_worker import mqtt_loop
# from app.incidents import set_broadcaster
from passlib.context import CryptContext

from fastapi import Depends
from app.session_manager import create_session, get_session

from fastapi import Header

from app.redis_client import redis_client
import json

from app.broadcaster import Broadcaster

# import razorpay
# import os


# def get_razorpay_client():
#     key_id = os.getenv("RAZORPAY_KEY_ID")
#     key_secret = os.getenv("RAZORPAY_KEY_SECRET")

#     if not key_id or not key_secret:
#         raise HTTPException(500, "Razorpay not configured")

#     return razorpay.Client(auth=(key_id, key_secret))   

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

###### REDIS Listener #################
async def redis_listener():
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("incident_events", "sensor_events")

    async for message in pubsub.listen():
        if message["type"] == "message":
            data = json.loads(message["data"])

            if message["channel"] == "incident_events":
                await broadcaster.broadcast_incident(data)

            elif message["channel"] == "sensor_events":
                await broadcaster.broadcast_sensor(data)


###### Get Current Session Data #################
async def get_current_user(
    session_id: str = Header(None)
):
    if not session_id:
        raise HTTPException(status_code=401, detail="No session")

    session = await get_session(session_id)

    if not session:
        raise HTTPException(status_code=401, detail="Session expired")

    return session

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



broadcaster = Broadcaster()
# set_broadcaster(broadcaster)

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


######## PYDANTIC Schema Validation

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

class OperatorActionPayload(BaseModel):
    incident_id: str
    action: str  # ACCEPT | DESPATCH | REJECT
    station_id: str
    user: str
    ts: str | None = None
    transfer_to_station: str | None = None

class VehicleCreate(BaseModel):
    vehicle_id: str
    name: str
    station_id: str

class VehicleUpdate(BaseModel):
    status: str  # AVAILABLE | MAINTENANCE

class VehicleLocationUpdate(BaseModel):
    vehicle_id: str
    lat: float
    lon: float

class CreateOrderRequest(BaseModel):
    plan: str

class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    plan: str

# ---------------------------------------------------------------------
# API
# ---------------------------------------------------------------------
@app.get("/")
def root():
    return {"ok": True}

@app.get("/api/v1/devices")
def list_devices(session=Depends(get_current_user)):
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

# @app.get("/api/v1/sensors")
# def list_sensor_data(
#     device_id: str | None = None,
#     incident_id: str | None = None,
#     limit: int = 100,
#     current=Depends(get_current_user)
# ):
#     db = SessionLocal()
#     try:

#         role = current["role"]

#         # Base query
#         q = db.query(SensorData).join(Device)

#         # 🔐 CUSTOMER → Only their device
#         if role == "CUSTOMER":
#             q = q.filter(Device.user_id == current["user_id"])

#         # 🔐 STATION → Only station devices
#         elif role == "STATION":
#             q = q.filter(
#                 Device.primary_station_id == current["station_id"]
#             )

#         # 🔐 VEHICLE_OPERATOR → Only assigned incident device
#         elif role == "VEHICLE_OPERATOR":
#             incident = db.query(Incident).filter_by(
#                 vehicle_id=current["vehicle_id"],
#                 status="DESPATCHED"
#             ).first()

#             if incident:
#                 q = q.filter(SensorData.device_id == incident.device_id)
#             else:
#                 return []

#         # 🔐 NFS → Full access
#         elif role == "NFS":
#             pass

#         # q = db.query(SensorData).order_by(SensorData.ts.desc())

#         if incident_id:
#             inc = db.query(Incident).filter_by(incident_id=incident_id).first()
#             if not inc:
#                 raise HTTPException(status_code=404, detail="Incident not found")
#             q = q.filter(SensorData.device_id == inc.device_id)

#         if device_id:
#             q = q.filter(SensorData.device_id == device_id)

#         rows = (
#             q.order_by(SensorData.ts.desc())
#             .limit(limit)
#             .all()
#         )

#         return [
#             {
#                 "device_id": r.device_id,
#                 "ts": r.ts,
#                 "temp": r.temp,
#                 "smoke": r.smoke,
#             }
#             for r in reversed(rows)  # chronological
#         ]
#     finally:
#         db.close()

@app.get("/api/v1/sensors")
def list_sensor_data(
    device_id: str | None = None,
    incident_id: str | None = None,
    limit: int = 100,
    current=Depends(get_current_user)
):
    db = SessionLocal()
    try:

        # 🔥 PRIORITY — If incident_id given, ignore role filtering
        if incident_id:
            inc = db.query(Incident).filter_by(
                incident_id=incident_id
            ).first()

            if not inc:
                raise HTTPException(404, "Incident not found")

            rows = (
                db.query(SensorData)
                .filter(SensorData.device_id == inc.device_id)
                .order_by(SensorData.ts.desc())
                .limit(limit)
                .all()
            )

            return [
                {
                    "device_id": r.device_id,
                    "ts": r.ts,
                    "temp": r.temp,
                    "smoke": r.smoke,
                }
                for r in reversed(rows)
            ]

        # 🔐 ROLE FILTER ONLY WHEN NO INCIDENT_ID
        role = current["role"]
        q = db.query(SensorData).join(Device)

        if role == "CUSTOMER":
            q = q.filter(Device.user_id == current["user_id"])

        elif role == "STATION":
            q = q.filter(
                Device.primary_station_id == current["station_id"]
            )

        elif role == "NFS":
            pass

        rows = (
            q.order_by(SensorData.ts.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "device_id": r.device_id,
                "ts": r.ts,
                "temp": r.temp,
                "smoke": r.smoke,
            }
            for r in reversed(rows)
        ]

    finally:
        db.close()

# @app.get("/api/v1/sensors")
# def list_sensor_data(
#     device_id: str | None = None,
#     incident_id: str | None = None,
#     limit: int = 100,
#     current=Depends(get_current_user)
# ):
#     db = SessionLocal()
#     try:
#         role = current["role"]

#         # 🔥 PRIORITY 1 — If incident_id is given, ignore everything else
#         if incident_id:
#             inc = db.query(Incident).filter_by(
#                 incident_id=incident_id
#             ).first()

#             if not inc:
#                 raise HTTPException(404, "Incident not found")

#             rows = (
#                 db.query(SensorData)
#                 .filter(SensorData.device_id == inc.device_id)
#                 .order_by(SensorData.ts.desc())
#                 .limit(limit)
#                 .all()
#             )

#             return [
#                 {
#                     "device_id": r.device_id,
#                     "ts": r.ts,
#                     "temp": r.temp,
#                     "smoke": r.smoke,
#                 }
#                 for r in reversed(rows)
#             ]

#         # 🔐 ROLE-BASED FALLBACK
#         q = db.query(SensorData).join(Device)

#         if role == "CUSTOMER":
#             q = q.filter(Device.user_id == current["user_id"])

#         elif role == "STATION":
#             q = q.filter(Device.primary_station_id == current["station_id"])

#         elif role == "NFS":
#             pass

#         rows = (
#             q.order_by(SensorData.ts.desc())
#             .limit(limit)
#             .all()
#         )

#         return [
#             {
#                 "device_id": r.device_id,
#                 "ts": r.ts,
#                 "temp": r.temp,
#                 "smoke": r.smoke,
#             }
#             for r in reversed(rows)
#         ]

#     finally:
#         db.close()

# @app.get("/api/v1/incidents")
# def list_incidents(limit: int = 100, station_id: str | None = None, device_id: str | None = None, current=Depends(get_current_user)):
#     db = SessionLocal()
#     try:

#         q = db.query(Incident).order_by(Incident.created_at.desc())

#         role = current["role"]

#         if role == "CUSTOMER":
#             # Only their device
#             q = q.join(Device).filter(
#                 Device.user_id == current["user_id"]
#             )

#         elif role == "STATION":
#             q = q.join(Device).filter(
#                 or_(
#                     Incident.assigned_station_id == current["station_id"],
#                     Device.primary_station_id == current["station_id"],
#                 )
#             )
#             q = q.filter(Incident.alarm_type.in_(["FIRE", "TEMP"]))

#         elif role == "VEHICLE_OPERATOR":

#             # Get logged-in user
#             assignment = db.query(VehicleOperatorAssignment).filter_by(
#                 user_id=current["user_id"],
#                 active=True
#             ).first()

#             if not assignment:
#                 return []

#             q = q.filter(Incident.vehicle_id == assignment.vehicle_id)

#         elif role == "NFS":
#             # Access all
#             q = q.filter(Incident.alarm_type.in_(["FIRE", "TEMP"]))
#             pass
    
#         # if station_id:
#         #     q = q.join(Device).filter(
#         #         or_(
#         #             Incident.assigned_station_id == station_id,
#         #             Device.primary_station_id == station_id,
#         #         )
#         #     )

#         if device_id:
#             q = q.filter(Incident.device_id == device_id)
            
#         result = []
#         for inc in q.limit(limit):
#             device = inc.device
#             user = device.user if device else None

#             samples = (
#                 db.query(SensorData)
#                 .filter_by(device_id=inc.device_id)
#                 .order_by(SensorData.ts.desc())
#                 .limit(50)
#                 .all()
#             )

#             result.append({
#                 "id": inc.incident_id,
#                 "device_id": inc.device_id,
#                 "alarm_type": inc.alarm_type,
#                 "confidence": inc.confidence,
#                 "status": inc.status,
#                 "created_at": inc.created_at.isoformat(),
#                 "assigned_station_id": inc.assigned_station_id,
#                 "lat": device.lat if device and device.lat else 12.9716,
#                 "lon": device.lon if device and device.lon else 77.5946,
#                 "user": {
#                     "name": user.name,
#                     "phone": user.phone,
#                     "address": user.address,
#                     "photo": user.photo_path,
#                 } if user else None,
#                 "sensor_timeline": [
#                     {"ts": s.ts, "temp": s.temp, "smoke": s.smoke}
#                     for s in reversed(list(samples))
#                 ],
#                 "payload": inc.payload,
#             })

#         return result
#     finally:
#         db.close()



@app.get("/api/v1/incidents")
def list_incidents(limit: int = 100, station_id: str | None = None, device_id: str | None = None, current=Depends(get_current_user)):
    db = SessionLocal()
    try:

        q = db.query(Incident).order_by(Incident.created_at.desc())

        role = current["role"]

        if role == "CUSTOMER":
            # Only their device
            q = q.join(Device).filter(
                Device.user_id == current["user_id"]
            )

        elif role == "STATION":
            q = q.join(Device).filter(
                or_(
                    Incident.assigned_station_id == current["station_id"],
                    Device.primary_station_id == current["station_id"],
                )
            )
            q = q.filter(Incident.alarm_type.in_(["FIRE", "TEMP"]))

        elif role == "VEHICLE_OPERATOR":

            # Get logged-in user
            assignment = db.query(VehicleOperatorAssignment).filter_by(
                user_id=current["user_id"],
                active=True
            ).first()

            if not assignment:
                return []

            q = q.filter(Incident.vehicle_id == assignment.vehicle_id)

        elif role == "NFS":
            # Access all
            q = q.filter(Incident.alarm_type.in_(["FIRE", "TEMP"]))
            q = q.filter(
                Incident.escalated_to_nfs
            )
            pass
    
        # if station_id:
        #     q = q.join(Device).filter(
        #         or_(
        #             Incident.assigned_station_id == station_id,
        #             Device.primary_station_id == station_id,
        #         )
        #     )

        if device_id:
            q = q.filter(Incident.device_id == device_id)
            
        result = []
        for inc in q.limit(limit):
            device = inc.device
            user = device.user if device else None

            samples = (
                db.query(SensorData)
                .filter_by(device_id=inc.device_id)
                .order_by(SensorData.ts.desc())
                .limit(50)
                .all()
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

                # 🔥 ADD THESE
                "escalated_to_nfs": inc.escalated_to_nfs,
                "rejected_by_station": inc.rejected_by_station,
                "transferred_to_station": inc.transferred_to_station,

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

# @app.post("/api/v1/users/login")
# async def login_user(payload: UserLogin):
#     db = SessionLocal()
#     try:
#         user = db.query(User).filter_by(username=payload.username).first()

#         if not user:
#             raise HTTPException(401, "Invalid credentials")

#         if not pwd_context.verify(payload.password, user.password_hash):
#             raise HTTPException(401, "Invalid credentials")

#         if user.status != "active":
#             raise HTTPException(403, "Account not activated")

#         # get user's device
#         device = db.query(Device).filter_by(user_id=user.user_id).first()
#         if user.role == "STATION":
#             # derive station from username
#             if user.username == "stationA":
#                 station_id = "STATION_A"
#             elif user.username == "stationB":
#                 station_id = "STATION_B"
#             elif user.username == "stationC":
#                 station_id = "STATION_C"
#         else:
#             device = db.query(Device).filter_by(user_id=user.user_id).first()
#             station_id = None
#             if device:
#                 station_id = device.primary_station_id
        
#         # vehicle_id = user.vehicle_id

#         if user.role == "VEHICLE_OPERATOR":
#             assignment = db.query(VehicleOperatorAssignment).filter_by(
#                 user_id=user.user_id,
#                 active=True
#             ).first()

#             vehicle_id = assignment.vehicle_id if assignment else None
        
#         # station_id = None
#         # if device:
#             # station_id = device.primary_station_id if device else None

#         session_id = await create_session(
#             user.user_id,
#             user.role,
#             station_id,
#             vehicle_id
#         )

#         return {
#             "user_id": user.user_id,
#             "username": user.username,
#             "role": user.role,
#             "device_id": device.device_id if device else None,
#             "station_id": station_id,
#             "session_id": session_id,
#             "vehicle_id": vehicle_id
#         }

#     finally:
#         db.close()

@app.post("/api/v1/users/login")
async def login_user(payload: UserLogin):
    print("USERNAME RECEIVED:", payload.username)
    print("PASSWORD RECEIVED:", payload.password)
    
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(username=payload.username).first()

        if not user:
            raise HTTPException(401, "Invalid credentials")

        if not pwd_context.verify(payload.password, user.password_hash):
            raise HTTPException(401, "Invalid credentials")

        if user.status != "active":
            raise HTTPException(403, "Account not activated")

        vehicle_id = None
        station_id = None
        device = None

        # -----------------------
        # STATION ROLE
        # -----------------------
        if user.role == "STATION":
            if user.username == "stationA":
                station_id = "STATION_A"
            elif user.username == "stationB":
                station_id = "STATION_B"
            elif user.username == "stationC":
                station_id = "STATION_C"

        # -----------------------
        # VEHICLE OPERATOR ROLE
        # -----------------------
        elif user.role == "VEHICLE_OPERATOR":
            assignment = db.query(VehicleOperatorAssignment).filter_by(
                user_id=user.user_id,
                active=True
            ).first()

            if assignment:
                vehicle_id = assignment.vehicle_id

        # -----------------------
        # CUSTOMER ROLE
        # -----------------------
        else:
            device = db.query(Device).filter_by(
                user_id=user.user_id
            ).first()

            if device:
                station_id = device.primary_station_id

        # -----------------------
        # CREATE SESSION
        # -----------------------
        session_id = await create_session(
            user.user_id,
            user.role,
            station_id,
            vehicle_id
        )

        return {
            "user_id": user.user_id,
            "username": user.username,
            "role": user.role,
            "device_id": device.device_id if device else None,
            "station_id": station_id,
            "vehicle_id": vehicle_id,
            "session_id": session_id,
        }

    finally:
        db.close()

# @app.post("/api/v1/login")
# def login(role: str, station_id: str | None = None):
#     session_id = str(uuid.uuid4())

#     SESSIONS[session_id] = {
#         "role": role,
#         "station_id": station_id
#     }

#     return {
#         "session_id": session_id,
#         "role": role,
#         "station_id": station_id
#     }

@app.post("/api/v1/users/register")
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

@app.get("/api/v1/users/pending")
def list_pending_users(current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        if current["role"] == "CUSTOMER":
            return
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


@app.post("/api/v1/devices/activate")
def activate_device(payload: DeviceActivation,current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        if current["role"] == "CUSTOMER":
            return

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


@app.get("/api/v1/fire-stations")
def list_fire_stations():
    db = SessionLocal()
    try:
        stations = db.query(FireStation).all()

        result = []

        for s in stations:
            available_vehicle = db.query(FireVehicle).filter_by(
                station_id=s.station_id,
                status="AVAILABLE"
            ).first()

            result.append({
                "station_id": s.station_id,
                "name": s.name,
                "lat": s.lat,
                "lon": s.lon,
                "status": s.status,
                "has_available_vehicle": True if available_vehicle else False
            })

        return result

    finally:
        db.close()

# @app.post("/api/v1/operator/action")
# async def operator_action(
#     payload: OperatorActionPayload,
#     current=Depends(get_current_user)
# ):
#     db = SessionLocal()

#     try:

#         if current["role"] not in ["STATION", "NFS"]:
#             return

#         incident = db.query(Incident).filter_by(
#             incident_id=payload.incident_id
#         ).first()

#         if not incident:
#             raise HTTPException(404, "Incident not found")

#         # -----------------------------
#         # ACCEPT
#         # -----------------------------
#         if payload.action == "ACCEPT":
#             incident.status = "ACCEPTED"
#             incident.vehicle_ready = True

#         # -----------------------------
#         # DESPATCH
#         # -----------------------------
#         elif payload.action == "DESPATCH":
#             if incident.status != "ACCEPTED":
#                 raise HTTPException(400, "Incident not accepted yet")

#             incident.status = "DESPATCHED"
#             incident.vehicle_despatched = True

#         # -----------------------------
#         # REJECT → Transfer
#         # -----------------------------
#         elif payload.action == "REJECT":

#             # find nearest station (simple logic)
#             stations = db.query(FireStation).all()

#             nearest = min(
#                 stations,
#                 key=lambda s: (
#                     (s.lat - incident.device.lat) ** 2 +
#                     (s.lon - incident.device.lon) ** 2
#                 )
#             )

#             incident.assigned_station_id = nearest.station_id
#             incident.status = "TRANSFERRED"

#         else:
#             raise HTTPException(400, "Invalid action")

#         # log action
#         action_log = OperatorAction(
#             incident_id=payload.incident_id,
#             action=payload.action,
#             station_id=payload.station_id,
#             user=payload.user,
#             ts=datetime.utcnow()
#         )

#         db.add(action_log)
#         db.commit()

#         # Broadcast update to websocket clients
#         await broadcaster.broadcast_incident({
#             "type": "incident:update",
#             "payload": {
#                 "id": incident.incident_id,
#                 "status": incident.status,
#                 "assigned_station_id": incident.assigned_station_id,
#                 "vehicle_ready": incident.vehicle_ready,
#                 "vehicle_despatched": incident.vehicle_despatched,
#             }
#         })

#         return {"status": "ok"}

#     finally:
#         db.close()



@app.post("/api/v1/createvehicles")
def create_vehicle(payload: VehicleCreate, current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        if current["role"] != "STATION":
            raise HTTPException(403)

        vehicle = FireVehicle(
            vehicle_id=payload.vehicle_id,
            name=payload.name,
            station_id=payload.station_id,
            status="AVAILABLE"
        )

        db.add(vehicle)
        db.commit()

        return {"status": "created"}
    finally:
        db.close()


@app.get("/api/v1/listvehicles")
def list_vehicles(current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        if current["role"] == "STATION":
            vehicles = db.query(FireVehicle).filter_by(
                station_id=current["station_id"]
            ).all()
        else:
            vehicles = db.query(FireVehicle).all()

        return [
            {
                "vehicle_id": v.vehicle_id,
                "name": v.name,
                "status": v.status,
                "station_id": v.station_id
            }
            for v in vehicles
        ]
    finally:
        db.close()


@app.put("/api/v1/updatevehicles/{vehicle_id}")
def update_vehicle(vehicle_id: str, payload: VehicleUpdate, current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        vehicle = db.query(FireVehicle).filter_by(vehicle_id=vehicle_id).first()

        if not vehicle:
            raise HTTPException(404)

        vehicle.status = payload.status
        db.commit()

        return {"status": "updated"}
    finally:
        db.close()

@app.post("/api/v1/operator/action")
async def operator_action(
    payload: OperatorActionPayload,
    current=Depends(get_current_user)
):
    db = SessionLocal()

    try:

        if current["role"] not in ["STATION", "NFS"]:
            return

        incident = db.query(Incident).filter_by(
            incident_id=payload.incident_id
        ).first()

        if not incident:
            raise HTTPException(404, "Incident not found")

        # -----------------------------
        # ACCEPT
        # -----------------------------
        if payload.action == "ACCEPT":

            if current["role"] == "STATION":
                if payload.station_id != current["station_id"]:
                    raise HTTPException(403, "Invalid station")
            
            # find available vehicle
            vehicle = db.query(FireVehicle).filter_by(
                station_id=payload.station_id,
                status="AVAILABLE"
            ).first()

            if not vehicle:
                raise HTTPException(400, "No available vehicle")

            vehicle.status = "ASSIGNED"

            incident.vehicle_id = vehicle.vehicle_id
            incident.status = "ACCEPTED"
            incident.assigned_station_id = payload.station_id

        # -----------------------------
        # DESPATCH
        # -----------------------------
        elif payload.action == "DESPATCH":

            if not incident.vehicle_id:
                raise HTTPException(400, "No vehicle assigned")


            vehicle = db.query(FireVehicle).filter_by(
                vehicle_id=incident.vehicle_id
            ).first()

            vehicle.status = "IN_OPERATION"
            incident.status = "DESPATCHED"

        # -----------------------------
        # REJECT → Transfer
        # -----------------------------
        elif payload.action == "REJECT":

            if incident.vehicle:
                incident.vehicle.status = "AVAILABLE"

            incident.vehicle_id = None
            incident.status = "ESCALATED"
            incident.escalated_to_nfs = True
            incident.rejected_by_station = current["station_id"]
            incident.escalated_at = datetime.utcnow()
            incident.vehicle_id = None
            incident.assigned_station_id = None

        elif payload.action == "TRANSFER":

            if current["role"] != "NFS":
                raise HTTPException(403)

            incident.assigned_station_id = payload.transfer_to_station   # 🔥 IMPORTANT
            incident.transferred_to_station = payload.transfer_to_station
            incident.status = "new"  # or NEW
            incident.transferred_at = datetime.utcnow()
            incident.assigned_station_id = payload.transfer_to_station
            incident.escalated_to_nfs = False

        # log action
        action_log = OperatorAction(
            incident_id=payload.incident_id,
            action=payload.action,
            station_id=payload.station_id,
            user=payload.user,
            ts=datetime.utcnow()
        )

        db.add(action_log)
        db.commit()

        # Broadcast update to websocket clients
        await broadcaster.broadcast_incident({
            "type": "incident:update",
            "payload": {
                "id": incident.incident_id,
                "status": incident.status,
                "assigned_station_id": incident.assigned_station_id,
                "vehicle_ready": incident.vehicle_ready,
                "vehicle_despatched": incident.vehicle_despatched,
            }
        })

        return {"status": "ok"}

    finally:
        db.close()

# @app.post("/api/v1/operator/action")
# async def operator_action(
#     payload: OperatorActionPayload,
#     current=Depends(get_current_user)
# ):
#     db = SessionLocal()

#     try:

#         if current["role"] not in ["STATION", "NFS"]:
#             return

#         incident = db.query(Incident).filter_by(
#             incident_id=payload.incident_id
#         ).first()

#         if not incident:
#             raise HTTPException(404, "Incident not found")

#         # -----------------------------
#         # ACCEPT
#         # -----------------------------
#         if payload.action == "ACCEPT":

#             if current["role"] == "STATION":
#                 if payload.station_id != current["station_id"]:
#                     raise HTTPException(403, "Invalid station")
            
#             # find available vehicle
#             vehicle = db.query(FireVehicle).filter_by(
#                 station_id=payload.station_id,
#                 status="AVAILABLE"
#             ).first()

#             if not vehicle:
#                 raise HTTPException(400, "No available vehicle")

#             vehicle.status = "ASSIGNED"

#             incident.vehicle_id = vehicle.vehicle_id
#             incident.status = "ACCEPTED"
#             incident.assigned_station_id = payload.station_id

#         # -----------------------------
#         # DESPATCH
#         # -----------------------------
#         elif payload.action == "DESPATCH":

#             if not incident.vehicle_id:
#                 raise HTTPException(400, "No vehicle assigned")


#             vehicle = db.query(FireVehicle).filter_by(
#                 vehicle_id=incident.vehicle_id
#             ).first()

#             vehicle.status = "IN_OPERATION"
#             incident.status = "DESPATCHED"

#         # -----------------------------
#         # REJECT → Transfer
#         # -----------------------------
#         elif payload.action == "REJECT":

#             if incident.vehicle:
#                 incident.vehicle.status = "AVAILABLE"

#             incident.vehicle_id = None
#             incident.status = "TRANSFERRED"

#         # log action
#         action_log = OperatorAction(
#             incident_id=payload.incident_id,
#             action=payload.action,
#             station_id=payload.station_id,
#             user=payload.user,
#             ts=datetime.utcnow()
#         )

#         db.add(action_log)
#         db.commit()

#         # Broadcast update to websocket clients
#         await broadcaster.broadcast_incident({
#             "type": "incident:update",
#             "payload": {
#                 "id": incident.incident_id,
#                 "status": incident.status,
#                 "assigned_station_id": incident.assigned_station_id,
#                 "vehicle_ready": incident.vehicle_ready,
#                 "vehicle_despatched": incident.vehicle_despatched,
#             }
#         })

#         return {"status": "ok"}

#     finally:
#         db.close()



@app.post("/api/v1/vehicle/location")
async def update_vehicle_location(
    payload: VehicleLocationUpdate,
    current=Depends(get_current_user)
):
    db = SessionLocal()
    try:

        if current["role"] != "VEHICLE_OPERATOR":
            raise HTTPException(403)
        
        if current["vehicle_id"] != payload.vehicle_id:
            raise HTTPException(403, "Not your vehicle")

        vehicle = db.query(FireVehicle).filter_by(
            vehicle_id=payload.vehicle_id
        ).first()

        if not vehicle:
            raise HTTPException(404)

        vehicle.lat = payload.lat
        vehicle.lon = payload.lon
        vehicle.last_location_update = datetime.utcnow()

        db.commit()

        # 🔴 Broadcast to dashboards
        await broadcaster.broadcast_incident({
            "type": "vehicle:update",
            "payload": {
                "vehicle_id": vehicle.vehicle_id,
                "lat": vehicle.lat,
                "lon": vehicle.lon
            }
        })

        return {"status": "updated"}

    finally:
        db.close()

@app.get("/api/v1/getprofile")
def get_profile(current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(
            user_id=current["user_id"]
        ).first()

        if not user:
            raise HTTPException(404, "User not found")

        return {
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "address": user.address,
            "plan": user.plan,
            "role": user.role
        }
    finally:
        db.close()

class UserProfileUpdate(BaseModel):
    name: str
    phone: str
    address: str

@app.put("/api/v1/updateprofile")
def update_profile(
    payload: UserProfileUpdate,
    current=Depends(get_current_user)
):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(
            user_id=current["user_id"]
        ).first()

        if not user:
            raise HTTPException(404)

        user.name = payload.name
        user.phone = payload.phone
        user.address = payload.address

        db.commit()

        return {"status": "updated"}
    finally:
        db.close()


class RechargeRequest(BaseModel):
    plan: str
    payment_method: str


@app.post("/api/v1/recharge")
def recharge_user(payload: RechargeRequest, current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(
            user_id=current["user_id"]
        ).first()

        if not user:
            raise HTTPException(404, "User not found")

        pricing = {
            "monthly": 500,
            "quarterly": 1400,
            "yearly": 5000
        }

        amount = pricing.get(payload.plan.lower())
        if not amount:
            raise HTTPException(400, "Invalid plan")

        # Update user plan
        user.plan = payload.plan
        user.plan_amount = amount
        user.status = "active"

        # Insert history record
        history = RechargeHistory(
            user_id=user.user_id,
            plan=payload.plan,
            amount=amount,
            payment_method=payload.payment_method,
            status="SUCCESS"
        )

        db.add(history)
        db.commit()

        return {"status": "recharged"}

    finally:
        db.close()

@app.get("/api/v1/recharge/history")
def get_recharge_history(current=Depends(get_current_user)):
    db = SessionLocal()
    try:
        # records = db.query(RechargeHistory).filter_by(
        #     user_id=current["user_id"]
        # ).order_by(RechargeHistory.created_at.desc()).all()

        records = db.query(RechargeHistory).all() 

        return [
            {
                "plan": r.plan,
                "amount": r.amount,
                "payment_method": r.payment_method,
                "status": r.status,
                "date": r.created_at.isoformat()
            }
            for r in records
        ]
    finally:
        db.close()


# @app.post("/api/v1/payment/create-order")
# def create_order(payload: CreateOrderRequest, current=Depends(get_current_user)):

#     client = get_razorpay_client()

#     pricing = {
#         "monthly": 500,
#         "quarterly": 1400,
#         "yearly": 5000
#     }

#     amount = pricing.get(payload.plan.lower())
#     if not amount:
#         raise HTTPException(400, "Invalid plan")

#     order = client.order.create({
#         "amount": amount * 100,
#         "currency": "INR",
#         "payment_capture": 1
#     })

#     return {
#         "order_id": order["id"],
#         "amount": amount,
#         "key": os.getenv("RAZORPAY_KEY_ID")
#     }

# @app.post("/api/v1/payment/verify")
# def verify_payment(payload: VerifyPaymentRequest, current=Depends(get_current_user)):
#     db = SessionLocal()
#     try:
#         client = get_razorpay_client()

#         params_dict = {
#             "razorpay_order_id": payload.razorpay_order_id,
#             "razorpay_payment_id": payload.razorpay_payment_id,
#             "razorpay_signature": payload.razorpay_signature
#         }

#         client.utility.verify_payment_signature(params_dict)

#         # Signature valid → update user
#         pricing = {
#             "monthly": 500,
#             "quarterly": 1400,
#             "yearly": 5000
#         }

#         amount = pricing.get(payload.plan.lower())

#         user = db.query(User).filter_by(
#             user_id=current["user_id"]
#         ).first()

#         user.plan = payload.plan
#         user.plan_amount = amount
#         user.status = "active"

#         history = RechargeHistory(
#             user_id=user.user_id,
#             plan=payload.plan,
#             amount=amount,
#             payment_method="razorpay",
#             status="SUCCESS"
#         )

#         db.add(history)
#         db.commit()

#         return {"status": "verified"}

#     except razorpay.errors.SignatureVerificationError:
#         raise HTTPException(400, "Payment verification failed")
# ---------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------
# @app.websocket("/ws")
# async def ws_endpoint(ws: WebSocket):
#     await broadcaster.connect(ws)
#     try:
#         while True:
#             await ws.receive_text()
#     except WebSocketDisconnect:
#         await broadcaster.disconnect(ws)

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):

    session_id = ws.query_params.get("session_id")

    if not session_id:
        await ws.close(code=1008)
        return

    session = await get_current_user(session_id)
    if not session:
        await ws.close(code=1008)
        return

    await broadcaster.connect(ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        await broadcaster.disconnect(ws)



def seed_internal_users():
    db = SessionLocal()
    try:
        users = [
            User(
                user_id=str(uuid.uuid4()),
                name="NFS Core",
                phone="0000000000",
                email="nfs@system.local",
                username="nfs",
                password_hash=pwd_context.hash("nfs123"),
                role="NFS",
                status="active"
            ),
            User(
                user_id=str(uuid.uuid4()),
                name="Station A Operator",
                phone="0000000001",
                email="stationA@system.local",
                username="stationA",
                password_hash=pwd_context.hash("station123"),
                role="STATION",
                status="active"
            ),
            User(
                user_id=str(uuid.uuid4()),
                name="Station B Operator",
                phone="0000000002",
                email="stationB@system.local",
                username="stationB",
                password_hash=pwd_context.hash("station123"),
                role="STATION",
                status="active"
            ),
            User(
                user_id=str(uuid.uuid4()),
                name="Station C Operator",
                phone="0000000003",
                email="stationC@system.local",
                username="stationC",
                password_hash=pwd_context.hash("station123"),
                role="STATION",
                status="active"
            ),
            User(
                user_id=str(uuid.uuid4()),
                name="Installer",
                phone="0000000004",
                email="installer@system.local",
                username="installer",
                password_hash=pwd_context.hash("install123"),
                role="INSTALL_OPERATOR",
                status="active"
            ),
            User(
                user_id=str(uuid.uuid4()),
                name="VehicleOperatorA1",
                phone="0000000005",
                email="vehicleopA1@system.local",
                username="vehicleA1",
                password_hash=pwd_context.hash("vehicle123"),
                role="VEHICLE_OPERATOR",
                status="active"
            ),
            User(
                user_id=str(uuid.uuid4()),
                name="VehicleOperatorA2",
                phone="0000000006",
                email="vehicleopA2@system.local",
                username="vehicleA2",
                password_hash=pwd_context.hash("vehicle123"),
                role="VEHICLE_OPERATOR",
                status="active"
            ),
            User(
                user_id=str(uuid.uuid4()),
                name="VehicleOperatorB1",
                phone="0000000007",
                email="vehicleopB1@system.local",
                username="vehicleB1",
                password_hash=pwd_context.hash("vehicle123"),
                role="VEHICLE_OPERATOR",
                status="active"
            ),
            User(
                user_id=str(uuid.uuid4()),
                name="VehicleOperatorB2",
                phone="0000000008",
                email="vehicleopB2@system.local",
                username="vehicleB2",
                password_hash=pwd_context.hash("vehicle123"),
                role="VEHICLE_OPERATOR",
                status="active"
            ),
            User(
                user_id=str(uuid.uuid4()),
                name="VehicleOperatorC1",
                phone="0000000008",
                email="vehicleopC1@system.local",
                username="vehicleC1",
                password_hash=pwd_context.hash("vehicle123"),
                role="VEHICLE_OPERATOR",
                status="active"
            ),
            User(
                user_id=str(uuid.uuid4()),
                name="VehicleOperatorC2",
                phone="0000000009",
                email="vehicleopC2@system.local",
                username="vehicleC2",
                password_hash=pwd_context.hash("vehicle123"),
                role="VEHICLE_OPERATOR",
                status="active"
            )
        ]

        for u in users:
            if not db.query(User).filter_by(username=u.username).first():
                db.add(u)

        db.commit()
    finally:
        db.close()

def seed_fire_vehicles():
    db = SessionLocal()
    try:
        # Ensure stations exist
        stations = db.query(FireStation).all()
        if not stations:
            return

        vehicles_data = [
            # Station A
            {"vehicle_id": "A_ENGINE_1", "name": "Engine 1", "station_id": "STATION_A"},
            {"vehicle_id": "A_ENGINE_2", "name": "Engine 2", "station_id": "STATION_A"},

            # Station B
            {"vehicle_id": "B_ENGINE_1", "name": "Engine 1", "station_id": "STATION_B"},
            {"vehicle_id": "B_ENGINE_2", "name": "Engine 2", "station_id": "STATION_B"},

            # Station C
            {"vehicle_id": "C_ENGINE_1", "name": "Engine 1", "station_id": "STATION_C"},
            {"vehicle_id": "C_ENGINE_2", "name": "Engine 2", "station_id": "STATION_C"},
        ]

        for v in vehicles_data:
            existing = db.query(FireVehicle).filter_by(
                vehicle_id=v["vehicle_id"]
            ).first()

            if not existing:
                vehicle = FireVehicle(
                    vehicle_id=v["vehicle_id"],
                    name=v["name"],
                    station_id=v["station_id"],
                    status="AVAILABLE"
                )
                db.add(vehicle)

        db.commit()
        print("🚒 Fire vehicles seeded successfully")

    finally:
        db.close()

# ---------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    init_db()
    seed_fire_stations()
    seed_internal_users()
    seed_fire_vehicles()
    # loop = asyncio.get_running_loop()
    # set_event_loop(loop)

    # 🚀 START MQTT WORKER
    # asyncio.create_task(mqtt_loop())

    asyncio.create_task(redis_listener())
