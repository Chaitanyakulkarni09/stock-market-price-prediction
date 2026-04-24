import asyncio
from app.services.stock_service import fetch_quote

PROJECT_KB = {
    "csp": "Constraint Satisfaction Problem (CSP) is used in the Portfolio Builder. You set constraints (budget, max stocks, risk level) and the system finds valid portfolios satisfying all constraints.",
    "means-ends analysis": "Means-Ends Analysis compares your current portfolio value with a target goal, calculates the gap, and recommends actions (aggressive/moderate/conservative) to reach the goal.",
    "bfs": "BFS (Breadth-First Search) explores the stock decision tree level by level. You can see it in action on the AI Engine page.",
    "dfs": "DFS (Depth-First Search) goes deep into one branch before backtracking. Also visualised on AI Engine.",
    "production system": "Our trading rules (IF RSI>70 THEN SELL) are a production system. View them on AI Engine.",
    "intelligent agent": "The prediction system is an intelligent agent that perceives market data, acts by generating predictions, and aims to maximise accuracy.",
    "portfolio builder": "The Portfolio Builder page lets you set constraints and uses CSP to recommend diversified portfolios.",
    "turing test": "On the Chatbot page, you can rate responses as human/machine. That's a Turing Test.",
    "minimax": "Minimax algorithm is used in our platform to simulate market competition and find the optimal trading strategy by minimizing the maximum possible loss.",
    "a* search": "A* search algorithm helps in finding the most optimal path for portfolio growth by balancing the current value and estimated future potential.",
    "machine learning": "Machine learning models analyze historical stock data to predict future price movements with improved accuracy over time.",
    "expert system": "Our AI acts as an expert system, utilizing a knowledge base of trading rules to provide actionable stock recommendations."
}

STOCK_SYMBOLS = {
    "hdfc": "HDFCBANK.NS",
    "reliance": "RELIANCE.NS",
    "infosys": "INFY.NS",
    "maruti": "MARUTI.NS",
    "nifty": "^NSEI",
    "nifty 50": "^NSEI",
    "sensex": "^BSESN",
    "tcs": "TCS.NS",
    "wipro": "WIPRO.NS",
    "hcltech": "HCLTECH.NS",
    "techm": "TECHM.NS",
    "icici": "ICICIBANK.NS",
    "sbi": "SBIN.NS",
    "kotak": "KOTAKBANK.NS",
    "axis": "AXISBANK.NS",
    "bajaj finance": "BAJFINANCE.NS",
    "bajaj finserv": "BAJAJFINSV.NS",
    "ongc": "ONGC.NS",
    "ntpc": "NTPC.NS",
    "powergrid": "POWERGRID.NS",
    "m&m": "M&M.NS",
    "hul": "HINDUNILVR.NS",
    "itc": "ITC.NS",
    "nestle": "NESTLEIND.NS",
    "sun pharma": "SUNPHARMA.NS",
    "titan": "TITAN.NS",
    "adani ports": "ADANIPORTS.NS",
    "adani ent": "ADANIENT.NS"
}

TECH_INDICATORS = {
    "rsi": "RSI (Relative Strength Index) is a momentum indicator that measures the magnitude of recent price changes to evaluate overbought or oversold conditions.",
    "macd": "MACD (Moving Average Convergence Divergence) is a trend-following momentum indicator that shows the relationship between two moving averages of a stock's price.",
    "sma": "SMA (Simple Moving Average) calculates the average of a selected range of prices, usually closing prices, by the number of periods in that range.",
    "ema": "EMA (Exponential Moving Average) is a type of moving average that places a greater weight and significance on the most recent data points."
}

async def generate_chat_response(message: str) -> str:
    message_lower = message.lower().strip()
    
    # 1. Check for Project KB match
    for key, answer in PROJECT_KB.items():
        if key in message_lower:
            return answer
            
    # 2. Check for Technical Indicators
    for key, answer in TECH_INDICATORS.items():
        if f"what is {key}" in message_lower or f"what is {key}" in message_lower.replace(" ", "") or key in message_lower.split():
            return answer
            
    # 3. Check for Stock Prices
    if "price of" in message_lower or "stock price" in message_lower or "current price" in message_lower:
        for name, symbol in STOCK_SYMBOLS.items():
            if name in message_lower:
                try:
                    quote = await asyncio.to_thread(fetch_quote, symbol)
                    return f"The current price of {name.upper()} is ₹{quote.current_price}."
                except Exception as e:
                    return f"Sorry, I couldn't fetch the price for {name.upper()} at the moment."
    
    # Check if stock name is mentioned directly
    for name, symbol in STOCK_SYMBOLS.items():
        if name in message_lower.split():
            try:
                quote = await asyncio.to_thread(fetch_quote, symbol)
                return f"The current price of {name.upper()} is ₹{quote.current_price}."
            except Exception as e:
                pass

    # 4. General FAQs
    if "watchlist" in message_lower:
        return "To use the watchlist, go to the Watchlist page, search for a stock symbol, and click 'Add'. It will let you track live prices of your favorite stocks."
    if "predictions generated" in message_lower or "how to predict" in message_lower:
        return "Predictions are generated using a combination of technical indicators (like RSI, MACD) and machine learning models analyzing historical data to forecast trends."
        
    # 5. Fallback
    return "I can answer questions about AI concepts, stock prices, or how to use this platform. Try 'What is CSP?' or 'Price of Reliance'."
