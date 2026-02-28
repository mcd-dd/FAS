import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models import (
    Base,
    User,
    Device,
    FireStation,
    SensorData,
    Incident,
    OperatorAction,
    FireVehicle,
    RechargeHistory,
    VehicleOperatorAssignment,
)

# ---------------------------------------------------
# Locate SQLite file explicitly
# ---------------------------------------------------

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

sqlite_path = os.path.join(
    PROJECT_ROOT,
    "data",
    "dev.db"
)

if not os.path.exists(sqlite_path):
    raise Exception(f"SQLite file not found at: {sqlite_path}")

print("Using SQLite file:", sqlite_path)

# ---------------------------------------------------
# SQLite Engine
# ---------------------------------------------------

sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")
SQLiteSession = sessionmaker(bind=sqlite_engine)
sqlite_db = SQLiteSession()

# ---------------------------------------------------
# PostgreSQL Engine (HOST MACHINE)
# ---------------------------------------------------

pg_engine = create_engine(
    "postgresql://fas:faspass@localhost:5432/fasdb"
)
PGSession = sessionmaker(bind=pg_engine)
pg_db = PGSession()

# ---------------------------------------------------
# DROP ALL TABLES (clean start)
# ---------------------------------------------------

print("Dropping existing PostgreSQL tables...")
Base.metadata.drop_all(pg_engine)

print("Creating tables in PostgreSQL...")
Base.metadata.create_all(pg_engine)

# ---------------------------------------------------
# MIGRATION ORDER (FK SAFE)
# ---------------------------------------------------

tables = [
    User,
    FireStation,
    FireVehicle,
    Device,
    SensorData,
    Incident,
    OperatorAction,
    RechargeHistory,
    VehicleOperatorAssignment,
]

# ---------------------------------------------------
# TRANSFER DATA
# ---------------------------------------------------

for table in tables:
    print(f"Migrating {table.__tablename__}...")

    rows = sqlite_db.query(table).all()

    for row in rows:

        # Fix invalid vehicle references
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

print("✅ Migration completed successfully!")
sqlite_db.close()
pg_db.close()