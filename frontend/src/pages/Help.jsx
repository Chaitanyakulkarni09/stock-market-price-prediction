import { motion } from 'framer-motion'
import { HelpCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'

const FAQS = [
  { q: 'How does the AI prediction work?', a: 'Our system uses a Random Forest machine learning model trained on historical stock data from January 2010 to December 2023 (14 years). It computes 16 technical indicators (MA, RSI, MACD, Bollinger Bands, Volume) and predicts the next-day closing price.' },
  { q: 'How accurate are the predictions?', a: 'The models achieve R² scores between 0.85–0.95 on test data. However, stock markets are inherently unpredictable. Use predictions as one signal among many, not as financial advice.' },
  { q: 'What stocks are supported?', a: 'Currently: RELIANCE.NS, INFY.NS, HDFCBANK.NS, MARUTI.NS, HINDUNILVR.NS, ^NSEI (Nifty 50), and ^BSESN (Sensex).' },
  { q: 'How do I add stocks to my watchlist?', a: 'Go to the Watchlist page, click "Add Stock", type the symbol (e.g. RELIANCE.NS) or click a quick-add button, then click Add.' },
  { q: 'What does the confidence score mean?', a: 'The confidence score (70–90%) reflects the model\'s internal certainty. Higher scores indicate the model found stronger patterns in recent data. It is not a guarantee of accuracy.' },
  { q: 'Why is the prediction showing 0 or current price?', a: 'This happens when the ML model file (.pkl) is not found for that symbol. Run `python -m ml.train` in the backend directory to train and save models.' },
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
      <AnimateHeight open={open}>
        <p className="pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{a}</p>
      </AnimateHeight>
    </div>
  )
}

function AnimateHeight({ open, children }) {
  return (
    <motion.div
      initial={false}
      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.25 }}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </motion.div>
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
