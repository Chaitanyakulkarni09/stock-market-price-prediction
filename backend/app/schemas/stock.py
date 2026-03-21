from pydantic import BaseModel
from datetime import datetime


class OHLCVPoint(BaseModel):
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class StockHistoryResponse(BaseModel):
    symbol: str
    data: list[OHLCVPoint]


class StockQuote(BaseModel):
    symbol: str
    current_price: float
    change: float
    change_pct: float
    volume: float
    high: float
    low: float
