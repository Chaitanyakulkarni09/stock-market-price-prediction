from sqlalchemy import Column, String, Float, DateTime, Integer
from sqlalchemy.sql import func
from app.database import Base


class StockPrice(Base):
    """Cached OHLCV data fetched from yfinance."""
    __tablename__ = "stock_prices"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True, nullable=False)
    date = Column(DateTime, nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)
    created_at = Column(DateTime, server_default=func.now())
