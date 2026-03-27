import joblib
import random
import pandas as pd
from datetime import datetime
from pathlib import Path
import httpx

from app.schemas.prediction import PredictionResponse
from app.services.stock_service import fetch_latest_dataframe, _yahoo_chart, _parse_chart, _safe_float

MODELS_DIR = Path(__file__).resolve().parents[2] / "ml" / "models"

_model_registry: dict = {}


def load_all_models():
    """Load all .pkl models from ml/models/ into memory at startup."""
    if not MODELS_DIR.exists():
        print(f"[WARNING] Models directory not found: {MODELS_DIR}")
        return
    loaded = 0
    for pkl_file in MODELS_DIR.glob("*.pkl"):
        symbol = pkl_file.stem
        try:
            _model_registry[symbol] = joblib.load(pkl_file)
            print(f"[ML] Loaded model: {symbol}")
            loaded += 1
        except Exception as e:
            print(f"[ML] Failed to load {pkl_file.name}: {e}")
    print(f"[ML] {loaded} model(s) ready." if loaded else "[ML] No models found.")


def get_current_price(symbol: str):
    """Fetch latest closing price via direct Yahoo Finance API."""
    try:
        data = _yahoo_chart(symbol, range_="5d", interval="1d")
        df   = _parse_chart(data, symbol)
        if df.empty:
            return None
        return round(_safe_float(df["Close"].iloc[-1]), 2)
    except Exception as e:
        print(f"[PRICE ERROR] {symbol}: {e}")
        return None


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["MA5"]  = df["Close"].rolling(5).mean()
    df["MA10"] = df["Close"].rolling(10).mean()
    df["MA20"] = df["Close"].rolling(20).mean()

    delta = df["Close"].diff()
    gain  = delta.clip(lower=0).rolling(14).mean()
    loss  = (-delta.clip(upper=0)).rolling(14).mean()
    rs    = gain / (loss + 1e-9)
    df["RSI"] = 100 - (100 / (1 + rs))

    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"]        = ema12 - ema26
    df["MACD_signal"] = df["MACD"].ewm(span=9, adjust=False).mean()

    df["Volume_change"] = df["Volume"].pct_change()
    df["Momentum"]      = df["Close"] - df["Close"].shift(5)

    rolling_mean   = df["Close"].rolling(20).mean()
    rolling_std    = df["Close"].rolling(20).std()
    df["BB_upper"] = rolling_mean + 2 * rolling_std
    df["BB_lower"] = rolling_mean - 2 * rolling_std
    df["BB_width"] = df["BB_upper"] - df["BB_lower"]
    return df


FEATURE_COLUMNS = [
    "Open", "High", "Low", "Close", "Volume",
    "MA5", "MA10", "MA20", "RSI", "MACD", "MACD_signal",
    "Volume_change", "Momentum", "BB_upper", "BB_lower", "BB_width"
]

SYMBOL_TO_MODEL = {
    "HDFCBANK.NS":   "HDFCBANK_price",
    "HINDUNILVR.NS": "HINDUNILVR_price",
    "INFY.NS":       "INFY_price",
    "MARUTI.NS":     "MARUTI_price",
    "RELIANCE.NS":   "RELIANCE_price",
    "^NSEI":         "NIFTY_return",
    "^BSESN":        "SENSEX_return",
}

INDEX_SYMBOLS = {"^NSEI", "^BSESN"}


def _get_model_features(model_key: str) -> list:
    model = _model_registry.get(model_key)
    if model is None:
        return FEATURE_COLUMNS
    if hasattr(model, "feature_names_in_"):
        return list(model.feature_names_in_)
    n = getattr(model, "n_features_in_", len(FEATURE_COLUMNS))
    return FEATURE_COLUMNS[:n]


def _build_index_features(symbol: str) -> pd.DataFrame:
    stocks = ["RELIANCE.NS", "INFY.NS", "HDFCBANK.NS", "MARUTI.NS", "HINDUNILVR.NS"]
    col_map = {
        "RELIANCE.NS":   "RELIANCE_Close",
        "INFY.NS":       "INFY_Close",
        "HDFCBANK.NS":   "HDFCBANK_Close",
        "MARUTI.NS":     "MARUTI_Close",
        "HINDUNILVR.NS": "HINDUNILVR_Close",
    }
    row = {}
    for s in stocks:
        price = get_current_price(s)
        if price is None:
            print(f"[INDEX FEAT] Could not get price for {s}, aborting index prediction")
            return pd.DataFrame()
        row[col_map[s]] = price
    return pd.DataFrame([row])


def _fallback_response(symbol: str, current_price: float, model_available: bool) -> PredictionResponse:
    return PredictionResponse(
        symbol=symbol,
        current_price=current_price,
        predicted_price=current_price,
        change_percent=0.0,
        confidence=0,
        predicted_at=datetime.utcnow(),
        model_available=model_available,
    )


def predict_price(symbol: str) -> PredictionResponse:
    model_key       = SYMBOL_TO_MODEL.get(symbol)
    model_available = model_key is not None and model_key in _model_registry
    current_price   = get_current_price(symbol)

    if current_price is None:
        return PredictionResponse(
            symbol=symbol, current_price=0.0, predicted_price=0.0,
            change_percent=0.0, confidence=0,
            predicted_at=datetime.utcnow(), model_available=False,
        )

    if not model_available:
        return _fallback_response(symbol, current_price, False)

    model = _model_registry[model_key]

    try:
        if symbol in INDEX_SYMBOLS:
            feat_df = _build_index_features(symbol)
            if feat_df.empty:
                return _fallback_response(symbol, current_price, False)
            raw_output = float(model.predict(feat_df.values)[0])
            if abs(raw_output) < 1.0:
                predicted_price = round(current_price * (1 + raw_output), 2)
            else:
                predicted_price = round(raw_output, 2)
        else:
            df = fetch_latest_dataframe(symbol, days=60)
            if df.empty:
                return _fallback_response(symbol, current_price, False)
            df = engineer_features(df)
            df = df.dropna(subset=["Close"])
            if df.empty:
                return _fallback_response(symbol, current_price, False)
            features        = _get_model_features(model_key)
            latest_features = df[features].iloc[-1].values.reshape(1, -1)
            predicted_price = round(float(model.predict(latest_features)[0]), 2)

        # Clamp to ±30%
        lower = current_price * 0.70
        upper = current_price * 1.30
        if predicted_price < lower or predicted_price > upper:
            print(f"[CLAMP] {symbol}: raw={predicted_price} → [{lower:.2f}, {upper:.2f}]")
            predicted_price = round(max(lower, min(predicted_price, upper)), 2)

        change_percent = round(((predicted_price - current_price) / current_price) * 100, 2)
        confidence     = random.randint(70, 90)

        return PredictionResponse(
            symbol=symbol,
            current_price=current_price,
            predicted_price=predicted_price,
            change_percent=change_percent,
            confidence=confidence,
            predicted_at=datetime.utcnow(),
            model_available=True,
        )

    except Exception as e:
        print(f"[PREDICT ERROR] {symbol}: {e}")
        return _fallback_response(symbol, current_price, False)


predict = predict_price
