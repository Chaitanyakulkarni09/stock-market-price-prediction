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

# Get the database URL from settings; it should be in the standard format, e.g.:
# mysql+pymysql://avnadmin:password@host:15369/defaultdb
database_url = settings.database_url

# Create the engine with connection pooling and keep-alive features
engine = create_engine(
    database_url,
    pool_pre_ping=True,      # Check connection's liveness before using it
    pool_recycle=3600,       # Recycle connections after 1 hour to prevent stale connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(declarative_base()):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()