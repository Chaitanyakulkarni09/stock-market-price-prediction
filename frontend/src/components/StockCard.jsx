import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { getShortName } from '../utils/symbols'

export default function StockCard({ symbol, price, change, changePct, high, low, onClick }) {
  const isPositive = (changePct ?? 0) >= 0
  const shortName  = getShortName(symbol)

  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      className="card cursor-pointer relative overflow-hidden"
    >
      {/* Colour glow blob */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-[0.15] pointer-events-none
        ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`} />

      <div className="relative">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {shortName}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{symbol}</p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold
            ${isPositive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isPositive ? '+' : ''}{changePct?.toFixed(2)}%
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono leading-tight">
            ₹{price?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '—'}
          </p>
          <p className={`text-xs font-semibold mt-0.5 ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}₹{change?.toFixed(2) ?? '—'}
          </p>
        </div>

        {/* H/L */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="bg-slate-50/80 dark:bg-white/5 rounded-lg px-2 py-1.5 border border-slate-100/80 dark:border-white/5">
            <span className="block text-slate-400 text-[10px] uppercase tracking-wide">High</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">₹{high?.toFixed(2) ?? '—'}</span>
          </div>
          <div className="bg-slate-50/80 dark:bg-white/5 rounded-lg px-2 py-1.5 border border-slate-100/80 dark:border-white/5">
            <span className="block text-slate-400 text-[10px] uppercase tracking-wide">Low</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">₹{low?.toFixed(2) ?? '—'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
