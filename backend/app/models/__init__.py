# Import all models here so Base.metadata knows about every table
# before create_all() is called at startup
from app.models.stock import StockPrice
from app.models.prediction import Prediction
from app.models.watchlist import WatchlistItem
from app.models.user import User
from app.models.chat_history import ChatHistory
