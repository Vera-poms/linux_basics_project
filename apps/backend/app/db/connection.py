import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

URL_DATABSE = os.getenv("DATABASE_URL")
if not URL_DATABSE:
    raise RuntimeError(
        "DATABASE_URL not set. It must be in the environment before db.connection"
    )

class Base(DeclarativeBase):
    pass

engine = create_engine(
    URL_DATABSE,
    pool_pre_ping=True,
    pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
    pool_recycle=int(os.getenv("DB_POOL_RECYCLE_SECONDS", "1800"))
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_session() -> Session:
    return SessionLocal()

def init_db() -> None:
    Base.metadata.create_all(bind=engine)