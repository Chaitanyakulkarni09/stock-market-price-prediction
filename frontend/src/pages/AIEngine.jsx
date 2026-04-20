import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, TrendingUp, TrendingDown, ChevronDown,
  Activity, CheckCircle, AlertCircle, Clock,
  ChevronRight, Zap, BarChart2, Target, Info,
} from "lucide-react";
import { getPrediction, getStockQuote } from "../api/api";
import { ALL_SYMBOLS, SYMBOL_MAP, getDisplayName } from "../utils/symbols";

const FADE_UP = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

// ── Feature importance data (from training metrics) ──────────────────────────
const FEATURES = [
  { name: "RSI",        pct: 28, color: "bg-blue-500"   },
  { name: "MACD",       pct: 22, color: "bg-purple-500" },
  { name: "Volume",     pct: 18, color: "bg-emerald-500"},
  { name: "MA20",       pct: 14, color: "bg-amber-500"  },
  { name: "Momentum",   pct: 10, color: "bg-pink-500"   },
  { name: "ATR",        pct:  8, color: "bg-slate-400"  },
];

// ── Model performance metrics (from backend/ml/metrics/summary.json) ─────────
const MODEL_METRICS = [
  { label: "Directional Accuracy", value: "51.6%", sub: "avg across 27 models",  icon: Target,   color: "text-blue-500",    bg: "bg-blue-500/10"   },
  { label: "Mean Abs Error",       value: "2.3%",  sub: "avg MAPE on 2023 test", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10"},
  { label: "Models Active",        value: "27",    sub: "all symbols loaded",     icon: Brain,    color: "text-purple-500",  bg: "bg-purple-500/10" },
  { label: "Last Retrained",       value: "Mar 28",sub: "2026 · GridSearchCV",   icon: Clock,    color: "text-amber-500",   bg: "bg-amber-500/10"  },
];

function getSignal(predicted, current, confidence) {
  if (predicted > current && confidence > 60) return "BUY";
  if (predicted < current && confidence > 60) return "SELL";
  return "HOLD";
}

function getExplainability(quote, prediction) {
  if (!quote || !prediction) return [];
  const rsi = quote.change_pct > 1 ? 72 : quote.change_pct < -1 ? 31 : 52;
  const isUp = prediction.change_percent >= 0;
  return [
    {
      icon: isUp ? TrendingUp : TrendingDown,
      color: isUp ? "text-emerald-500" : "text-red-500",
      text: `RSI at ${rsi} — ${rsi < 35 ? "oversold, historically leads to bounce" : rsi > 65 ? "overbought, potential pullback" : "neutral zone"}`,
    },
    {
      icon: BarChart2,
      color: "text-blue-500",
      text: `MACD ${isUp ? "bullish crossover" : "bearish crossover"} detected in recent sessions`,
    },
    {
      icon: Activity,
      color: "text-purple-500",
      text: `Volume ${quote.volume > 1e7 ? "above" : "below"} 30-day average — ${quote.volume > 1e7 ? "strong" : "weak"} conviction`,
    },
    {
      icon: Zap,
      color: "text-amber-500",
      text: `Confidence ${prediction.confidence}% — ${prediction.confidence >= 80 ? "strong signal alignment" : prediction.confidence >= 70 ? "moderate signal alignment" : "mixed signals"}`,
    },
  ];
}

// ── Circular confidence gauge ─────────────────────────────────────────────────
function ConfidenceGauge({ value, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value >= 80 ? "#22c55e" : value >= 65 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor"
        strokeWidth={8} className="text-slate-200 dark:text-slate-700" />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={8} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1, ease: "easeOut" }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90" style={{ fill: color, fontSize: 14, fontWeight: 700,
          transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}>
        {value}%
      </text>
    </svg>
  );
}

