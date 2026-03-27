import pandas as pd
import httpx
from datetime import datetime, timezone, timedelta
from app.schemas.stock import OHLCVPoint, StockHistoryResponse, StockQuote

SUPPORTED_SYMBOLS = [
    "HDFCBANK.NS", "HINDUNILVR.NS", "MARUTI.NS",
    "RELIANCE.NS", "INFY.NS", "^NSEI", "^BSESN"
]

# Headers that bypass Yahoo Finance's cloud-IP block
_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com",
    "Origin": "https://finance.yahoo.com",
}

PERIOD_TO_RANGE = {
    "1d":  ("1d",  "5m"),
    "1mo": ("1mo", "1d"),
    "3mo": ("3mo", "1d"),
    "6mo": ("6mo", "1d"),
    "1y":  ("1y",  "1d"),
    "2y":  ("2y",  "1wk"),
}


def _safe_float(val, default=0.0) -> float:
    try:
        if val is None:
            return default
        f = float(val)
        return default if (f != f) else f
    except Exception:
        return default


def _yahoo_chart(symbol: str, range_: str = "3mo", interval: str = "1d") -> dict:
    """Call Yahoo Finance chart API directly."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    params = {"range": range_, "interval": interval, "includePrePost": "false"}
    with httpx.Client(headers=_HEADERS, timeout=20, follow_redirects=True) as client:
        r = client.get(url, params=params)
        r.raise_for_status()
        return r.json()


def _parse_chart(data: dict, symbol: str) -> pd.DataFrame:
    """Parse Yahoo chart JSON into a clean DataFrame."""
    result = data.get("chart", {}).get("result", [])
    if not result:
        raise ValueError(f"No chart data for {symbol}")
    res = result[0]
    timestamps = res.get("timestamp", [])
    quote = res.get("indicators", {}).get("quote", [{}])[0]
    if not timestamps:
        raise ValueError(f"Empty timestamps for {symbol}")

    df = pd.DataFrame({
        "Date":   [datetime.fromtimestamp(t, tz=timezone.utc).replace(tzinfo=None) for t in timestamps],
        "Open":   quote.get("open",   [None] * len(timestamps)),
        "High":   quote.get("high",   [None] * len(timestamps)),
        "Low":    quote.get("low",    [None] * len(timestamps)),
        "Close":  quote.get("close",  [None] * len(timestamps)),
        "Volume": quote.get("volume", [0]    * len(timestamps)),
    })
    df = df.dropna(subset=["Close"])
    df["Volume"] = df["Volume"].fillna(0)
    return df.reset_index(drop=True)


def fetch_history(symbol: str, period: str = "6mo") -> StockHistoryResponse:
    range_, interval = PERIOD_TO_RANGE.get(period, ("3mo", "1d"))
    data = _yahoo_chart(symbol, range_=range_, interval=interval)
    df   = _parse_chart(data, symbol)

    points = []
    for _, row in df.iterrows():
        try:
            points.append(OHLCVPoint(
                date=row["Date"],
                open=_safe_float(row["Open"]),
                high=_safe_float(row["High"]),
                low=_safe_float(row["Low"]),
                close=_safe_float(row["Close"]),
                volume=_safe_float(row["Volume"]),
            ))
        except Exception:
            continue

    if not points:
        raise ValueError(f"No valid OHLCV data for {symbol}")
    return StockHistoryResponse(symbol=symbol, data=points)


def fetch_quote(symbol: str) -> StockQuote:
    data = _yahoo_chart(symbol, range_="5d", interval="1d")
    df   = _parse_chart(data, symbol)

    if df.empty:
        raise ValueError(f"No quote data for {symbol}")

    latest = df.iloc[-1]
    prev   = df.iloc[-2] if len(df) >= 2 else df.iloc[-1]

    current_price = round(_safe_float(latest["Close"]), 2)
    prev_close    = round(_safe_float(prev["Close"]), 2)
    change        = round(current_price - prev_close, 2)
    change_pct    = round((change / prev_close) * 100, 2) if prev_close else 0.0

    return StockQuote(
        symbol=symbol,
        current_price=current_price,
        change=change,
        change_pct=change_pct,
        volume=_safe_float(latest["Volume"]),
        high=round(_safe_float(latest["High"]), 2),
        low=round(_safe_float(latest["Low"]), 2),
    )


def fetch_latest_dataframe(symbol: str, days: int = 60) -> pd.DataFrame:
    """Return raw DataFrame for ML feature engineering."""
    try:
        data = _yahoo_chart(symbol, range_="3mo", interval="1d")
        return _parse_chart(data, symbol)
    except Exception as e:
        print(f"[DATAFRAME ERROR] {symbol}: {e}")
        return pd.DataFrame()
