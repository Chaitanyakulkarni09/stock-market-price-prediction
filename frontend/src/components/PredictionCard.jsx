import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ArrowUpRight, ArrowDownRight, RefreshCw, Info } from 'lucide-react'
import { useState } from 'react'
import { getPrediction } from '../api/api'
import { Spinner } from './Loader'
import { getShortName, getDisplayName } from '../utils/symbols'

export default function PredictionCard({ symbol, initialData }) {
  const [data, setData] = useState(initialData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getPrediction(symbol)
      setData(result)
    } catch {
      setError('Failed to fetch prediction')
    } finally {
      setLoading(false)
    }
  }

  const isPositive = data ? data.change_percent >= 0 : true
  const shortName = getShortName(symbol)
  const absChange = data ? Math.abs(data.change_percent).toFixed(2) : null

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      transition={{ duration: 0.2 }}
      className={`card relative overflow-hidden transition-all duration-300
        ${data ? (isPositive ? 'hover:shadow-emerald-500/10' : 'hover:shadow-red-500/10') : 'hover:shadow-blue-500/10'}
        hover:shadow-lg`}
    >
      {/* Gradient accent */}
      <div className={`absolute inset-0 opacity-[0.03] rounded-2xl pointer-events-none
        ${isPositive
          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
          : 'bg-gradient-to-br from-red-400 to-red-600'}`}
      />

      {/* Top row */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <Brain size={17} className="text-blue-500" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{shortName}</p>
            <p className="text-xs text-slate-400">{symbol}</p>
          </div>
        </div>
        {data && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold
              ${isPositive
                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                : 'bg-red-500/15 text-red-500 border border-red-500/20'}`}
          >
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {isPositive ? '+' : '-'}{absChange}%
          </motion.div>
        )}
      </div>

      {data ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* AI Range label with tooltip */}
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-slate-400 font-medium">AI Estimated Range</span>
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <Info size={11} />
              </button>
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-xl
                      bg-slate-900 dark:bg-slate-700 text-white text-xs leading-relaxed z-50 shadow-xl"
                  >
                    ML prediction clamped to ±30% of current price. Not financial advice.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Current</p>
              <p className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                ₹{data.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`rounded-xl p-3 border
              ${isPositive
                ? 'bg-emerald-500/8 border-emerald-500/20 dark:bg-emerald-500/10'
                : 'bg-red-500/8 border-red-500/20 dark:bg-red-500/10'}`}>
              <p className="text-xs text-slate-400 mb-1">Predicted</p>
              <p className={`font-bold font-mono text-sm ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                ₹{data.predicted_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Confidence</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{data.confidence}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.confidence}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  data.confidence > 80
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : data.confidence > 65
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                    : 'bg-gradient-to-r from-red-500 to-red-400'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {data.model_available ? '🤖 ML Active' : '⚠️ Fallback'}
            </p>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlePredict}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition-colors"
            >
              {loading ? <Spinner size={11} /> : <RefreshCw size={11} />}
              Refresh
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center py-4 gap-3 relative">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
            <Brain size={22} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-400 text-center">Click to get AI prediction</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handlePredict}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <Spinner size={14} /> : <Brain size={14} />}
            {loading ? 'Predicting...' : 'Predict Now'}
          </motion.button>
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </div>
      )}
    </motion.div>
  )
}
