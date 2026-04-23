import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, Brain, Star, Target, ChevronRight } from "lucide-react";
import PredictionCard from "../components/PredictionCard";
import StockCard from "../components/StockCard";
import WatchlistTable from "../components/WatchlistTable";
import { CardSkeleton } from "../components/Loader";
import LWChart from "../components/LWChart";
import { getStockQuote, getWatchlist } from "../api/api";
import { useNavigate } from "react-router-dom";
import { SYMBOL_MAP, getDisplayName, getShortName } from "../utils/symbols";
import { useAuth } from "../context/AuthContext";

const STOCK_SYMBOLS = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "MARUTI.NS", "HINDUNILVR.NS"];
const INDEX_SYMBOLS = ["^NSEI", "^BSESN"];
const ALL_QUOTE_SYMBOLS = [...INDEX_SYMBOLS, ...STOCK_SYMBOLS];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
};

// Index mini-chart card — same visual language as StockCard but with embedded chart
function IndexCard({ symbol, quote, onClick }) {
  const isPositive = (quote?.change_pct ?? 0) >= 0;
  const info = SYMBOL_MAP[symbol];

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="card cursor-pointer overflow-hidden p-0"
    >
      {/* Card header — identical layout to StockCard */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-[0.12]
          ${isPositive ? "bg-emerald-500" : "bg-red-500"}`} />

        <div className="relative">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {info.short}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{symbol}</p>
        </div>

        <div className={`relative flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold
          ${isPositive
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>
          {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}{quote?.change_pct?.toFixed(2) ?? "—"}%
        </div>
      </div>

      {/* Price row */}
      <div className="px-4 pb-3 relative">
        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
          ₹{quote?.current_price?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "—"}
        </p>
        <p className={`text-xs font-semibold mt-0.5 ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {isPositive ? "+" : ""}₹{quote?.change?.toFixed(2) ?? "—"}
        </p>
      </div>

      {/* H/L row */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50/80 dark:bg-white/5 rounded-lg px-2 py-1.5 border border-slate-100/60 dark:border-white/5">
          <span className="block text-slate-400 text-[10px] uppercase tracking-wide">High</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            ₹{quote?.high?.toFixed(2) ?? "—"}
          </span>
        </div>
        <div className="bg-slate-50/80 dark:bg-white/5 rounded-lg px-2 py-1.5 border border-slate-100/60 dark:border-white/5">
          <span className="block text-slate-400 text-[10px] uppercase tracking-wide">Low</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            ₹{quote?.low?.toFixed(2) ?? "—"}
          </span>
        </div>
      </div>

      {/* Mini chart */}
      <div className="border-t border-slate-200/60 dark:border-slate-700/40">
        <LWChart key={symbol} symbol={symbol} period="1M" height={160} mini />
      </div>
    </motion.div>
  );
}

// ── Means-Ends Analysis Goal Card ────────────────────────────────────────────
function MeansEndsCard({ watchlist, quotes }) {
  const [goalValue,    setGoalValue]    = useState('150000')
  const [timeHorizon,  setTimeHorizon]  = useState('6')

  // Compute current portfolio value from watchlist + live quotes
  const currentValue = watchlist.reduce((sum, item) => {
    const q = quotes[item.symbol]
    return sum + (q?.current_price ?? 0)
  }, 0)

  const goal     = parseFloat(goalValue)  || 0
  const months   = parseInt(timeHorizon)  || 1
  const gap      = goal - currentValue
  const pct      = goal > 0 ? Math.min((currentValue / goal) * 100, 100) : 0
  const monthly  = gap > 0 ? (gap / months).toFixed(0) : 0

  const recommendation =
    currentValue === 0
      ? { label: 'Add stocks to your watchlist first', color: 'slate', action: 'Add stocks to your watchlist to compute your current portfolio value.' }
      : gap <= 0
      ? { label: 'Goal Achieved 🎉', color: 'emerald', action: 'You are on track or have exceeded your goal. Hold and monitor your positions.' }
      : (gap / currentValue) > 0.3
      ? { label: 'Aggressive Growth Needed', color: 'red', action: `Gap is large (${((gap/currentValue)*100).toFixed(0)}% of current value). Consider high-return stocks and increase risk tolerance.` }
      : (gap / currentValue) > 0.1
      ? { label: 'Moderate Growth Required', color: 'amber', action: 'Balanced risk/reward approach. Diversify across sectors and add growth stocks.' }
      : { label: 'On Track — Hold & Monitor', color: 'emerald', action: 'Small gap remaining. Maintain current positions and monitor market conditions.' }

  const colorMap = { slate: 'text-slate-500', emerald: 'text-emerald-500', amber: 'text-amber-500', red: 'text-red-500' }
  const bgMap    = { slate: 'bg-slate-500/10 border-slate-500/20', emerald: 'bg-emerald-500/10 border-emerald-500/20', amber: 'bg-amber-500/10 border-amber-500/20', red: 'bg-red-500/10 border-red-500/20' }
  const barMap   = { slate: 'bg-slate-400', emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Target size={15} className="text-indigo-500" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
            Goal-Based Investment Planner
          </h2>
          <p className="text-[10px] text-slate-400">Means-Ends Analysis · current state → goal state</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Target Portfolio Value (₹)
          </label>
          <input type="number" value={goalValue} onChange={e => setGoalValue(e.target.value)}
            className="input-base" placeholder="150000" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Time Horizon (months)
          </label>
          <input type="number" value={timeHorizon} onChange={e => setTimeHorizon(e.target.value)}
            className="input-base" placeholder="6" min="1" max="60" />
        </div>
      </div>

      {/* Current vs Goal */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/40">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Current State</p>
          <p className="text-lg font-black font-mono text-slate-900 dark:text-white">
            ₹{currentValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-slate-400">{watchlist.length} stocks in watchlist</p>
        </div>
        <div className={`rounded-xl p-3 border ${gap > 0 ? 'bg-blue-500/8 border-blue-500/20' : 'bg-emerald-500/8 border-emerald-500/20'}`}>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Goal State</p>
          <p className={`text-lg font-black font-mono ${gap > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
            ₹{goal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-slate-400">in {months} month{months !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500 dark:text-slate-400">Progress to goal</span>
          <span className={`font-bold ${colorMap[recommendation.color]}`}>{pct.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
          <motion.div className={`h-full rounded-full ${barMap[recommendation.color]}`}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }} />
        </div>
      </div>

      {/* Recommendation */}
      <div className={`p-3 rounded-xl border mb-3 ${bgMap[recommendation.color]}`}>
        <p className={`text-xs font-bold mb-1 ${colorMap[recommendation.color]}`}>
          {recommendation.label}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {recommendation.action}
        </p>
        {gap > 0 && currentValue > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Monthly growth needed: <span className="font-bold text-blue-500">₹{parseInt(monthly).toLocaleString('en-IN')}</span>
            {' '}to reach ₹{goal.toLocaleString('en-IN')} in {months} months.
          </p>
        )}
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed">
        <span className="font-semibold text-indigo-400">Means-Ends Analysis: </span>
        Compares current state (portfolio value) with goal state (target), identifies the difference (gap),
        and selects operators (buy/hold/rebalance) to reduce it — the core of goal-directed reasoning.
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [quotes,    setQuotes]    = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        ...ALL_QUOTE_SYMBOLS.map((s) =>
          getStockQuote(s).then((d) => ({ symbol: s, ...d }))
        ),
        getWatchlist(),
      ]);
      const qMap = {};
      results.slice(0, ALL_QUOTE_SYMBOLS.length).forEach((r) => {
        if (r.status === "fulfilled") qMap[r.value.symbol] = r.value;
      });
      setQuotes(qMap);
      const wl = results[ALL_QUOTE_SYMBOLS.length];
      if (wl.status === "fulfilled") setWatchlist(wl.value.items || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            <span className="gradient-text">{user?.name?.split(" ")[0] ?? "Trader"}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            AI-powered market intelligence • Dataset: Jan 2010 – Dec 2023
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Data
        </div>
      </div>

      {/* Market Overview — index cards with embedded mini charts */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-blue-500" />
          <h2 className="font-semibold gradient-text">Market Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INDEX_SYMBOLS.map((sym, i) => (
            <motion.div key={sym} custom={i} variants={fadeUp} initial="hidden" animate="show">
              <IndexCard
                symbol={sym}
                quote={quotes[sym]}
                onClick={() => navigate(`/stocks?symbol=${sym}`)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Quotes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            <h2 className="font-semibold gradient-text">Live Quotes</h2>
          </div>
          <button
            onClick={() => navigate("/stocks")}
            className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {loading
            ? STOCK_SYMBOLS.map((s) => <CardSkeleton key={s} />)
            : STOCK_SYMBOLS.map((s, i) => {
                const q = quotes[s];
                return (
                  <motion.div key={s} custom={i} variants={fadeUp} initial="hidden" animate="show">
                    <StockCard
                      symbol={s}
                      price={q?.current_price}
                      change={q?.change}
                      changePct={q?.change_pct}
                      high={q?.high}
                      low={q?.low}
                      onClick={() => navigate(`/stocks?symbol=${s}`)}
                    />
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* AI Predictions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-blue-500" />
            <h2 className="font-semibold gradient-text">AI Predictions</h2>
          </div>
          <button
            onClick={() => navigate("/predictions")}
            className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {STOCK_SYMBOLS.map((s, i) => (
            <motion.div key={s} custom={i} variants={fadeUp} initial="hidden" animate="show">
              <PredictionCard symbol={s} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Watchlist */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-blue-500" />
            <h2 className="font-semibold gradient-text">Watchlist</h2>
          </div>
          <button
            onClick={() => navigate("/watchlist")}
            className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
          >
            Manage →
          </button>
        </div>
        <div className="card shadow-md">
          <WatchlistTable
            items={watchlist.slice(0, 5)}
            quotes={quotes}
            onRemove={() => {}}
            compact
          />
        </div>
      </section>

      {/* Means-Ends Analysis */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-indigo-500" />
            <h2 className="font-semibold gradient-text">Investment Goal Planner</h2>
          </div>
          <button onClick={() => navigate("/portfolio")}
            className="text-xs text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1">
            Portfolio CSP <ChevronRight size={12} />
          </button>
        </div>
        <MeansEndsCard watchlist={watchlist} quotes={quotes} />
      </section>
    </motion.div>
  );
}
