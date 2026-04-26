import asyncio
from app.services.stock_service import fetch_quote

PROJECT_KB = {
    "csp": "Constraint Satisfaction Problem (CSP) is used in the Portfolio Builder. You set constraints (budget, max stocks, risk level) and the system finds valid portfolios satisfying all constraints.",
    "constraint satisfaction": "Constraint Satisfaction Problem (CSP) is used in the Portfolio Builder. You set constraints (budget, max stocks, risk level) and the system finds valid portfolios satisfying all constraints.",
    "means-ends analysis": "Means-Ends Analysis compares your current portfolio value with a target goal, calculates the gap, and recommends actions (aggressive/moderate/conservative) to reach the goal.",
    "means ends": "Means-Ends Analysis compares your current portfolio value with a target goal, calculates the gap, and recommends actions (aggressive/moderate/conservative) to reach the goal.",
    "bfs": "BFS (Breadth-First Search) explores the stock decision tree level by level — visiting all nodes at depth 1 before depth 2. Guarantees shortest path but uses O(b^d) memory. Visualised on the AI Engine page.",
    "breadth first": "BFS (Breadth-First Search) explores the stock decision tree level by level. Guarantees shortest path. Visualised on the AI Engine page.",
    "dfs": "DFS (Depth-First Search) goes deep into one branch before backtracking. Uses O(bd) memory — efficient but may miss the optimal solution. Visualised on the AI Engine page.",
    "depth first": "DFS (Depth-First Search) goes deep into one branch before backtracking. Low memory cost but may miss optimal solution. Visualised on the AI Engine page.",
    "production system": "Our trading rules (IF RSI > 70 THEN SELL, IF RSI < 30 AND Volume > Avg THEN BUY) form a Production System — a set of condition-action rules fired by a forward-chaining inference engine.",
    "production rule": "Production rules are IF-THEN rules used in our expert system. Example: IF RSI < 30 AND Volume > Avg THEN BUY. View and interact with them on the AI Engine page.",
    "trading rule": "Trading rules in this platform are production rules: IF RSI < 30 AND Volume > Avg → BUY, IF MACD Bullish OR Golden Cross → BUY, IF RSI > 70 AND Volume Spike → SELL. See the AI Engine page.",
    "intelligent agent": "The prediction system is an Intelligent Agent: it Perceives market data (OHLCV, indicators), Reasons using a trained Random Forest model, and Acts by generating BUY/SELL/HOLD signals — following the classic Perceive-Reason-Act cycle.",
    "agent": "An Intelligent Agent in this platform perceives live stock data, reasons using ML models and trading rules, and acts by producing predictions and signals. See the AI Engine page for a live demo.",
    "portfolio builder": "The Portfolio Builder page lets you set constraints (budget, risk, sector) and uses CSP to recommend diversified portfolios satisfying all your conditions.",
    "turing test": "On the Chatbot page, you can rate each bot response as Human or Machine. That's a Turing Test — Alan Turing's 1950 proposal to evaluate machine intelligence by whether a human can distinguish it from a person.",
    "minimax": "Minimax is used to simulate market competition. It explores a game tree of BUY/HOLD/SELL decisions, minimising the maximum possible loss. The AI assumes the market acts as an adversary.",
    "a* search": "A* Search finds the optimal portfolio growth path by combining actual cost (current loss/gain) with a heuristic estimate of future potential — balancing exploration and exploitation.",
    "a star": "A* Search finds the optimal portfolio growth path by combining actual cost with a heuristic estimate of future potential.",
    "machine learning": "Machine learning models (Random Forest Regressors) analyse 14 years of historical OHLCV data and 19 technical indicators to predict next-day closing prices for 27 NSE/BSE stocks.",
    "random forest": "Random Forest is the ML algorithm used here — an ensemble of decision trees trained with GridSearchCV and TimeSeriesSplit to prevent data leakage. 27 models, one per stock symbol.",
    "expert system": "This platform acts as an Expert System: it has a Knowledge Base of trading rules and market facts, and an Inference Engine (forward chaining) that fires rules to produce BUY/SELL/HOLD recommendations.",
    "knowledge base": "The Knowledge Base contains trading rules (RSI thresholds, MACD signals, volume patterns), stock facts, and AI concept definitions. The chatbot and expert system both draw from it.",
    "forward chaining": "Forward Chaining starts from known facts (e.g., RSI = 28, Volume is high) and applies IF-THEN rules to derive conclusions (BUY signal). This is how the trading rule engine works.",
    "backward chaining": "Backward Chaining starts from a goal (e.g., 'should I BUY?') and works backwards to find supporting facts. Forward chaining is used here, but backward chaining is the alternative approach.",
    "inference engine": "The Inference Engine evaluates production rules against current market data. It uses forward chaining — matching rule conditions to facts and firing rules whose conditions are satisfied.",
    "propositional logic": "Propositional logic underpins the trading rules. Example: P = (RSI < 30), Q = (Volume > Avg), Rule: P ∧ Q → BUY. Toggle premises on the AI Engine page to see the truth table live.",
    "truth table": "Truth tables on the AI Engine page show all combinations of premise values (T/F) and the resulting conclusion. Useful for understanding AND vs OR logic in trading rules.",
    "confidence": "Confidence score (70–90%) reflects how strongly the model's indicators agree. Higher confidence = stronger signal alignment across RSI, MACD, Volume, and Momentum.",
    "rsi": "RSI (Relative Strength Index) measures momentum. RSI < 30 = oversold (potential BUY), RSI > 70 = overbought (potential SELL). It's the top feature in our prediction models at 28% importance.",
    "macd": "MACD (Moving Average Convergence Divergence) shows trend momentum. A bullish crossover (MACD line crosses above signal line) triggers a BUY rule in our expert system.",
    "sma": "SMA (Simple Moving Average) averages closing prices over N days. MA20 and MA50 are used as features — a Golden Cross (MA20 > MA50) is a bullish signal.",
    "ema": "EMA (Exponential Moving Average) weights recent prices more heavily than older ones, making it more responsive to new market data than SMA.",
    "golden cross": "A Golden Cross occurs when the 20-day MA crosses above the 50-day MA — a classic bullish signal used in Rule 2 of our production system.",
    "bollinger": "Bollinger Bands are volatility bands placed above and below a moving average. When price touches the lower band with high volume, it can signal a BUY opportunity.",
    "atr": "ATR (Average True Range) measures market volatility. High ATR means large price swings — used as a feature in our Random Forest models.",
    "volume": "Volume confirms price signals. High volume on an up-move = strong conviction. Our Rule 1 requires Volume > 30-day average alongside RSI < 30 for a BUY signal.",
    "dataset": "The dataset covers 14 years (2010–2023) of daily OHLCV data for 27 NSE/BSE symbols fetched from Yahoo Finance. 19 technical indicators are computed as features for training.",
    "prediction": "Predictions are generated by 27 Random Forest models (one per stock). At inference time, the latest 3 months of live data is fetched, features are computed, and the model predicts tomorrow's closing price.",
    "watchlist": "The Watchlist page lets you track live prices of your favourite stocks. Search for a symbol and click Add — prices update in real time.",
    "how to predict": "Go to the AI Engine page, select a stock symbol, and click 'Predict Next Day'. The model fetches live data, computes 19 indicators, and returns a predicted price with confidence score.",
}

