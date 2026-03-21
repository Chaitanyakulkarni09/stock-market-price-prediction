from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.stock import StockPrice
from app.models.prediction import Prediction
from app.models.watchlist import WatchlistItem
from app.schemas.stock import OHLCVPoint
from app.schemas.prediction import PredictionResponse

# Keep only this many days of cached stock data per symbol
CACHE_DAYS = 60


def upsert_stock_prices(db: Session, symbol: str, points: list[OHLCVPoint]):
    """
    Cache latest CACHE_DAYS days of OHLCV data.
    Deletes old rows first to prevent unbounded growth.
    """
    # Delete ALL existing rows for this symbol (full refresh)
    db.query(StockPrice).filter(StockPrice.symbol == symbol).delete()
    db.commit()

    # Only keep the most recent CACHE_DAYS worth of points
    cutoff = datetime.utcnow() - timedelta(days=CACHE_DAYS)
    def _naive(dt):
        """Strip timezone from datetime safely."""
        if hasattr(dt, "tzinfo") and dt.tzinfo is not None:
            from datetime import timezone as _tz
            return dt.astimezone(_tz.utc).replace(tzinfo=None)
        return dt
    recent = [p for p in points if _naive(p.date) >= cutoff]

    if recent:
        db.bulk_save_objects([
            StockPrice(
                symbol=symbol,
                date=p.date,
                open=p.open,
                high=p.high,
                low=p.low,
                close=p.close,
                volume=p.volume,
            )
            for p in recent
        ])
        db.commit()


def get_cached_prices(db: Session, symbol: str, limit: int = 60) -> list[StockPrice]:
    return (
        db.query(StockPrice)
        .filter(StockPrice.symbol == symbol)
        .order_by(StockPrice.date.desc())
        .limit(limit)
        .all()
    )


def save_prediction(db: Session, result: PredictionResponse):
    """Save every prediction call to the predictions table."""
    row = Prediction(
        symbol=result.symbol,
        predicted_price=result.predicted_price,
        current_price=result.current_price,
        change_percent=result.change_percent,
        confidence=result.confidence,
        predicted_at=result.predicted_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_prediction_history(db: Session, symbol: str, limit: int = 30) -> list[Prediction]:
    return (
        db.query(Prediction)
        .filter(Prediction.symbol == symbol)
        .order_by(Prediction.predicted_at.desc())
        .limit(limit)
        .all()
    )


def add_to_watchlist(db: Session, user_id: int, symbol: str) -> WatchlistItem:
    existing = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user_id, WatchlistItem.symbol == symbol)
        .first()
    )
    if existing:
        return existing
    item = WatchlistItem(user_id=user_id, symbol=symbol)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def remove_from_watchlist(db: Session, user_id: int, symbol: str) -> bool:
    item = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user_id, WatchlistItem.symbol == symbol)
        .first()
    )
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


def get_watchlist(db: Session, user_id: int) -> list[WatchlistItem]:
    return (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user_id)
        .order_by(WatchlistItem.added_at.desc())
        .all()
    )
