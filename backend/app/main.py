from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.database import engine, Base
from app.models import StockPrice, Prediction, WatchlistItem, User, ChatHistory
from app.routes import stocks, predictions, watchlist
from app.routes import auth, chat
from app.services.predict_service import load_all_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("[DB] All tables created/verified.")
    load_all_models()
    yield


app = FastAPI(
    title="Stock Market Prediction API",
    version="2.0.0",
    description="FastAPI backend for AI-powered stock market predictions",
    lifespan=lifespan,
)

# Build allowed origins list
_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]
# Add any extra frontend URLs from env (comma-separated)
_extra = os.getenv("FRONTEND_URL", "")
for _url in _extra.split(","):
    _url = _url.strip().rstrip("/")
    if _url:
        _origins.append(_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # allow ALL vercel.app subdomains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router)
app.include_router(predictions.router)
app.include_router(watchlist.router)
app.include_router(auth.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"app": "Stock Market Prediction API", "version": "2.0.0", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}