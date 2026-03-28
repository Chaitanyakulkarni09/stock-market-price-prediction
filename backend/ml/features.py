"""
Feature engineering — must stay in sync with train_all.py and predict_service.py
"""
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "Open", "High", "Low", "Close", "Volume",
    "MA5", "MA10", "MA20", "MA50",
    "RSI", "MACD", "MACD_signal",
    "Volume_change", "Momentum",
    "BB_upper", "BB_lower", "BB_width",
    "ATR", "OBV",
]

TARGET_COLUMN = "Next_Close"


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

    df[TARGET_COLUMN] = df["Close"].shift(-1)

    return df
