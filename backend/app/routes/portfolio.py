"""
CSP Portfolio Builder — backtracking constraint satisfaction solver.
POST /api/portfolio/constraints
Uses real ML predictions from predict_service for expected_return.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from itertools import combinations

from app.services.predict_service import get_prediction_change, get_current_price

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

# ── Stock universe — price/sector/risk are mock; expected_return is fetched live ──
_STOCK_META = [
    {"symbol": "RELIANCE.NS",  "name": "Reliance Industries", "sector": "Energy",    "risk_score": 5},
    {"symbol": "TCS.NS",       "name": "TCS",                 "sector": "IT",        "risk_score": 4},
    {"symbol": "INFY.NS",      "name": "Infosys",             "sector": "IT",        "risk_score": 4},
    {"symbol": "HDFCBANK.NS",  "name": "HDFC Bank",           "sector": "Banking",   "risk_score": 4},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank",          "sector": "Banking",   "risk_score": 5},
    {"symbol": "SBIN.NS",      "name": "SBI",                 "sector": "Banking",   "risk_score": 6},
    {"symbol": "MARUTI.NS",    "name": "Maruti Suzuki",       "sector": "Auto",      "risk_score": 5},
    {"symbol": "HINDUNILVR.NS","name": "HUL",                 "sector": "FMCG",      "risk_score": 3},
    {"symbol": "ITC.NS",       "name": "ITC",                 "sector": "FMCG",      "risk_score": 3},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharma",          "sector": "Pharma",    "risk_score": 5},
    {"symbol": "WIPRO.NS",     "name": "Wipro",               "sector": "IT",        "risk_score": 4},
    {"symbol": "ONGC.NS",      "name": "ONGC",                "sector": "Energy",    "risk_score": 6},
    {"symbol": "NTPC.NS",      "name": "NTPC",                "sector": "Utilities", "risk_score": 3},
    {"symbol": "TITAN.NS",     "name": "Titan",               "sector": "Consumer",  "risk_score": 5},
    {"symbol": "BAJFINANCE.NS","name": "Bajaj Finance",       "sector": "Finance",   "risk_score": 7},
]

# Fallback prices used only when live fetch fails (keeps CSP fast)
_FALLBACK_PRICES = {
    "RELIANCE.NS": 1350, "TCS.NS": 3800, "INFY.NS": 1600,
    "HDFCBANK.NS": 1700, "ICICIBANK.NS": 1200, "SBIN.NS": 800,
    "MARUTI.NS": 12000, "HINDUNILVR.NS": 2400, "ITC.NS": 450,
    "SUNPHARMA.NS": 1800, "WIPRO.NS": 550, "ONGC.NS": 280,
    "NTPC.NS": 380, "TITAN.NS": 3500, "BAJFINANCE.NS": 7000,
}

RISK_MAP = {"low": (1, 4), "medium": (3, 6), "high": (5, 10)}


def _build_universe() -> list:
    """Fetch live prices + real ML predictions for all stocks."""
    universe = []
    for meta in _STOCK_META:
        sym = meta["symbol"]
        # Live price — fall back to mock if fetch fails
        live_price = get_current_price(sym)
        price = live_price if (live_price and live_price > 0) else _FALLBACK_PRICES.get(sym, 1000)
        # Real ML prediction (change_percent, e.g. 1.5 or -0.8)
        expected_return = get_prediction_change(sym)
        universe.append({**meta, "price": price, "expected_return": expected_return})
    return universe


class ConstraintRequest(BaseModel):
    budget: float = 100000
    max_stocks: int = 3
    min_stocks: int = 2
    max_per_stock_percent: float = 40.0
    risk_level: str = "medium"
    exclude_sectors: Optional[List[str]] = []


def _check_constraints(combo: list, req: ConstraintRequest) -> bool:
    risk_min, risk_max = RISK_MAP.get(req.risk_level, (1, 10))
    for stock in combo:
        if stock["sector"] in (req.exclude_sectors or []):
            return False
        if not (risk_min <= stock["risk_score"] <= risk_max):
            return False
        max_allocation = req.budget * (req.max_per_stock_percent / 100)
        if stock["price"] > max_allocation:
            return False
    if sum(s["price"] for s in combo) > req.budget:
        return False
    return True


def _allocate(combo: list, budget: float, max_pct: float) -> list:
    n = len(combo)
    per_stock = min(budget / n, budget * (max_pct / 100))
    result = []
    for s in combo:
        shares    = max(1, int(per_stock / s["price"]))
        allocated = shares * s["price"]
        result.append({
            "symbol":          s["symbol"],
            "name":            s["name"],
            "sector":          s["sector"],
            "price":           round(s["price"], 2),
            "shares":          shares,
            "allocated":       round(allocated, 2),
            "expected_return": s["expected_return"],   # real ML value
            "risk_score":      s["risk_score"],
        })
    return result


@router.post("/constraints")
def solve_portfolio(req: ConstraintRequest):
    """Backtracking CSP solver using real ML predictions for expected_return."""
    universe = _build_universe()
    valid_portfolios = []

    for n in range(req.min_stocks, req.max_stocks + 1):
        for combo in combinations(universe, n):
            combo = list(combo)
            if _check_constraints(combo, req):
                allocated  = _allocate(combo, req.budget, req.max_per_stock_percent)
                total_cost = sum(s["allocated"] for s in allocated)
                avg_return = round(sum(s["expected_return"] for s in allocated) / len(allocated), 2)
                avg_risk   = round(sum(s["risk_score"] for s in allocated) / len(allocated), 1)
                valid_portfolios.append({
                    "stocks":     allocated,
                    "total_cost": round(total_cost, 2),
                    "remaining":  round(req.budget - total_cost, 2),
                    "avg_return": avg_return,
                    "avg_risk":   avg_risk,
                    "num_stocks": len(allocated),
                })
            if len(valid_portfolios) >= 5:
                break
        if len(valid_portfolios) >= 5:
            break

    # Sort by real predicted return (descending)
    valid_portfolios.sort(key=lambda p: p["avg_return"], reverse=True)

    return {
        "portfolios": valid_portfolios,
        "count":      len(valid_portfolios),
        "message":    f"Found {len(valid_portfolios)} valid portfolio(s) using real ML predictions"
                      if valid_portfolios else
                      "No portfolio satisfies all constraints. Try relaxing them.",
    }
