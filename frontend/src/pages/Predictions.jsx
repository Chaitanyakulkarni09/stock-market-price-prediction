import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, ChevronDown } from 'lucide-react'
import PredictionCard from '../components/PredictionCard'
import { getPrediction } from '../api/api'
import { Spinner } from '../components/Loader'
import { ALL_SYMBOLS, SYMBOL_MAP, SECTORS, getSymbolsBySector } from '../utils/symbols'

const FEATURED = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "MARUTI.NS", "^NSEI", "^BSESN"]

export default function Predictions() {
  const [selected, setSelected] = useState('RELIANCE.NS')
  const [result, setResult] = useState(null)
  const [activeSector, setActiveSector] = useState('All')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await getPrediction(selected)
      setResult(data)
    } catch {
      setError('Prediction failed. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const isPos = result ? result.change_percent >= 0 : true

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">AI Predictions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Next-day price predictions using Random Forest ML models
        </p>
      </div>

      {/* Predictor */}
      <div className="card max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <Brain size={16} className="text-blue-500" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-white">Run Prediction</h2>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="input-base appearance-none pr-10 cursor-pointer"
            >
              {ALL_SYMBOLS.map(s => (
                <option key={s} value={s}>{SYMBOL_MAP[s].display} ({s})</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handlePredict}
            disabled={loading}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <Spinner size={14} /> : <Brain size={14} />}
            {loading ? 'Predicting...' : 'Predict'}
          </motion.button>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-xl relative overflow-hidden"
        >
          <div className={`absolute inset-0 opacity-[0.04] rounded-2xl pointer-events-none
            ${isPos ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Prediction Result</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{result.symbol}</p>
              </div>
              <div className={`text-3xl font-bold font-mono ${isPos ? 'positive' : 'negative'}`}>
                {isPos ? '+' : ''}{result.change_percent?.toFixed(2)}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100/80 dark:border-slate-700/40">
                <p className="text-xs text-slate-400 mb-1">Current Price</p>
                <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  ₹{result.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`rounded-xl p-4 border ${isPos
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20'}`}>
                <p className="text-xs text-slate-400 mb-1">Predicted Price</p>
                <p className={`text-2xl font-bold font-mono ${isPos ? 'positive' : 'negative'}`}>
                  ₹{result.predicted_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500 dark:text-slate-400">Model Confidence</span>
                <span className="font-bold text-slate-900 dark:text-white">{result.confidence}%</span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    result.confidence > 80
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : result.confidence > 65
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      : 'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{result.model_available ? '🤖 ML Model Active' : '⚠️ Fallback mode'}</span>
              <span>{new Date(result.predicted_at).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* All prediction cards — filterable by sector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">All Stocks ({ALL_SYMBOLS.length})</h2>
          <div className="flex flex-wrap gap-1.5">
            {['All', ...SECTORS].map(s => (
              <button key={s} onClick={() => setActiveSector(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all
                  ${activeSector === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-blue-500'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(activeSector === 'All' ? ALL_SYMBOLS : getSymbolsBySector(activeSector)).map((s, i) => (
            <motion.div key={s} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}>
              <PredictionCard symbol={s} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
