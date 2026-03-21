from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import db_service
from app.schemas.watchlist import WatchlistAddRequest, WatchlistResponse, WatchlistItem
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("/", response_model=WatchlistResponse)
def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db_service.get_watchlist(db, current_user.id)
    return WatchlistResponse(
        user_id=current_user.id,
        items=[WatchlistItem.model_validate(i) for i in items],
    )


@router.post("/", response_model=WatchlistItem)
def add_to_watchlist(
    payload: WatchlistAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db_service.add_to_watchlist(db, current_user.id, payload.symbol)
    return WatchlistItem.model_validate(item)


@router.delete("/{symbol}")
def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    removed = db_service.remove_from_watchlist(db, current_user.id, symbol)
    if not removed:
        raise HTTPException(status_code=404, detail="Item not found in watchlist")
    return {"message": f"{symbol} removed from watchlist"}
