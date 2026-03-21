from pydantic import BaseModel
from datetime import datetime


class WatchlistAddRequest(BaseModel):
    symbol: str  # user_id comes from JWT, not request body


class WatchlistItem(BaseModel):
    id:       int
    user_id:  int
    symbol:   str
    added_at: datetime

    model_config = {"from_attributes": True}


class WatchlistResponse(BaseModel):
    user_id: int
    items:   list[WatchlistItem]
