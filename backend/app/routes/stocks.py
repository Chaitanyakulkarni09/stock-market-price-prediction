from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import stock_service, db_service
from app.schemas.stock import StockHistoryResponse, StockQuote

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

VALID_PERIODS = {"1mo", "3mo", "6mo", "1y", "2y"}


@router.get("/symbols", response_model=list[str])
def list_symbols():
    return stock_service.SUPPORTED_SYMBOLS


@router.get("/quote", response_model=StockQuote)
def get_quote(symbol: str = Query(..., description="e.g. RELIANCE.NS, ^NSEI")):
    """GET /api/stocks/quote?symbol=RELIANCE.NS"""
    try:
        return stock_service.fetch_quote(symbol)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {e}")


@router.get("/history", response_model=StockHistoryResponse)
def get_history(
    symbol: str = Query(..., description="e.g. RELIANCE.NS, ^NSEI"),
    period: str = Query(default="6mo", description="1mo, 3mo, 6mo, 1y, 2y"),
    db: Session = Depends(get_db),
):
    """GET /api/stocks/history?symbol=RELIANCE.NS&period=6mo"""
    if period not in VALID_PERIODS:
        raise HTTPException(status_code=400, detail=f"Invalid period. Choose from {VALID_PERIODS}")
    try:
        result = stock_service.fetch_history(symbol, period=period)
        try:
            db_service.upsert_stock_prices(db, symbol, result.data)
        except Exception:
            pass
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {e}")
