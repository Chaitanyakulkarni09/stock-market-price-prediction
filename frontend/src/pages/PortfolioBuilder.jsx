import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, ChevronRight, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { getConstrainedPortfolios } from '../api/api'

const SECTORS = ['Banking', 'IT', 'Energy', 'Auto', 'FMCG', 'Pharma', 'Finance', 'Utilities', 'Consumer']
const RISK_LEVELS = [
  { value: 'low',    label: 'Low',    desc: 'Stable, low-volatility stocks (risk score 1–4)',  color: 'emerald' },
  { value: 'medium', label: 'Medium', desc: 'Balanced risk/reward (risk score 3–6)',            color: 'amber'   },
  { value: 'high',   label: 'High',   desc: 'Aggressive growth stocks (risk score 5–10)',       color: 'red'     },
]

const FADE_UP = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }
const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }

function HowItWorks() {
  const [open, setOpen] = useState(false)
  return (
    <div className="card">
      <button onClick={() => setOpen(p => !p)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <AlertCircle size={15} className="text-blue-500" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white text-sm">How CSP Solving Works</span>
        </div>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={16} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <div className="mt-4 space-y-3">
              {[
                { n: '01', title: 'Variables',   desc: 'Each stock in the universe is a variable that can be included (1) or excluded (0) from the portfolio.' },
                { n: '02', title: 'Domains',     desc: 'Each variable has domain {0, 1}. The solver tries all combinations of stocks up to max_stocks.' },
                { n: '03', title: 'Constraints', desc: 'Budget limit, min/max stocks, per-stock allocation cap, sector exclusions, and risk score range.' },
                { n: '04', title: 'Backtracking', desc: 'The solver uses backtracking search — it tries a combination, checks all constraints, and backtracks if any constraint is violated.' },
                { n: '05', title: 'Solution',    desc: 'All combinations that satisfy every constraint are returned as valid portfolios, sorted by expected return.' },
              ].map(s => (
                <div key={s.n} className="flex gap-3">
                  <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 rounded-lg px-2 py-1 h-fit shrink-0 mt-0.5">{s.n}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{s.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PortfolioCard({ portfolio, index }) {
  const riskColor = portfolio.avg_risk <= 4 ? 'emerald' : portfolio.avg_risk <= 6 ? 'amber' : 'red'
  return (
    <motion.div variants={FADE_UP} className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Briefcase size={15} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Portfolio #{index + 1}</p>
            <p className="text-[10px] text-slate-400">{portfolio.num_stocks} stocks</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-emerald-500">+{portfolio.avg_return}%</p>
          <p className="text-[10px] text-slate-400">avg expected return</p>
        </div>
      </div>

      {/* Stocks */}
      <div className="space-y-2 mb-4">
        {portfolio.stocks.map(s => (
          <div key={s.symbol} className="flex items-center justify-between p-2.5 rounded-xl
            bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <span className="text-[10px] font-black text-blue-500">
                  {s.symbol.replace('.NS','').slice(0,2)}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{s.name}</p>
                <p className="text-[10px] text-slate-400">{s.sector} · {s.shares} shares @ ₹{s.price.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                ₹{s.allocated.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-500">+{s.expected_return}%</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2 border border-slate-200 dark:border-slate-700/30">
          <p className="text-xs font-black text-slate-800 dark:text-white">₹{portfolio.total_cost.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400">Invested</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2 border border-slate-200 dark:border-slate-700/30">
          <p className="text-xs font-black text-slate-800 dark:text-white">₹{portfolio.remaining.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400">Remaining</p>
        </div>
        <div className={`rounded-xl p-2 border bg-${riskColor}-500/8 border-${riskColor}-500/20`}>
          <p className={`text-xs font-black text-${riskColor}-500`}>{portfolio.avg_risk}/10</p>
          <p className="text-[10px] text-slate-400">Avg Risk</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function PortfolioBuilder() {
  const [budget,       setBudget]       = useState('100000')
  const [minStocks,    setMinStocks]    = useState(2)
  const [maxStocks,    setMaxStocks]    = useState(3)
  const [maxPct,       setMaxPct]       = useState(40)
  const [riskLevel,    setRiskLevel]    = useState('medium')
  const [excludeSectors, setExcludeSectors] = useState([])
  const [loading,      setLoading]      = useState(false)
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState('')

  const toggleSector = (s) =>
    setExcludeSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleSubmit = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await getConstrainedPortfolios({
        budget:                parseFloat(budget) || 100000,
        min_stocks:            minStocks,
        max_stocks:            maxStocks,
        max_per_stock_percent: maxPct,
        risk_level:            riskLevel,
        exclude_sectors:       excludeSectors,
      })
      setResult(data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to solve. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Briefcase size={24} className="text-blue-500" /> Portfolio Builder
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Constraint Satisfaction Problem (CSP) · backtracking search · finds all valid portfolios
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Constraints form */}
        <div className="card space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <TrendingUp size={15} className="text-purple-500" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Define Constraints</h2>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Total Budget (₹)
            </label>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
              className="input-base" placeholder="100000" />
          </div>

          {/* Min / Max stocks */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Min Stocks
              </label>
              <select value={minStocks} onChange={e => setMinStocks(+e.target.value)} className="input-base cursor-pointer">
                {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Max Stocks
              </label>
              <select value={maxStocks} onChange={e => setMaxStocks(+e.target.value)} className="input-base cursor-pointer">
                {[2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Max per stock % */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Max per Stock: <span className="text-blue-500 font-bold">{maxPct}%</span>
            </label>
            <input type="range" min={10} max={60} step={5} value={maxPct}
              onChange={e => setMaxPct(+e.target.value)}
              className="w-full accent-blue-500 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>10%</span><span>60%</span>
            </div>
          </div>

          {/* Risk level */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Risk Tolerance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_LEVELS.map(r => (
                <button key={r.value} onClick={() => setRiskLevel(r.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                    ${riskLevel === r.value
                      ? r.value === 'low'    ? 'bg-emerald-500 border-emerald-400 text-white'
                      : r.value === 'medium' ? 'bg-amber-500 border-amber-400 text-white'
                      :                        'bg-red-500 border-red-400 text-white'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              {RISK_LEVELS.find(r => r.value === riskLevel)?.desc}
            </p>
          </div>

          {/* Exclude sectors */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Exclude Sectors (optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map(s => (
                <button key={s} onClick={() => toggleSector(s)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
                    ${excludeSectors.includes(s)
                      ? 'bg-red-500/15 border-red-500/30 text-red-500'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-400'}`}>
                  {excludeSectors.includes(s) ? '✕ ' : ''}{s}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle size={13} /> {error}
            </p>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Solving CSP…</>
              : <><Briefcase size={15} /> Find Valid Portfolios</>}
          </motion.button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold
                ${result.count > 0
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'}`}>
                {result.count > 0 ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {result.message}
              </div>
              <motion.div variants={STAGGER} initial="hidden" animate="visible" className="space-y-4">
                {result.portfolios.map((p, i) => (
                  <PortfolioCard key={i} portfolio={p} index={i} />
                ))}
              </motion.div>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Briefcase size={36} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No results yet</p>
              <p className="text-xs text-slate-400 mt-1">Set your constraints and click Find Valid Portfolios</p>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <HowItWorks />
    </motion.div>
  )
}
