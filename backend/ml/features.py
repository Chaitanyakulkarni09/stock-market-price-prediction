import pandas as pd

FEATURE_COLUMNS = [
    "Open", "High", "Low", "Close", "Volume",
    "MA5", "MA10", "MA20", "RSI", "MACD", "MACD_signal",
    "Volume_change", "Momentum", "BB_upper", "BB_lower", "BB_width"
]

TARGET_COLUMN = "Next_Close"


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute all technical indicators. Must stay in sync with predict_service.py."""
    df = df.copy()

    df["MA5"] = df["Close"].rolling(5).mean()
    df["MA10"] = df["Close"].rolling(10).mean()
    df["MA20"] = df["Close"].rolling(20).mean()

    delta = df["Close"].diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / (loss + 1e-9)
    df["RSI"] = 100 - (100 / (1 + rs))

    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"] = ema12 - ema26
    df["MACD_signal"] = df["MACD"].ewm(span=9, adjust=False).mean()

    df["Volume_change"] = df["Volume"].pct_change()
    df["Momentum"] = df["Close"] - df["Close"].shift(5)

    rolling_mean = df["Close"].rolling(20).mean()
    rolling_std = df["Close"].rolling(20).std()
    df["BB_upper"] = rolling_mean + 2 * rolling_std
    df["BB_lower"] = rolling_mean - 2 * rolling_std
    df["BB_width"] = df["BB_upper"] - df["BB_lower"]

    df[TARGET_COLUMN] = df["Close"].shift(-1)

    return df
