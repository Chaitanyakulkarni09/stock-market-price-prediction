"""
Professional ML Training Pipeline — 27 symbols
================================================
Run from backend/ directory:
    python -m ml.train_all

Features:
- Fetches Jan 2010 – Dec 2023 data via Yahoo Finance API
- 18 technical indicators (MA5/10/20/50, RSI, MACD, BB, ATR, OBV, Momentum, Volume)
- GridSearchCV with TimeSeriesSplit for hyperparameter tuning
- Train: 2010-2021 | Validation: 2022 | Test: 2023
- Saves .pkl models, JSON metrics, feature importance PNGs
- Progress bars, full error handling
"""

import json
import time
import warnings
import httpx
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # non-interactive backend for servers
import matplotlib.pyplot as plt

from datetime import datetime, timezone
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error

warnings.filterwarnings("ignore")

# ── Directories ───────────────────────────────────────────────────────────────
BASE_DIR     = Path(__file__).parent
MODELS_DIR   = BASE_DIR / "models"
METRICS_DIR  = BASE_DIR / "metrics"
FEATURES_DIR = BASE_DIR / "features"

for d in [MODELS_DIR, METRICS_DIR, FEATURES_DIR]:
    d.mkdir(exist_ok=True)

# ── All 27 symbols ────────────────────────────────────────────────────────────
SYMBOLS = [
    "^NSEI", "^BSESN",
    "TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS",
    "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS", "AXISBANK.NS", "BAJFINANCE.NS",
    "RELIANCE.NS", "ONGC.NS", "NTPC.NS", "POWERGRID.NS",
    "MARUTI.NS", "TATAMOTORS.NS", "M&M.NS",
    "HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS",
    "SUNPHARMA.NS", "TITAN.NS",
    "ADANIPORTS.NS", "ADANIENT.NS",
]

# Model filename mapping (M&M has & which is invalid in filenames)
SYMBOL_TO_MODEL_KEY = {s: s.replace(".NS", "_price").replace("^NSEI", "NIFTY_return")
                          .replace("^BSESN", "SENSEX_return").replace("M&M_price", "MM_price")
                       for s in SYMBOLS}

INDEX_SYMBOLS = {"^NSEI", "^BSESN"}

FEATURE_COLUMNS = [
    "Open", "High", "Low", "Close", "Volume",
    "MA5", "MA10", "MA20", "MA50",
    "RSI", "MACD", "MACD_signal",
    "Volume_change", "Momentum",
    "BB_upper", "BB_lower", "BB_width",
    "ATR", "OBV",
]
TARGET_COLUMN = "Next_Close"

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://finance.yahoo.com",
}

# ── Data fetching ─────────────────────────────────────────────────────────────

