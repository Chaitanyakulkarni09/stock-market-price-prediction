import { motion } from 'framer-motion'
import { TrendingUp, Brain, BarChart2, Shield } from 'lucide-react'

const FEATURES = [
  { icon: Brain, title: 'ML Predictions', desc: 'Random Forest models trained on historical data from January 2010 to December 2023 (14 years) with 16 technical indicators.' },
  { icon: TrendingUp, title: 'Live Data', desc: 'Real-time stock prices and charts powered by Yahoo Finance and TradingView.' },
  { icon: BarChart2, title: 'Analytics', desc: 'Interactive Chart.js visualizations for historical trends, volume, and market movement.' },
  { icon: Shield, title: 'Reliable Backend', desc: 'FastAPI + MySQL backend with automatic table creation and model loading on startup.' },
]

const STACK = [
  { name: 'React + Vite', color: 'bg-blue-500/10 text-blue-500' },
  { name: 'Tailwind CSS', color: 'bg-cyan-500/10 text-cyan-500' },
  { name: 'Framer Motion', color: 'bg-purple-500/10 text-purple-500' },
  { name: 'Chart.js', color: 'bg-pink-500/10 text-pink-500' },
  { name: 'FastAPI', color: 'bg-emerald-500/10 text-emerald-500' },
  { name: 'MySQL', color: 'bg-orange-500/10 text-orange-500' },
  { name: 'scikit-learn', color: 'bg-yellow-500/10 text-yellow-500' },
  { name: 'yfinance', color: 'bg-red-500/10 text-red-500' },
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
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">AI Stocks</h2>
            <p className="text-xs text-slate-400">Market Intelligence Platform</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          AI Stocks is a full-stack financial analytics platform that combines machine learning predictions
          with real-time market data. Built with a FastAPI backend, MySQL database, and React frontend,
          it provides next-day price predictions for major Indian stocks using Random Forest models
          trained on historical data from <span className="text-blue-500 font-semibold">January 2010 to December 2023 (14 years)</span> of market data.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
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
