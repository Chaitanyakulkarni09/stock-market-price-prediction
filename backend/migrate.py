"""
Migration script — run ONCE to rebuild watchlist and chat_history tables
with proper integer FK to users.

Usage:
    python migrate.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import engine, Base
from app.models import StockPrice, Prediction, WatchlistItem, User, ChatHistory


def run():
    with engine.connect() as conn:
        # Disable FK checks so we can drop/recreate freely
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))

        print("Dropping old watchlist and chat_history tables...")
        conn.execute(text("DROP TABLE IF EXISTS watchlist"))
        conn.execute(text("DROP TABLE IF EXISTS chat_history"))

        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        conn.commit()

    print("Recreating all tables with new schema...")
    Base.metadata.create_all(bind=engine)
    print("Done. All tables are up to date.")


if __name__ == "__main__":
    run()
