"""
CSP Portfolio Builder — backtracking constraint satisfaction solver.
POST /api/portfolio/constraints
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from itertools import combinations

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

# ── Stock universe with mock data ─────────────────────────────────────────────
STOCK_UNIVERSE = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Energy",   "price": 1350, "risk_score": 5, "expected_return": 9.2},
    {"symbol": "TCS.NS",      "name": "TCS",                 "sector": "IT",       "price": 3800, "risk_score": 4, "expected_return": 8.5},
    {"symbol": "INFY.NS",     "name": "Infosys",             "sector": "IT",       "price": 1600, "risk_score": 4, "expected_return": 7.8},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank",           "sector": "Banking",  "price": 1700, "risk_score": 4, "expected_return": 8.0},
    {"symbol": "ICICIBANK.NS","name": "ICICI Bank",          "sector": "Banking",  "price": 1200, "risk_score": 5, "expected_return": 8.8},
    {"symbol": "SBIN.NS",     "name": "SBI",                 "sector": "Banking",  "price": 800,  "risk_score": 6, "expected_return": 9.5},
    {"symbol": "MARUTI.NS",   "name": "Maruti Suzuki",       "sector": "Auto",     "price": 12000,"risk_score": 5, "expected_return": 8.2},
    {"symbol": "HINDUNILVR.NS","name":"HUL",                 "sector": "FMCG",     "price": 2400, "risk_score": 3, "expected_return": 6.5},
    {"symbol": "ITC.NS",      "name": "ITC",                 "sector": "FMCG",     "price": 450,  "risk_score": 3, "expected_return": 6.8},
    {"symbol": "SUNPHARMA.NS","name": "Sun Pharma",          "sector": "Pharma",   "price": 1800, "risk_score": 5, "expected_return": 8.0},
    {"symbol": "WIPRO.NS",    "name": "Wipro",               "sector": "IT",       "price": 550,  "risk_score": 4, "expected_return": 7.2},
    {"symbol": "ONGC.NS",     "name": "ONGC",                "sector": "Energy",   "price": 280,  "risk_score": 6, "expected_return": 9.8},
    {"symbol": "NTPC.NS",     "name": "NTPC",                "sector": "Utilities","price": 380,  "risk_score": 3, "expected_return": 6.2},
    {"symbol": "TITAN.NS",    "name": "Titan",               "sector": "Consumer", "price": 3500, "risk_score": 5, "expected_return": 8.6},
    {"symbol": "BAJFINANCE.NS","name":"Bajaj Finance",       "sector": "Finance",  "price": 7000, "risk_score": 7, "expected_return": 11.0},
]

RISK_MAP = {"low": (1, 4), "medium": (3, 6), "high": (5, 10)}


class ConstraintRequest(BaseModel):
    budget: float = 100000
    max_stocks: int = 3
    min_stocks: int = 2
    max_per_stock_percent: float = 40.0
    risk_level: str = "medium"          # low / medium / high
    exclude_sectors: Optional[List[str]] = []


def check_constraints(combo: list, req: ConstraintRequest) -> bool:
    """Return True if this combination satisfies all constraints."""
    risk_min, risk_max = RISK_MAP.get(req.risk_level, (1, 10))

    for stock in combo:
        # Sector exclusion
        if stock["sector"] in (req.exclude_sectors or []):
            return False
        # Risk level
        if not (risk_min <= stock["risk_score"] <= risk_max):
            return False
        # Per-stock allocation must be affordable
        min_allocation = stock["price"]          # at least 1 share
        max_allocation = req.budget * (req.max_per_stock_percent / 100)
        if min_allocation > max_allocation:
            return False

    # Total cost of 1 share each must fit in budget
    total_min_cost = sum(s["price"] for s in combo)
    if total_min_cost > req.budget:
        return False

    return True


def allocate(combo: list, budget: float, max_pct: float) -> list:
    """Equal-weight allocation respecting max_per_stock_percent."""
    n = len(combo)
    equal_share = budget / n
    max_alloc   = budget * (max_pct / 100)
    per_stock   = min(equal_share, max_alloc)

    result = []
    for s in combo:
        shares    = int(per_stock / s["price"])
        allocated = shares * s["price"]
        result.append({
            "symbol":          s["symbol"],
            "name":            s["name"],
            "sector":          s["sector"],
            "price":           s["price"],
            "shares":          shares,
            "allocated":       round(allocated, 2),
            "expected_return": s["expected_return"],
            "risk_score":      s["risk_score"],
        })
    return result


@router.post("/constraints")
def solve_portfolio(req: ConstraintRequest):
    """Backtracking CSP solver — returns up to 5 valid portfolios."""
    valid_portfolios = []

    for n in range(req.min_stocks, req.max_stocks + 1):
        for combo in combinations(STOCK_UNIVERSE, n):
            combo = list(combo)
            if check_constraints(combo, req):
                allocated = allocate(combo, req.budget, req.max_per_stock_percent)
                total_cost   = sum(s["allocated"] for s in allocated)
                avg_return   = round(sum(s["expected_return"] for s in allocated) / len(allocated), 2)
                avg_risk     = round(sum(s["risk_score"] for s in allocated) / len(allocated), 1)
                valid_portfolios.append({
                    "stocks":        allocated,
                    "total_cost":    round(total_cost, 2),
                    "remaining":     round(req.budget - total_cost, 2),
                    "avg_return":    avg_return,
                    "avg_risk":      avg_risk,
                    "num_stocks":    len(allocated),
                })
            if len(valid_portfolios) >= 5:
                break
        if len(valid_portfolios) >= 5:
            break

    # Sort by expected return descending
    valid_portfolios.sort(key=lambda p: p["avg_return"], reverse=True)

    return {
        "portfolios": valid_portfolios,
        "count":      len(valid_portfolios),
        "message":    f"Found {len(valid_portfolios)} valid portfolio(s)" if valid_portfolios
                      else "No portfolio satisfies all constraints. Try relaxing them.",
    }
