import yfinance as yf
import pandas as pd
from datetime import timezone
from app.schemas.stock import OHLCVPoint, StockHistoryResponse, StockQuote

SUPPORTED_SYMBOLS = [
    "HDFCBANK.NS", "HINDUNILVR.NS", "MARUTI.NS",
    "RELIANCE.NS", "INFY.NS", "^NSEI", "^BSESN"
]


def _safe_float(val, default=0.0) -> float:
    """Convert a value to float safely, returning default on None/NaN."""
    try:
        if val is None:
            return default
        f = float(val)
        return default if (f != f) else f  # NaN check
    except Exception:
        return default


def _strip_tz(dt) -> "datetime":
    """Convert any datetime (tz-aware or naive) to a naive UTC datetime."""
    from datetime import datetime
    if hasattr(dt, "to_pydatetime"):
        dt = dt.to_pydatetime()
    if hasattr(dt, "tzinfo") and dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def fetch_history(symbol: str, period: str = "6mo") -> StockHistoryResponse:
    """Fetch OHLCV history from yfinance."""
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)

    if df is None or df.empty:
        raise ValueError(f"No data found for symbol: {symbol}")

    # Flatten MultiIndex columns (newer yfinance versions)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]

    df = df.reset_index()
    # Rename 'Datetime' to 'Date' if needed
    if "Datetime" in df.columns and "Date" not in df.columns:
        df = df.rename(columns={"Datetime": "Date"})
    # Drop rows where Close is NaN
    df = df.dropna(subset=["Close"])

    if df.empty:
        raise ValueError(f"No valid data for symbol: {symbol}")

    points = []
    for _, row in df.iterrows():
        try:
            points.append(OHLCVPoint(
                date=_strip_tz(row["Date"]),
                open=_safe_float(row.get("Open")),
                high=_safe_float(row.get("High")),
                low=_safe_float(row.get("Low")),
                close=_safe_float(row.get("Close")),
                volume=_safe_float(row.get("Volume")),
            ))
        except Exception:
            continue  # skip bad rows

    if not points:
        raise ValueError(f"No valid OHLCV data for symbol: {symbol}")

    return StockHistoryResponse(symbol=symbol, data=points)


def fetch_quote(symbol: str) -> StockQuote:
    """Fetch latest quote for a symbol."""
    ticker = yf.Ticker(symbol)
    # Use 5d to ensure we always get at least 2 rows (handles weekends/holidays)
    df = ticker.history(period="5d")

    if df is None or df.empty:
        raise ValueError(f"No quote data for symbol: {symbol}")

    # Flatten MultiIndex columns (newer yfinance versions)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]

    df = df.dropna(subset=["Close"])

    if df.empty:
        raise ValueError(f"No valid quote data for symbol: {symbol}")

    latest = df.iloc[-1]
    prev   = df.iloc[-2] if len(df) >= 2 else df.iloc[-1]

    current_price = round(_safe_float(latest.get("Close")), 2)
    prev_close    = round(_safe_float(prev.get("Close")), 2)
    change        = round(current_price - prev_close, 2)
    change_pct    = round((change / prev_close) * 100, 2) if prev_close else 0.0

    return StockQuote(
        symbol=symbol,
        current_price=current_price,
        change=change,
        change_pct=change_pct,
        volume=_safe_float(latest.get("Volume")),
        high=round(_safe_float(latest.get("High")), 2),
        low=round(_safe_float(latest.get("Low")), 2),
    )


def fetch_latest_dataframe(symbol: str, days: int = 60) -> pd.DataFrame:
    """Return raw DataFrame for ML feature engineering."""
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="3mo")
        if df is None or df.empty:
            return pd.DataFrame()
        # Flatten MultiIndex columns (newer yfinance versions)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]
        df = df.reset_index()
        # Rename 'Datetime' to 'Date' if needed
        if "Datetime" in df.columns and "Date" not in df.columns:
            df = df.rename(columns={"Datetime": "Date"})
        df = df.dropna(subset=["Close"])
        return df
    except Exception as e:
        print(f"[DATAFRAME ERROR] {symbol}: {e}")
        return pd.DataFrame()
