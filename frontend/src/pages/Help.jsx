import { motion } from 'framer-motion'
import { HelpCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'

const FAQS = [
  {
    q: 'How does the AI prediction work?',
    a: 'The system uses a Random Forest Regressor trained with GridSearchCV and TimeSeriesSplit cross-validation on 14 years of historical data (Jan 2010 – Dec 2023). It computes 19 technical indicators — Moving Averages (MA5/10/20/50), RSI, MACD, Bollinger Bands, ATR, OBV, Momentum, and Volume change — then predicts the next-day closing price.',
  },
  {
    q: 'How accurate are the predictions?',
    a: 'Accuracy varies by stock. Best performers on 2023 test data: HDFCBANK (MAPE 0.97%), KOTAKBANK (0.90%), ONGC (1.09%), TCS (1.33%). Volatile stocks like Adani have higher error. Directional accuracy (predicting up/down correctly) ranges from 43–56%. Use predictions as one signal, not as financial advice.',
  },
  {
    q: 'What stocks are supported?',
    a: '27 symbols across 8 sectors: IT (TCS, INFY, WIPRO, HCLTECH, TECHM), Banking (HDFCBANK, ICICIBANK, SBIN, KOTAKBANK, AXISBANK), Finance (BAJFINANCE, BAJAJFINSV), Energy (RELIANCE, ONGC), Utilities (NTPC, POWERGRID), Auto (MARUTI, M&M), FMCG (HINDUNILVR, ITC, NESTLEIND), Pharma (SUNPHARMA), Consumer (TITAN), Infrastructure (ADANIPORTS, ADANIENT), and Indices (NIFTY 50, SENSEX).',
  },
  {
    q: 'How do I add stocks to my watchlist?',
    a: 'Go to the Watchlist page, click "Add Stock", then either type a symbol manually or use the sector filter tabs to browse and click any stock pill. Press Add or hit Enter.',
  },
  {
    q: 'What does the confidence score mean?',
    a: 'The confidence score (70–90%) is a randomised indicator representing model certainty. It is not a statistical probability — it is meant to give a relative sense of signal strength. Do not treat it as a guarantee.',
  },
  {
    q: 'Why is the prediction showing 0 or same as current price?',
    a: 'This means the ML model file (.pkl) was not found for that symbol, or the live price fetch failed. The backend falls back to returning the current price with 0% change. Make sure the backend is running and models are loaded.',
  },
  {
    q: 'Why are some predictions capped at ±3%?',
    a: 'Next-day stock price changes rarely exceed 3% for large-cap Indian stocks under normal conditions. The system clamps predictions to ±3% of current price to prevent unrealistic outlier predictions from the ML model.',
  },
  {
    q: 'How do I retrain the models?',
    a: 'From the backend/ folder, run: python -m ml.train_all — This fetches 14 years of data from Yahoo Finance and trains all 27 models using GridSearchCV. Takes about 10–15 minutes.',
  },
]

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-0">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="font-medium text-slate-900 dark:text-white text-sm">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ overflow: 'hidden' }}
      >
        <p className="pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  )
}

export default function Help() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Help Center</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Frequently asked questions</p>
      </div>
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle size={16} className="text-blue-500" />
          <h2 className="font-semibold text-slate-900 dark:text-white">FAQs</h2>
        </div>
        {FAQS.map((f, i) => <FAQ key={i} {...f} />)}
      </div>
      <div className="card bg-blue-600/5 border-blue-500/20">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">⚠️ Disclaimer</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          This platform is for educational and informational purposes only. AI predictions are not financial advice.
          Always do your own research before making investment decisions. Past performance does not guarantee future results.
        </p>
      </div>
    </motion.div>
  )
}