STOCK_SYMBOLS = {
    "hdfc": "HDFCBANK.NS",
    "hdfcbank": "HDFCBANK.NS",
    "reliance": "RELIANCE.NS",
    "infosys": "INFY.NS",
    "infy": "INFY.NS",
    "maruti": "MARUTI.NS",
    "nifty": "^NSEI",
    "nifty 50": "^NSEI",
    "sensex": "^BSESN",
    "tcs": "TCS.NS",
    "wipro": "WIPRO.NS",
    "hcltech": "HCLTECH.NS",
    "techm": "TECHM.NS",
    "icici": "ICICIBANK.NS",
    "icicibank": "ICICIBANK.NS",
    "sbi": "SBIN.NS",
    "sbin": "SBIN.NS",
    "kotak": "KOTAKBANK.NS",
    "kotakbank": "KOTAKBANK.NS",
    "axis": "AXISBANK.NS",
    "axisbank": "AXISBANK.NS",
    "bajaj finance": "BAJFINANCE.NS",
    "bajfinance": "BAJFINANCE.NS",
    "bajaj finserv": "BAJAJFINSV.NS",
    "bajajfinsv": "BAJAJFINSV.NS",
    "ongc": "ONGC.NS",
    "ntpc": "NTPC.NS",
    "powergrid": "POWERGRID.NS",
    "m&m": "M&M.NS",
    "mahindra": "M&M.NS",
    "hul": "HINDUNILVR.NS",
    "hindustan unilever": "HINDUNILVR.NS",
    "itc": "ITC.NS",
    "nestle": "NESTLEIND.NS",
    "nestleind": "NESTLEIND.NS",
    "sun pharma": "SUNPHARMA.NS",
    "sunpharma": "SUNPHARMA.NS",
    "titan": "TITAN.NS",
    "adani ports": "ADANIPORTS.NS",
    "adaniports": "ADANIPORTS.NS",
    "adani ent": "ADANIENT.NS",
    "adanient": "ADANIENT.NS",
}

