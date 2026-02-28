import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, Device, FireStation, SensorData, Incident, OperatorAction, FireVehicle, RechargeHistory, VehicleOperatorAssignment

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

sqlite_path = os.path.join(PROJECT_ROOT, "data", "dev.db")

sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")
SQLiteSession = sessionmaker(bind=sqlite_engine)
sqlite_db = SQLiteSession()

# Postgres (host machine)
pg_engine = create_engine("postgresql://fas:faspass@localhost:5432/fasdb")
PGSession = sessionmaker(bind=pg_engine)
pg_db = PGSession()

print("Creating tables in PostgreSQL...")
Base.metadata.create_all(pg_engine)

tables = [
    User,
    FireStation,
    FireVehicle,   # 🔥 BEFORE Incident
    Device,
    SensorData,
    Incident,
    OperatorAction,
    RechargeHistory,
    VehicleOperatorAssignment,
]

for table in tables:
    print(f"Migrating {table.__tablename__}...")
    rows = sqlite_db.query(table).all()

    for row in rows:

        # 🚑 Fix invalid vehicle reference
        if table.__tablename__ == "incidents":
            if row.vehicle_id:
                vehicle_exists = sqlite_db.query(FireVehicle).filter_by(
                    vehicle_id=row.vehicle_id
                ).first()

                if not vehicle_exists:
                    print("⚠ Removing invalid vehicle:", row.vehicle_id)
                    row.vehicle_id = None

        pg_db.merge(row)

pg_db.commit()
print("✅ Migration completed!")