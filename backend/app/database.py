from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

settings = get_settings()

# Get the database URL from settings
database_url = settings.database_url

# Handle Aiven MySQL SSL requirement
if "aivencloud.com" in database_url:
    # Remove ?ssl-mode=REQUIRED from the URL if present
    if "?" in database_url:
        database_url = database_url.split("?")[0]
    
    # Create engine with SSL connect_args for Aiven MySQL
    # Using check_hostname=False and ssl_mode="REQUIRED" as a fallback
    engine = create_engine(
        database_url,
        connect_args={
            "ssl": {
                "check_hostname": False,
                "ssl_mode": "REQUIRED"
            }
        },
        pool_pre_ping=True
    )
else:
    engine = create_engine(database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()