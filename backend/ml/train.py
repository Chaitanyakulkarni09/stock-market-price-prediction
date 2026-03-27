"""
Offline training script.
Run from backend/ directory:
    python -m ml.train
"""

import joblib
import httpx
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

from ml.features import engineer_features, FEATURE_COLUMNS, TARGET_COLUMN

SYMBOLS = [
    "HDFCBANK.NS", "HINDUNILVR.NS", "MARUTI.NS",
    "RELIANCE.NS", "INFY.NS", "^NSEI", "^BSESN"
]

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://finance.yahoo.com",
}


def fetch_history(symbol: str, range_: str = "2y") -> pd.DataFrame:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    params = {"range": range_, "interval": "1d", "includePrePost": "false"}
    with httpx.Client(headers=_HEADERS, timeout=30, follow_redirects=True) as client:
        r = client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
    result = data.get("chart", {}).get("result", [])
    if not result:
        return pd.DataFrame()
    res = result[0]
    timestamps = res.get("timestamp", [])
    quote = res.get("indicators", {}).get("quote", [{}])[0]
    df = pd.DataFrame({
        "Date":   [datetime.fromtimestamp(t, tz=timezone.utc).replace(tzinfo=None) for t in timestamps],
        "Open":   quote.get("open",   [None] * len(timestamps)),
        "High":   quote.get("high",   [None] * len(timestamps)),
        "Low":    quote.get("low",    [None] * len(timestamps)),
        "Close":  quote.get("close",  [None] * len(timestamps)),
        "Volume": quote.get("volume", [0]    * len(timestamps)),
    })
    return df.dropna(subset=["Close"]).reset_index(drop=True)


def train_symbol(symbol: str):
    print(f"\n[TRAIN] Fetching data for {symbol}...")
    df = fetch_history(symbol, range_="2y")

    if df.empty or len(df) < 60:
        print(f"[SKIP] Not enough data for {symbol}")
        return

    df = engineer_features(df)
    df = df.replace([float('inf'), float('-inf')], pd.NA)
    df = df.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN])

    X = df[FEATURE_COLUMNS].values
    y = df[TARGET_COLUMN].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print(f"[TRAIN] {symbol} — MAE: {mae:.2f}, R²: {r2:.4f}")

    out_path = MODELS_DIR / f"{symbol}.pkl"
    joblib.dump(model, out_path)
    print(f"[SAVED] {out_path}")


if __name__ == "__main__":
    for sym in SYMBOLS:
        try:
            train_symbol(sym)
        except Exception as e:
            print(f"[ERROR] {sym}: {e}")
    print("\n[DONE] All models trained.")
