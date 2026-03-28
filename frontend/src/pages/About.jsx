import { motion } from 'framer-motion'
import { TrendingUp, Brain, BarChart2, Shield, Cpu, Database } from 'lucide-react'

const FEATURES = [
  { icon: Brain,    title: 'ML Predictions',      desc: 'Random Forest with GridSearchCV + TimeSeriesSplit on 14 years of data (2010–2023). 19 technical indicators including MA50, ATR, OBV. 27 symbols across 8 sectors.' },
  { icon: TrendingUp, title: 'Live Market Data',  desc: 'Real-time quotes and candlestick charts via direct Yahoo Finance API. No API key required. Supports 1D, 1W, 1M, 3M, 1Y timeframes.' },
  { icon: BarChart2, title: 'AI Analytics',       desc: 'lightweight-charts v5 candlestick + volume, AI prediction overlay, investment simulator, Buy/Sell/Hold signals, and 3-month stats.' },
  { icon: Cpu,      title: 'AI Engine',            desc: 'Demonstrates all AI syllabus concepts — Intelligent Agents, Search, Heuristics, Minimax, Rule-Based Logic, Expert Systems, and Planning.' },
  { icon: Shield,   title: 'JWT Authentication',  desc: 'Secure accounts with bcrypt password hashing and JWT tokens. Personal watchlist, chat history, and full account deletion.' },
  { icon: Database, title: 'Reliable Backend',    desc: 'FastAPI + MySQL with SQLAlchemy ORM. All 5 tables auto-created on startup. Deployed on Render with Railway MySQL.' },
]

const STACK = [
  { name: 'React 18 + Vite',      color: 'bg-blue-500/10 text-blue-500'     },
  { name: 'Tailwind CSS',          color: 'bg-cyan-500/10 text-cyan-500'     },
  { name: 'Framer Motion',         color: 'bg-purple-500/10 text-purple-500' },
  { name: 'lightweight-charts v5', color: 'bg-pink-500/10 text-pink-500'     },
  { name: 'FastAPI',               color: 'bg-emerald-500/10 text-emerald-500'},
  { name: 'MySQL + SQLAlchemy',    color: 'bg-orange-500/10 text-orange-500' },
  { name: 'scikit-learn',          color: 'bg-yellow-500/10 text-yellow-500' },
  { name: 'httpx (Yahoo Finance)', color: 'bg-red-500/10 text-red-500'       },
  { name: 'python-jose (JWT)',     color: 'bg-indigo-500/10 text-indigo-500' },
  { name: 'bcrypt',                color: 'bg-slate-500/10 text-slate-400'   },
]

const SECTORS = [
  { name: 'IT',              symbols: 'TCS, INFY, WIPRO, HCLTECH, TECHM' },
  { name: 'Banking',         symbols: 'HDFCBANK, ICICIBANK, SBIN, KOTAKBANK, AXISBANK' },
  { name: 'Finance',         symbols: 'BAJFINANCE, BAJAJFINSV' },
  { name: 'Energy',          symbols: 'RELIANCE, ONGC' },
  { name: 'Utilities',       symbols: 'NTPC, POWERGRID' },
  { name: 'Auto',            symbols: 'MARUTI, M&M' },
  { name: 'FMCG',            symbols: 'HINDUNILVR, ITC, NESTLEIND' },
  { name: 'Pharma/Consumer', symbols: 'SUNPHARMA, TITAN' },
  { name: 'Conglomerate',    symbols: 'ADANIPORTS, ADANIENT' },
  { name: 'Indices',         symbols: 'NIFTY 50 (^NSEI), SENSEX (^BSESN)' },
]

export default function About() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">About</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">AI-powered stock market prediction platform</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">AI Stocks</h2>
            <p className="text-xs text-slate-400">27 Symbols · 19 Features · 14 Years Training Data</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          AI Stocks is a full-stack financial analytics platform combining machine learning with real-time market data.
          It provides next-day price predictions for 27 major Indian stocks and indices using Random Forest models
          trained with GridSearchCV on{' '}
          <span className="text-blue-500 font-semibold">14 years of historical data (Jan 2010 – Dec 2023)</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center flex-shrink-0">
              <f.icon size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{f.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">27 Supported Symbols</h2>
        <div className="space-y-2">
          {SECTORS.map(s => (
            <div key={s.name} className="flex items-start gap-3 text-xs">
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold w-28 text-center">
                {s.name}
              </span>
              <span className="text-slate-500 dark:text-slate-400">{s.symbols}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {STACK.map(s => (
            <span key={s.name} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${s.color}`}>
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
