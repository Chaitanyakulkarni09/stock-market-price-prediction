from pydantic import BaseModel
from datetime import datetime


class PredictionResponse(BaseModel):
    symbol: str
    current_price: float
    predicted_price: float
    change_percent: float
    confidence: int
    predicted_at: datetime
    model_available: bool

    model_config = {"protected_namespaces": ()}  # suppress model_ namespace warning