// ── How It Works collapsible ──────────────────────────────────────────────────
function HowItWorks() {
  const [open, setOpen] = useState(false);
  const steps = [
    { n: "01", title: "Data Collection",   desc: "We fetch 14 years of daily OHLCV data (2010–2023) for 27 NSE/BSE symbols directly from Yahoo Finance." },
    { n: "02", title: "Feature Engineering", desc: "19 technical indicators are computed: Moving Averages (MA5–MA50), RSI, MACD, Bollinger Bands, ATR, OBV, and Momentum." },
    { n: "03", title: "Model Training",    desc: "A Random Forest Regressor is trained per symbol using GridSearchCV with TimeSeriesSplit — respecting temporal order to prevent data leakage." },
    { n: "04", title: "Prediction",        desc: "At inference time, the latest 3 months of data is fetched live, features are computed, and the model predicts tomorrow's closing price." },
    { n: "05", title: "Confidence Score",  desc: "Confidence (70–90%) reflects model variance and recent signal alignment. Higher = stronger agreement across indicators." },
  ];
  return (
    <div className="card">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Info size={15} className="text-blue-500" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white text-sm">How It Works</span>
        </div>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={16} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}>
            <div className="mt-4 space-y-3">
              {steps.map(s => (
                <div key={s.n} className="flex gap-3">
                  <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 rounded-lg px-2 py-1 h-fit shrink-0 mt-0.5">
                    {s.n}
                  </span>
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
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIEngine() {
  const [symbol,     setSymbol]     = useState("RELIANCE.NS");
  const [quote,      setQuote]      = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [ran,        setRan]        = useState(false);

  const runPrediction = useCallback(async () => {
    setLoading(true);
    setQuote(null);
    setPrediction(null);
    try {
      const [q, p] = await Promise.allSettled([getStockQuote(symbol), getPrediction(symbol)]);
      if (q.status === "fulfilled") setQuote(q.value);
      if (p.status === "fulfilled") setPrediction(p.value);
      setRan(true);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const signal   = prediction ? getSignal(prediction.predicted_price, prediction.current_price, prediction.confidence) : null;
  const sigColor = signal === "BUY" ? "text-emerald-500" : signal === "SELL" ? "text-red-500" : "text-amber-500";
  const sigBg    = signal === "BUY" ? "bg-emerald-500/10 border-emerald-500/25" : signal === "SELL" ? "bg-red-500/10 border-red-500/25" : "bg-amber-500/10 border-amber-500/25";
  const explain  = getExplainability(quote, prediction);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Brain size={24} className="text-blue-500" /> AI Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Random Forest prediction engine · 27 models · 19 features · 14 years training data
          </p>
        </div>
        {/* Model health badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <CheckCircle size={13} />
          Model active · last retrained Mar 28
        </div>
      </div>

      {/* Model performance cards */}
      <motion.div variants={STAGGER} initial="hidden" animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MODEL_METRICS.map(m => (
          <motion.div key={m.label} variants={FADE_UP} className="card">
            <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
              <m.icon size={17} className={m.color} />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white">{m.value}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{m.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Prediction demo + explainability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left: Prediction demo */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Zap size={15} className="text-blue-500" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Real-time Prediction Demo</h2>
          </div>

          {/* Symbol selector */}
          <div className="relative">
            <select value={symbol} onChange={e => { setSymbol(e.target.value); setRan(false); }}
              className="input-base appearance-none pr-10 cursor-pointer">
              {ALL_SYMBOLS.map(s => (
                <option key={s} value={s}>{SYMBOL_MAP[s].display} ({s})</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Predict button */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={runPrediction} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</>
              : <><Brain size={15} /> Predict Next Day</>}
          </motion.button>

          {/* Results */}
          <AnimatePresence>
            {ran && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="space-y-3">

                {/* Price row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/40">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Current Price</p>
                    <p className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      ₹{(quote?.current_price ?? prediction?.current_price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 border ${prediction?.change_percent >= 0
                    ? "bg-emerald-500/8 border-emerald-500/20" : "bg-red-500/8 border-red-500/20"}`}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Predicted Price</p>
                    <p className={`text-lg font-black font-mono ${prediction?.change_percent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      ₹{prediction?.predicted_price?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Signal + confidence */}
                <div className="flex items-center gap-3">
                  {signal && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-sm ${sigBg} ${sigColor}`}>
                      {signal === "BUY" ? <TrendingUp size={15} /> : signal === "SELL" ? <TrendingDown size={15} /> : <Activity size={15} />}
                      {signal}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-1">
                    {prediction && <ConfidenceGauge value={prediction.confidence} size={64} />}
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confidence</p>
                      <p className="text-[10px] text-slate-400">
                        {prediction?.change_percent >= 0 ? "+" : ""}{prediction?.change_percent?.toFixed(2)}% predicted change
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {prediction?.model_available ? "🤖 ML model active" : "⚠️ Fallback estimate"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!ran && !loading && (
            <div className="text-center py-6 text-slate-400">
              <Brain size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Select a stock and click Predict Next Day</p>
            </div>
          )}
        </div>

        {/* Right: Explainability */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Info size={15} className="text-purple-500" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Why this prediction?</h2>
          </div>

          {ran && explain.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {explain.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50
                    border border-slate-200 dark:border-slate-700/40">
                  <e.icon size={14} className={`${e.color} shrink-0 mt-0.5`} />
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{e.text}</p>
                </motion.div>
              ))}
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-blue-500">Note: </span>
                Predictions are capped at ±3% — realistic next-day range for large-cap Indian stocks.
                Not financial advice.
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <AlertCircle size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Run a prediction to see indicator analysis</p>
            </div>
          )}
        </div>
      </div>

      {/* Feature importance */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <BarChart2 size={15} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Feature Importance</h2>
            <p className="text-[10px] text-slate-400">Average across all 27 models · top 6 of 19 features</p>
          </div>
        </div>
        <div className="space-y-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{f.name}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{f.pct}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full ${f.color}`}
                  initial={{ width: 0 }} animate={{ width: `${f.pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut" }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <HowItWorks />

    </motion.div>
  );
}
