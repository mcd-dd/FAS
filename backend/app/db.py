from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:////data/dev.db"
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # REQUIRED
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()

def init_db():
    print("🗄️ Initializing DB at:", DATABASE_URL)
    Base.metadata.create_all(bind=engine)


# -- 🔴 Near STATION_A
# UPDATE devices SET lat = 12.9717, lon = 77.5947 WHERE device_id = 'dev-001';
# UPDATE devices SET lat = 12.9713, lon = 77.5943 WHERE device_id = 'dev-004';

# -- 🔴 Near STATION_B
# UPDATE devices SET lat = 12.9618, lon = 77.5848 WHERE device_id = 'dev-002';
# UPDATE devices SET lat = 12.9613, lon = 77.5843 WHERE device_id = 'dev-005';

# -- 🔴 Near STATION_C
# UPDATE devices SET lat = 12.9818, lon = 77.6049 WHERE device_id = 'dev-003';
# UPDATE devices SET lat = 12.9813, lon = 77.6044 WHERE device_id = 'dev-006';
