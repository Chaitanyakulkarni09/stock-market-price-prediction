from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

# --- CRITICAL FIX: Explicitly tell Python to use PyMySQL as the MySQL driver ---
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    print("Warning: PyMySQL is not installed. Using default driver, which will likely fail.")
# -------------------------------------------------------------------------------

settings = get_settings()

# Get the database URL from settings; it should be in the format:
# mysql+pymysql://avnadmin:password@host:15369/defaultdb
database_url = settings.database_url

# Remove ?ssl-mode=REQUIRED from the URL if present, to avoid a driver error
if "?" in database_url:
    database_url = database_url.split("?")[0]

# Configure the engine for Aiven MySQL
if "aivencloud.com" in database_url:
    engine = create_engine(
        database_url,
        connect_args={
            "ssl": {
                "check_hostname": False,
                "ssl_mode": "REQUIRED"
            }
        },
        pool_pre_ping=True,      # Checks connection before using it
        pool_recycle=300,        # Recycle connections every 5 minutes (Aiven free tier idle timeout)
        pool_size=5,             # Max connections in pool
        max_overflow=10,         # Extra connections if needed
        echo_pool=False,         # Set to True for debugging connection pool issues
    )
else:
    engine = create_engine(
        database_url, 
        pool_pre_ping=True,
        pool_recycle=300,
    )

# Create the session and the correct declarative base
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()