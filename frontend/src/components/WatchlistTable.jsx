import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react'

export default function WatchlistTable({ items, quotes, onRemove, compact }) {
  if (!items?.length) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No stocks in watchlist. Add some to track them.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <th className="pb-3 font-medium">Symbol</th>
            {!compact && <th className="pb-3 font-medium">Price</th>}
            {!compact && <th className="pb-3 font-medium">Change</th>}
            <th className="pb-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {items.map((item, i) => {
              const q = quotes?.[item.symbol]
              const isPos = q ? q.change_pct >= 0 : true
              return (
                <motion.tr
                  key={item.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-500">
                          {item.symbol.replace('.NS','').replace('^','').slice(0,2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.symbol.replace('.NS','').replace('^','')}
                        </p>
                        {!compact && <p className="text-xs text-slate-400">{item.symbol}</p>}
                      </div>
                    </div>
                  </td>
                  {!compact && (
                    <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {q ? `₹${q.current_price?.toLocaleString('en-IN')}` : '—'}
                    </td>
                  )}
                  {!compact && (
                    <td className="py-3 pr-4">
                      {q ? (
                        <span className={`flex items-center gap-1 text-xs font-semibold
                          ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {isPos ? '+' : ''}{q.change_pct?.toFixed(2)}%
                        </span>
                      ) : '—'}
                    </td>
                  )}
                  <td className="py-3 text-right">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => onRemove(item.symbol)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </td>
                </motion.tr>
              )
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}
