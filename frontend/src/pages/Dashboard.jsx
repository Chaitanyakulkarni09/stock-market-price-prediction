import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, Brain, Star } from "lucide-react";
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
    </motion.div>
  );
}