TECH_INDICATORS = {
    "rsi": "RSI (Relative Strength Index) measures momentum on a 0–100 scale. RSI < 30 = oversold (BUY signal), RSI > 70 = overbought (SELL signal). It's the most important feature in our models at 28%.",
    "macd": "MACD (Moving Average Convergence Divergence) tracks trend momentum. A bullish crossover fires a BUY rule; a bearish crossover fires a SELL rule in our expert system.",
    "sma": "SMA (Simple Moving Average) averages closing prices over N days. MA20 and MA50 are key features — a Golden Cross (MA20 crossing above MA50) is a bullish signal.",
    "ema": "EMA (Exponential Moving Average) weights recent prices more heavily, making it more responsive to new data than SMA.",
}

GREETINGS = {"hi", "hello", "hey", "hii", "helo", "good morning", "good evening", "good afternoon"}

async def generate_chat_response(message: str) -> str:
    message_lower = message.lower().strip()

    # Greetings
    if message_lower in GREETINGS or message_lower.startswith(("hi ", "hello ", "hey ")):
        return "Hello! I'm your AI stock market assistant 👋 Ask me about stocks, trading rules, AI concepts like CSP, BFS, Turing Test, or how predictions work."

    # 1. Project KB — check all keys as substrings (longest match first for specificity)
    matched = None
    matched_len = 0
    for key, answer in PROJECT_KB.items():
        if key in message_lower and len(key) > matched_len:
            matched = answer
            matched_len = len(key)
    if matched:
        return matched

    # 2. Technical Indicators — flexible matching
    for key, answer in TECH_INDICATORS.items():
        if key in message_lower:
            return answer

    # 3. Stock price queries
    price_intent = any(p in message_lower for p in ["price of", "stock price", "current price", "price", "quote", "trading at", "how much is"])
    if price_intent:
        for name, symbol in STOCK_SYMBOLS.items():
            if name in message_lower:
                try:
                    quote = await asyncio.to_thread(fetch_quote, symbol)
                    return f"The current price of {name.upper()} ({symbol}) is ₹{quote.current_price:,.2f}."
                except Exception:
                    return f"Sorry, I couldn't fetch the price for {name.upper()} right now. Try again in a moment."

    # 4. Stock name mentioned directly (without explicit price intent)
    for name, symbol in STOCK_SYMBOLS.items():
        if name in message_lower:
            try:
                quote = await asyncio.to_thread(fetch_quote, symbol)
                return f"The current price of {name.upper()} ({symbol}) is ₹{quote.current_price:,.2f}."
            except Exception:
                pass

    # 5. General FAQs
    if "watchlist" in message_lower:
        return "To use the Watchlist, go to the Watchlist page, search for a stock symbol, and click 'Add'. It tracks live prices of your favourite stocks."
    if "predict" in message_lower:
        return "Predictions are generated by 27 Random Forest models — one per stock. The model fetches live data, computes 19 technical indicators, and predicts tomorrow's closing price with a confidence score."
    if "how" in message_lower and "work" in message_lower:
        return "This platform uses ML models (Random Forest) for price prediction, a CSP solver for portfolio building, production rules for trading signals, and BFS/DFS for decision tree search. Ask about any specific feature!"

    # 6. Fallback
    return "I can help with AI concepts (CSP, BFS, DFS, Turing Test, Expert System), stock prices, trading rules, or platform features. Try asking: 'What is RSI?' or 'Price of Reliance' or 'What is a production system?'"
