import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Plus, X, TrendingUp, TrendingDown, Trash2, Search } from 'lucide-react'
import { getWatchlist, addToWatchlist, removeFromWatchlist, getStockQuote } from '../api/api'
import { Spinner } from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ALL_SYMBOLS, SYMBOL_MAP, SECTORS, getSymbolsBySector, getShortName } from '../utils/symbols'

export default function Watchlist() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [items,       setItems]       = useState([])
  const [quotes,      setQuotes]      = useState({})
  const [loading,     setLoading]     = useState(true)
  const [adding,      setAdding]      = useState(false)
  const [newSymbol,   setNewSymbol]   = useState('')
  const [showAdd,     setShowAdd]     = useState(false)
  const [error,       setError]       = useState('')
  const [activeSector,setActiveSector]= useState('All')

  const fetchWatchlist = async () => {
    setLoading(true)
    try {
      const data = await getWatchlist()
      const list = data.items || []
      setItems(list)
      const qResults = await Promise.allSettled(list.map(i => getStockQuote(i.symbol)))
      const qMap = {}
      qResults.forEach((r, idx) => {
        if (r.status === 'fulfilled') qMap[list[idx].symbol] = r.value
      })
      setQuotes(qMap)
    } catch { setItems([]) }
    setLoading(false)
  }

  useEffect(() => { fetchWatchlist() }, [])

  const handleAdd = async () => {
    const sym = newSymbol.trim().toUpperCase()
    if (!sym) return
    setAdding(true); setError('')
    try {
      await addToWatchlist(sym)
      setNewSymbol(''); setShowAdd(false)
      await fetchWatchlist()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to add symbol')
    }
    setAdding(false)
  }

  const handleRemove = async (symbol) => {
    try {
      await removeFromWatchlist(symbol)
      setItems(prev => prev.filter(i => i.symbol !== symbol))
    } catch {}
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }} className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Watchlist</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {user?.name}&apos;s personal watchlist
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          onClick={() => { setShowAdd(p => !p); setError('') }}
          className="btn-primary flex items-center gap-2">
          {showAdd ? <X size={14} /> : <Plus size={14} />}
          {showAdd ? 'Cancel' : 'Add Stock'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="card max-w-md">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Add to Watchlist</p>
            <div className="flex gap-2 mb-3">
              <input value={newSymbol} onChange={e => setNewSymbol(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="e.g. RELIANCE.NS"
                className="input-base flex-1" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd} disabled={adding}
                className="btn-primary flex items-center gap-1.5">
                {adding ? <Spinner size={13} /> : <Plus size={13} />} Add
              </motion.button>
            </div>
            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
            {/* Sector filter */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['All', ...SECTORS].map(s => (
                <button key={s} onClick={() => setActiveSector(s)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all
                    ${activeSector === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-blue-500'}`}>
                  {s}
                </button>
              ))}
            </div>
            {/* Symbol pills */}
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {(activeSector === 'All' ? ALL_SYMBOLS : getSymbolsBySector(activeSector)).map(s => (
                <motion.button key={s} whileTap={{ scale: 0.93 }} onClick={() => setNewSymbol(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                    ${newSymbol === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white'}`}>
                  {getShortName(s)}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Star size={16} className="text-blue-500" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Your Stocks</h2>
          <span className="ml-auto text-xs text-slate-400">{items.length} stocks</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : !items.length ? (
          <div className="text-center py-12 text-slate-400">
            <Star size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No stocks yet. Add some to track them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider
                  border-b border-slate-100/80 dark:border-slate-700/40">
                  <th className="pb-3 font-medium">Symbol</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Change</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">High</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Low</th>
                  <th className="pb-3 font-medium text-right">Remove</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {items.map((item, i) => {
                    const q     = quotes[item.symbol]
                    const isPos = q ? q.change_pct >= 0 : true
                    return (
                      <motion.tr key={item.symbol}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                        exit={{ opacity: 0, x: 12 }}
                        className="border-b border-slate-100/60 dark:border-slate-700/30
                          hover:bg-blue-500/5 transition-colors duration-200 cursor-pointer"
                        onClick={() => navigate(`/stocks?symbol=${item.symbol}`)}>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-500">
                                {item.symbol.replace('.NS','').replace('^','').slice(0,2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {SYMBOL_MAP[item.symbol]?.short || item.symbol.replace('.NS','').replace('^','')}
                              </p>
                              <p className="text-xs text-slate-400">{item.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 font-mono font-semibold text-slate-900 dark:text-white">
                          {q ? `₹${q.current_price?.toLocaleString('en-IN',{minimumFractionDigits:2})}` : '—'}
                        </td>
                        <td className="py-3.5 pr-4">
                          {q ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold
                              px-2 py-0.5 rounded-lg
                              ${isPos ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {isPos ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                              {isPos?'+':''}{q.change_pct?.toFixed(2)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3.5 pr-4 hidden sm:table-cell text-slate-500 dark:text-slate-400 font-mono text-xs">
                          {q ? `₹${q.high?.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3.5 pr-4 hidden sm:table-cell text-slate-500 dark:text-slate-400 font-mono text-xs">
                          {q ? `₹${q.low?.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3.5 text-right" onClick={e => e.stopPropagation()}>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
                            onClick={() => handleRemove(item.symbol)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500
                              hover:bg-red-500/10 transition-all">
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
        )}
      </div>
    </motion.div>
  )
}
