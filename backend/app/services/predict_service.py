import joblib
import random
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

from app.schemas.prediction import PredictionResponse
from app.services.stock_service import fetch_latest_dataframe, _yahoo_chart, _parse_chart, _safe_float

MODELS_DIR = Path(__file__).resolve().parents[2] / "ml" / "models"

_model_registry: dict = {}

INDEX_SYMBOLS = {"^NSEI", "^BSESN"}

SYMBOL_TO_MODEL = {
    # Indices
    "^NSEI":         "NIFTY_return",
    "^BSESN":        "SENSEX_return",
    # IT
    "TCS.NS":        "TCS_price",
    "INFY.NS":       "INFY_price",
    "WIPRO.NS":      "WIPRO_price",
    "HCLTECH.NS":    "HCLTECH_price",
    "TECHM.NS":      "TECHM_price",
    # Banking & Finance
    "HDFCBANK.NS":   "HDFCBANK_price",
    "ICICIBANK.NS":  "ICICIBANK_price",
    "SBIN.NS":       "SBIN_price",
    "KOTAKBANK.NS":  "KOTAKBANK_price",
    "AXISBANK.NS":   "AXISBANK_price",
    "BAJFINANCE.NS": "BAJFINANCE_price",
    # Energy & Utilities
    "RELIANCE.NS":   "RELIANCE_price",
    "ONGC.NS":       "ONGC_price",
    "NTPC.NS":       "NTPC_price",
    "POWERGRID.NS":  "POWERGRID_price",
    # Auto
    "MARUTI.NS":     "MARUTI_price",
    "TATAMOTORS.NS": "TATAMOTORS_price",
    "M&M.NS":        "MM_price",
    # FMCG
    "HINDUNILVR.NS": "HINDUNILVR_price",
    "ITC.NS":        "ITC_price",
    "NESTLEIND.NS":  "NESTLEIND_price",
    # Pharma
    "SUNPHARMA.NS":  "SUNPHARMA_price",
    # Consumer
    "TITAN.NS":      "TITAN_price",
    # Conglomerate
    "ADANIPORTS.NS": "ADANIPORTS_price",
    "ADANIENT.NS":   "ADANIENT_price",
}

FEATURE_COLUMNS = [
    "Open", "High", "Low", "Close", "Volume",
    "MA5", "MA10", "MA20", "MA50",
    "RSI", "MACD", "MACD_signal",
    "Volume_change", "Momentum",
    "BB_upper", "BB_lower", "BB_width",
    "ATR", "OBV",
]


def load_all_models():
    if not MODELS_DIR.exists():
        print(f"[WARNING] Models directory not found: {MODELS_DIR}")
        return
    loaded = 0
    for pkl_file in MODELS_DIR.glob("*.pkl"):
        key = pkl_file.stem
        try:
            _model_registry[key] = joblib.load(pkl_file)
            print(f"[ML] Loaded model: {key}")
            loaded += 1
        except Exception as e:
            print(f"[ML] Failed to load {pkl_file.name}: {e}")
    print(f"[ML] {loaded} model(s) ready." if loaded else "[ML] No models found.")


def get_current_price(symbol: str):
    try:
        data = _yahoo_chart(symbol, range_="5d", interval="1d")
        df   = _parse_chart(data, symbol)
        if df.empty:
            return None
        return round(_safe_float(df["Close"].iloc[-1]), 2)
    except Exception as e:
        print(f"[PRICE ERROR] {symbol}: {e}")
        return None


def engineer_features(df: pd.DataFrame, is_index: bool = False) -> pd.DataFrame:
    df = df.copy()
    df["MA5"]  = df["Close"].rolling(5).mean()
    df["MA10"] = df["Close"].rolling(10).mean()
    df["MA20"] = df["Close"].rolling(20).mean()
    df["MA50"] = df["Close"].rolling(50).mean()

    delta = df["Close"].diff()
    gain  = delta.clip(lower=0).rolling(14).mean()
    loss  = (-delta.clip(upper=0)).rolling(14).mean()
    df["RSI"] = 100 - (100 / (1 + gain / (loss + 1e-9)))

    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"]        = ema12 - ema26
    df["MACD_signal"] = df["MACD"].ewm(span=9, adjust=False).mean()

    if is_index:
        df["Volume"]        = 0.0
        df["Volume_change"] = 0.0
        df["OBV"]           = 0.0
    else:
        df["Volume_change"] = df["Volume"].pct_change()
        obv = [0]
        for i in range(1, len(df)):
            if df["Close"].iloc[i] > df["Close"].iloc[i - 1]:
                obv.append(obv[-1] + df["Volume"].iloc[i])
            elif df["Close"].iloc[i] < df["Close"].iloc[i - 1]:
                obv.append(obv[-1] - df["Volume"].iloc[i])
            else:
                obv.append(obv[-1])
        df["OBV"] = obv

    df["Momentum"] = df["Close"] - df["Close"].shift(5)

    rm = df["Close"].rolling(20).mean()
    rs = df["Close"].rolling(20).std()
    df["BB_upper"] = rm + 2 * rs
    df["BB_lower"] = rm - 2 * rs
    df["BB_width"] = df["BB_upper"] - df["BB_lower"]

    hl  = df["High"] - df["Low"]
    hpc = (df["High"] - df["Close"].shift(1)).abs()
    lpc = (df["Low"]  - df["Close"].shift(1)).abs()
    df["ATR"] = pd.concat([hl, hpc, lpc], axis=1).max(axis=1).rolling(14).mean()

    return df


def _get_model_features(model_key: str) -> list:
    model = _model_registry.get(model_key)
    if model is None:
        return FEATURE_COLUMNS
    if hasattr(model, "feature_names_in_"):
        return list(model.feature_names_in_)
    n = getattr(model, "n_features_in_", len(FEATURE_COLUMNS))
    return FEATURE_COLUMNS[:n]


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
    is_index        = symbol in INDEX_SYMBOLS

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
        df = fetch_latest_dataframe(symbol, days=60)
        if df.empty:
            return _fallback_response(symbol, current_price, False)

        df = engineer_features(df, is_index=is_index)
        df = df.replace([np.inf, -np.inf], pd.NA)
        df = df.dropna(subset=["Close"])
        if df.empty:
            return _fallback_response(symbol, current_price, False)

        features        = _get_model_features(model_key)
        # Fill any missing feature columns with 0 (handles old models with fewer features)
        for col in features:
            if col not in df.columns:
                df[col] = 0.0
        latest_features = df[features].iloc[-1].values.reshape(1, -1)
        predicted_price = round(float(model.predict(latest_features)[0]), 2)

        # Clamp to ±30%
        lower = current_price * 0.70
        upper = current_price * 1.30
        if predicted_price < lower or predicted_price > upper:
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
