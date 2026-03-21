from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.predict_service import predict_price
from app.services import db_service
from app.schemas.prediction import PredictionResponse

router = APIRouter(prefix="/api/predict", tags=["predictions"])


@router.get("/", response_model=PredictionResponse)
def get_prediction(
    symbol: str = Query(..., description="Stock symbol e.g. RELIANCE.NS, INFY.NS, ^NSEI"),
    db: Session = Depends(get_db),
):
    """
    Predict next-day closing price.
    Usage: GET /api/predict/?symbol=RELIANCE.NS
    """
    try:
        result = predict_price(symbol.upper())
        try:
            db_service.save_prediction(db, result)
        except Exception:
            pass
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@router.get("/history", response_model=list[dict])
def get_prediction_history(
    symbol: str = Query(..., description="Stock symbol e.g. RELIANCE.NS"),
    db: Session = Depends(get_db),
):
    """Return past predictions from DB. Usage: GET /api/predict/history?symbol=RELIANCE.NS"""
    rows = db_service.get_prediction_history(db, symbol.upper())
    return [
        {
            "symbol": r.symbol,
            "predicted_price": r.predicted_price,
            "current_price": r.current_price,
            "predicted_at": r.predicted_at,
        }
        for r in rows
    ]