def fetch_history(symbol: str, start: str = "2010-01-01", end: str = "2023-12-31") -> pd.DataFrame:
    """Fetch daily OHLCV from Yahoo Finance for a date range."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    # Convert dates to unix timestamps
    t1 = int(datetime.strptime(start, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp())
    t2 = int(datetime.strptime(end,   "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp())
    params = {"period1": t1, "period2": t2, "interval": "1d", "includePrePost": "false"}

    for attempt in range(3):
        try:
            with httpx.Client(headers=_HEADERS, timeout=40, follow_redirects=True) as client:
                r = client.get(url, params=params)
                r.raise_for_status()
                data = r.json()
            break
        except Exception as e:
            if attempt == 2:
                raise
            print(f"  [RETRY {attempt+1}] {symbol}: {e}")
            time.sleep(3)

    result = data.get("chart", {}).get("result", [])
    if not result:
        return pd.DataFrame()

    res        = result[0]
    timestamps = res.get("timestamp", [])
    quote      = res.get("indicators", {}).get("quote", [{}])[0]

    df = pd.DataFrame({
        "Date":   [datetime.fromtimestamp(t, tz=timezone.utc).replace(tzinfo=None) for t in timestamps],
        "Open":   quote.get("open",   [None] * len(timestamps)),
        "High":   quote.get("high",   [None] * len(timestamps)),
        "Low":    quote.get("low",    [None] * len(timestamps)),
        "Close":  quote.get("close",  [None] * len(timestamps)),
        "Volume": quote.get("volume", [0]    * len(timestamps)),
    })
    df["Volume"] = df["Volume"].fillna(0)
    return df.dropna(subset=["Close"]).reset_index(drop=True)

# ── Feature engineering ───────────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame, is_index: bool = False) -> pd.DataFrame:
    df = df.copy()

    # Moving averages
    df["MA5"]  = df["Close"].rolling(5).mean()
    df["MA10"] = df["Close"].rolling(10).mean()
    df["MA20"] = df["Close"].rolling(20).mean()
    df["MA50"] = df["Close"].rolling(50).mean()

    # RSI
    delta = df["Close"].diff()
    gain  = delta.clip(lower=0).rolling(14).mean()
    loss  = (-delta.clip(upper=0)).rolling(14).mean()
    df["RSI"] = 100 - (100 / (1 + gain / (loss + 1e-9)))

    # MACD
    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"]        = ema12 - ema26
    df["MACD_signal"] = df["MACD"].ewm(span=9, adjust=False).mean()

    # Volume features — use 0 for indices (no volume)
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

    # Momentum
    df["Momentum"] = df["Close"] - df["Close"].shift(5)

    # Bollinger Bands
    rm  = df["Close"].rolling(20).mean()
    rs  = df["Close"].rolling(20).std()
    df["BB_upper"] = rm + 2 * rs
    df["BB_lower"] = rm - 2 * rs
    df["BB_width"] = df["BB_upper"] - df["BB_lower"]

    # ATR
    hl  = df["High"] - df["Low"]
    hpc = (df["High"] - df["Close"].shift(1)).abs()
    lpc = (df["Low"]  - df["Close"].shift(1)).abs()
    df["ATR"] = pd.concat([hl, hpc, lpc], axis=1).max(axis=1).rolling(14).mean()

    # Target
    df[TARGET_COLUMN] = df["Close"].shift(-1)

    return df

# ── Metrics ───────────────────────────────────────────────────────────────────

def directional_accuracy(y_true, y_pred, y_prev):
    true_dir = np.sign(y_true - y_prev)
    pred_dir = np.sign(y_pred - y_prev)
    return float(np.mean(true_dir == pred_dir) * 100)

def mape(y_true, y_pred):
    mask = y_true != 0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)

# ── Progress bar ──────────────────────────────────────────────────────────────

def progress(current, total, symbol, status=""):
    pct  = int(current / total * 40)
    bar  = "█" * pct + "░" * (40 - pct)
    print(f"\r[{bar}] {current}/{total} {symbol:<20} {status}", end="", flush=True)

# ── Training ──────────────────────────────────────────────────────────────────

def train_symbol(symbol: str, idx: int, total: int) -> dict:
    model_key  = SYMBOL_TO_MODEL_KEY[symbol]
    is_index   = symbol in INDEX_SYMBOLS

    progress(idx, total, symbol, "fetching...")
    df = fetch_history(symbol)

    if df.empty or len(df) < 200:
        print(f"\n  [SKIP] {symbol}: only {len(df)} rows")
        return {"symbol": symbol, "status": "skipped", "reason": "insufficient data"}

    df = engineer_features(df, is_index=is_index)
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN])

    if len(df) < 100:
        print(f"\n  [SKIP] {symbol}: only {len(df)} rows after feature engineering")
        return {"symbol": symbol, "status": "skipped", "reason": "insufficient after features"}

    # ── Time-based split: train 2010-2021, val 2022, test 2023 ──
    df["Date"] = pd.to_datetime(df["Date"])
    train_df = df[df["Date"] <  "2022-01-01"]
    val_df   = df[(df["Date"] >= "2022-01-01") & (df["Date"] < "2023-01-01")]
    test_df  = df[df["Date"] >= "2023-01-01"]

    if len(train_df) < 50:
        print(f"\n  [SKIP] {symbol}: train set too small ({len(train_df)} rows)")
        return {"symbol": symbol, "status": "skipped", "reason": "train set too small"}

    X_train = train_df[FEATURE_COLUMNS].values
    y_train = train_df[TARGET_COLUMN].values
    X_val   = val_df[FEATURE_COLUMNS].values   if len(val_df)  > 0 else X_train[-50:]
    y_val   = val_df[TARGET_COLUMN].values     if len(val_df)  > 0 else y_train[-50:]
    X_test  = test_df[FEATURE_COLUMNS].values  if len(test_df) > 0 else X_val
    y_test  = test_df[TARGET_COLUMN].values    if len(test_df) > 0 else y_val

    # ── GridSearchCV with TimeSeriesSplit ──
    progress(idx, total, symbol, "tuning...")
    param_grid = {
        "n_estimators": [100, 200],
        "max_depth":    [8, 12],
        "min_samples_split": [5, 10],
    }
    tscv  = TimeSeriesSplit(n_splits=5)
    base  = RandomForestRegressor(random_state=42, n_jobs=-1)
    grid  = GridSearchCV(base, param_grid, cv=tscv, scoring="neg_mean_squared_error",
                         n_jobs=-1, refit=True, verbose=0)
    grid.fit(X_train, y_train)
    model = grid.best_estimator_

    # ── Evaluate on val + test ──
    progress(idx, total, symbol, "evaluating...")
    y_val_pred  = model.predict(X_val)
    y_test_pred = model.predict(X_test)

    # Previous close for directional accuracy
    val_prev  = val_df["Close"].values  if len(val_df)  > 0 else train_df["Close"].values[-50:]
    test_prev = test_df["Close"].values if len(test_df) > 0 else val_df["Close"].values

    metrics = {
        "symbol":       symbol,
        "model_key":    model_key,
        "best_params":  grid.best_params_,
        "train_rows":   int(len(train_df)),
        "val_rows":     int(len(val_df)),
        "test_rows":    int(len(test_df)),
        "val": {
            "RMSE": round(float(np.sqrt(mean_squared_error(y_val, y_val_pred))), 4),
            "MAE":  round(float(mean_absolute_error(y_val, y_val_pred)), 4),
            "MAPE": round(mape(y_val, y_val_pred), 4),
            "DA":   round(directional_accuracy(y_val, y_val_pred, val_prev), 2),
        },
        "test": {
            "RMSE": round(float(np.sqrt(mean_squared_error(y_test, y_test_pred))), 4),
            "MAE":  round(float(mean_absolute_error(y_test, y_test_pred)), 4),
            "MAPE": round(mape(y_test, y_test_pred), 4),
            "DA":   round(directional_accuracy(y_test, y_test_pred, test_prev), 2),
        },
        "trained_at": datetime.utcnow().isoformat(),
        "status": "success",
    }

    # ── Save model ──
    progress(idx, total, symbol, "saving model...")
    joblib.dump(model, MODELS_DIR / f"{model_key}.pkl")

    # ── Save metrics JSON ──
    with open(METRICS_DIR / f"{model_key}_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    # ── Feature importance chart ──
    try:
        importances = model.feature_importances_
        indices     = np.argsort(importances)[::-1]
        fig, ax     = plt.subplots(figsize=(10, 5))
        ax.bar(range(len(FEATURE_COLUMNS)),
               importances[indices],
               color="#3b82f6", alpha=0.85)
        ax.set_xticks(range(len(FEATURE_COLUMNS)))
        ax.set_xticklabels([FEATURE_COLUMNS[i] for i in indices], rotation=45, ha="right", fontsize=8)
        ax.set_title(f"Feature Importance — {symbol}", fontsize=12, fontweight="bold")
        ax.set_ylabel("Importance")
        ax.set_facecolor("#0f172a")
        fig.patch.set_facecolor("#0f172a")
        ax.tick_params(colors="white")
        ax.title.set_color("white")
        ax.yaxis.label.set_color("white")
        plt.tight_layout()
        plt.savefig(FEATURES_DIR / f"{model_key}_importance.png", dpi=100, bbox_inches="tight")
        plt.close(fig)
    except Exception as e:
        print(f"\n  [CHART WARN] {symbol}: {e}")

    return metrics


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  AI Stock Prediction — Professional Training Pipeline")
    print(f"  Symbols: {len(SYMBOLS)} | Features: {len(FEATURE_COLUMNS)}")
    print(f"  Train: 2010-2021 | Val: 2022 | Test: 2023")
    print("=" * 60)

    all_metrics = []
    failed      = []
    t_start     = time.time()

    for i, sym in enumerate(SYMBOLS, 1):
        try:
            result = train_symbol(sym, i, len(SYMBOLS))
            all_metrics.append(result)
            if result["status"] == "success":
                m = result["test"]
                print(f"\n  ✓ {sym:<20} RMSE={m['RMSE']:.2f}  MAE={m['MAE']:.2f}  "
                      f"MAPE={m['MAPE']:.2f}%  DA={m['DA']:.1f}%")
            else:
                print(f"\n  ✗ {sym}: {result.get('reason', 'unknown')}")
                failed.append(sym)
        except Exception as e:
            print(f"\n  [ERROR] {sym}: {e}")
            failed.append(sym)
            all_metrics.append({"symbol": sym, "status": "error", "error": str(e)})
        time.sleep(0.5)  # polite delay between requests

    # Save summary
    summary = {
        "trained_at":    datetime.utcnow().isoformat(),
        "total_symbols": len(SYMBOLS),
        "successful":    len(SYMBOLS) - len(failed),
        "failed":        failed,
        "results":       all_metrics,
    }
    with open(METRICS_DIR / "summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    elapsed = time.time() - t_start
    print("\n" + "=" * 60)
    print(f"  Done in {elapsed/60:.1f} min")
    print(f"  Successful: {len(SYMBOLS) - len(failed)}/{len(SYMBOLS)}")
    if failed:
        print(f"  Failed: {', '.join(failed)}")
    print(f"  Models  → backend/ml/models/")
    print(f"  Metrics → backend/ml/metrics/")
    print(f"  Charts  → backend/ml/features/")
    print("=" * 60)
