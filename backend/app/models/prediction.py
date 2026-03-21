from sqlalchemy import Column, String, Float, DateTime, Integer
from sqlalchemy.sql import func
from app.database import Base


class Prediction(Base):
    """Stores ML prediction results per symbol."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True, nullable=False)
    predicted_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=True)
    change_percent = Column(Float, nullable=True)
    confidence = Column(Integer, nullable=True)
    predicted_at = Column(DateTime, server_default=func.now())
