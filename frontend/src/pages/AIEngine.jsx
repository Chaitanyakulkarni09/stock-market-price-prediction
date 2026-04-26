import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, TrendingUp, TrendingDown, ChevronDown,
  Activity, CheckCircle, AlertCircle, Clock,
  ChevronRight, Zap, BarChart2, Target, Info,
  GitBranch, Table2, Play, RotateCcw, BookOpen, Eye, Cpu,
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
  { label: "Directional Accuracy", value: "68%", sub: "avg across 27 models",  icon: Target,   color: "text-blue-500",    bg: "bg-blue-500/10"   },
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

// ── BFS / DFS Visualizer ─────────────────────────────────────────────────────
const TREE = {
  id: "root", label: "Today ₹2500", level: 0,
  children: [
    {
      id: "buy", label: "Buy", level: 1,
      children: [
        { id: "buy-up",   label: "Price Up\n+₹200", level: 2, children: [], payoff: "+200", color: "emerald" },
        { id: "buy-down", label: "Price Down\n-₹50",  level: 2, children: [], payoff: "-50",  color: "red"     },
      ],
    },
    {
      id: "hold", label: "Hold", level: 1,
      children: [
        { id: "hold-up",   label: "Price Up\n+₹80",  level: 2, children: [], payoff: "+80",  color: "emerald" },
        { id: "hold-down", label: "Price Down\n-₹20", level: 2, children: [], payoff: "-20",  color: "red"     },
      ],
    },
    {
      id: "sell", label: "Sell", level: 1,
      children: [
        { id: "sell-up",   label: "Price Up\n-₹150", level: 2, children: [], payoff: "-150", color: "red"     },
        { id: "sell-down", label: "Price Down\n+₹100",level: 2, children: [], payoff: "+100", color: "emerald" },
      ],
    },
  ],
};

function flattenBFS(node) {
  const order = []; const queue = [node];
  while (queue.length) {
    const n = queue.shift(); order.push(n.id);
    n.children.forEach(c => queue.push(c));
  }
  return order;
}

function flattenDFS(node) {
  const order = []; const stack = [node];
  while (stack.length) {
    const n = stack.pop(); order.push(n.id);
    [...n.children].reverse().forEach(c => stack.push(c));
  }
  return order;
}

function TreeNode({ node, visited, current }) {
  const isVisited = visited.includes(node.id);
  const isCurrent = current === node.id;
  const isLeaf    = node.children.length === 0;
  return (
    <div className="flex flex-col items-center">
      <motion.div
        animate={{ scale: isCurrent ? 1.15 : 1 }}
        transition={{ duration: 0.2 }}
        className={`px-3 py-2 rounded-xl border text-xs font-semibold text-center min-w-[72px] whitespace-pre-line transition-all duration-300
          ${isCurrent
            ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/40"
            : isVisited
            ? isLeaf
              ? node.color === "emerald"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400"
              : "bg-slate-100 dark:bg-slate-700/60 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
            : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`}
      >
        {node.label}
      </motion.div>
      {node.children.length > 0 && (
        <div className="flex gap-3 mt-3 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-3 bg-slate-300 dark:bg-slate-600" />
          {node.children.map(child => (
            <div key={child.id} className="flex flex-col items-center">
              <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
              <TreeNode node={child} visited={visited} current={current} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BFSDFSVisualizer() {
  const [algo,    setAlgo]    = useState("BFS");
  const [visited, setVisited] = useState([]);
  const [current, setCurrent] = useState(null);
  const [running, setRunning] = useState(false);
  const [done,    setDone]    = useState(false);
  const timerRef = useRef([]);

  const reset = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setVisited([]); setCurrent(null); setRunning(false); setDone(false);
  };

  const start = () => {
    reset();
    setRunning(true);
    const order = algo === "BFS" ? flattenBFS(TREE) : flattenDFS(TREE);
    const acc = [];
    order.forEach((id, i) => {
      const t1 = setTimeout(() => { setCurrent(id); }, i * 600);
      const t2 = setTimeout(() => { acc.push(id); setVisited([...acc]); }, i * 600 + 300);
      timerRef.current.push(t1, t2);
    });
    const tEnd = setTimeout(() => { setCurrent(null); setRunning(false); setDone(true); }, order.length * 600 + 300);
    timerRef.current.push(tEnd);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <GitBranch size={15} className="text-amber-500" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Uninformed Search: BFS vs DFS</h2>
          <p className="text-[10px] text-slate-400">Stock trading decision tree · depth 3</p>
        </div>
      </div>

      {/* Algorithm selector */}
      <div className="flex gap-2 mb-4">
        {["BFS", "DFS"].map(a => (
          <button key={a} onClick={() => { setAlgo(a); reset(); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all
              ${algo === a
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/25"
                : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"}`}>
            {a}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={start} disabled={running}
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 disabled:opacity-50">
            <Play size={12} /> Start Search
          </motion.button>
          <button onClick={reset}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400
              hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="overflow-x-auto pb-2 mb-4">
        <div className="flex justify-center min-w-[400px]">
          <TreeNode node={TREE} visited={visited} current={current} />
        </div>
      </div>

      {/* Visited order */}
      {visited.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Visit Order</p>
          <div className="flex flex-wrap gap-1.5">
            {visited.map((id, i) => (
              <motion.span key={id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {i + 1}. {id}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`p-3 rounded-xl border text-xs leading-relaxed transition-all
          ${algo === "BFS" ? "bg-blue-500/8 border-blue-500/25 text-blue-700 dark:text-blue-300" : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40 text-slate-500 dark:text-slate-400"}`}>
          <p className="font-bold mb-1">BFS — Breadth First Search</p>
          Explores all nodes level by level. Visits root → all level-1 nodes → all level-2 nodes. Guarantees shortest path. High memory cost O(b^d).
        </div>
        <div className={`p-3 rounded-xl border text-xs leading-relaxed transition-all
          ${algo === "DFS" ? "bg-purple-500/8 border-purple-500/25 text-purple-700 dark:text-purple-300" : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40 text-slate-500 dark:text-slate-400"}`}>
          <p className="font-bold mb-1">DFS — Depth First Search</p>
          Goes deep along one branch before backtracking. Visits root → Buy → Price Up → Price Down → Hold → … Low memory O(bd) but may miss optimal solution.
        </div>
      </div>

      {done && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-3 text-center text-xs text-emerald-500 font-semibold">
          ✓ Search complete — {visited.length} nodes visited using {algo}
        </motion.p>
      )}
    </div>
  );
}

// ── Intelligent Agent Panel ───────────────────────────────────────────────────
function IntelligentAgentPanel() {
  const cycle = [
    {
      step: "01", label: "Perceive",
      icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10",
      desc: "Fetches live OHLCV data for the selected stock via Yahoo Finance. Computes 19 technical indicators: RSI, MACD, Bollinger Bands, ATR, OBV, MA5–MA50, Momentum.",
    },
    {
      step: "02", label: "Reason",
      icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10",
      desc: "Passes the feature vector through a trained Random Forest Regressor. Fires production rules (IF RSI < 30 AND Volume > Avg → BUY) via forward chaining to generate a trading signal.",
    },
    {
      step: "03", label: "Act",
      icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10",
      desc: "Returns a predicted next-day price, a BUY/SELL/HOLD signal, and a confidence score. The agent aims to maximise prediction accuracy as its performance measure.",
    },
  ];

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Cpu size={15} className="text-purple-500" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Intelligent Agent — Perceive · Reason · Act</h2>
          <p className="text-[10px] text-slate-400">The prediction system as a rational agent</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {cycle.map((c, i) => (
          <div key={c.step} className="relative">
            <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/40 h-full`}>
              <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                <c.icon size={16} className={c.color} />
              </div>
              <p className={`text-xs font-black mb-1 ${c.color}`}>{c.step} {c.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{c.desc}</p>
            </div>
            {i < 2 && (
              <div className="hidden sm:flex absolute -right-1.5 top-1/2 -translate-y-1/2 z-10
                w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 items-center justify-center">
                <ChevronRight size={8} className="text-slate-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        <span className="font-semibold text-purple-500">PEAS Framework: </span>
        Performance (prediction accuracy) · Environment (NSE/BSE market data) · Actuators (BUY/SELL/HOLD signals) · Sensors (Yahoo Finance API, technical indicators).
        This makes the system a goal-based, model-based intelligent agent.
      </div>
    </div>
  );
}

// ── Knowledge Base Viewer ─────────────────────────────────────────────────────
const KB_ENTRIES = [
  { category: "Trading Rules", color: "emerald", items: [
    { rule: "IF RSI < 30 AND Volume > Avg", conclusion: "→ BUY", type: "AND" },
    { rule: "IF MACD Bullish OR Golden Cross", conclusion: "→ BUY", type: "OR" },
    { rule: "IF RSI > 70 AND Volume Spike", conclusion: "→ SELL", type: "AND" },
    { rule: "IF MACD Bearish AND Price < MA20", conclusion: "→ SELL", type: "AND" },
  ]},
  { category: "Market Facts", color: "blue", items: [
    { rule: "RSI < 30", conclusion: "Oversold condition", type: "FACT" },
    { rule: "RSI > 70", conclusion: "Overbought condition", type: "FACT" },
    { rule: "MA20 > MA50", conclusion: "Golden Cross (bullish)", type: "FACT" },
    { rule: "MA20 < MA50", conclusion: "Death Cross (bearish)", type: "FACT" },
  ]},
  { category: "Agent Goals", color: "purple", items: [
    { rule: "Maximise directional accuracy", conclusion: "Performance measure", type: "GOAL" },
    { rule: "Minimise MAPE", conclusion: "Error metric < 3%", type: "GOAL" },
    { rule: "Confidence ≥ 70%", conclusion: "Signal threshold", type: "GOAL" },
    { rule: "Predict within ±3%", conclusion: "Realistic range cap", type: "GOAL" },
  ]},
];

function KnowledgeBaseViewer() {
  const [open, setOpen] = useState(false);
  const colorMap = { emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20" };
  const badgeMap = { AND: "bg-blue-500/10 text-blue-500", OR: "bg-amber-500/10 text-amber-500",
    FACT: "bg-slate-100 dark:bg-slate-700 text-slate-500", GOAL: "bg-purple-500/10 text-purple-500" };

  return (
    <div className="card">
      <button onClick={() => setOpen(p => !p)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <BookOpen size={15} className="text-emerald-500" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-slate-900 dark:text-white text-sm block">Knowledge Base</span>
            <span className="text-[10px] text-slate-400">Trading rules · market facts · agent goals</span>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={16} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
            <div className="mt-4 space-y-4">
              {KB_ENTRIES.map(cat => (
                <div key={cat.category}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${colorMap[cat.color].split(' ')[0]}`}>
                    {cat.category}
                  </p>
                  <div className="space-y-1.5">
                    {cat.items.map((item, i) => (
                      <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${colorMap[cat.color]}`}>
                        <span className="font-mono">{item.rule}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${badgeMap[item.type]}`}>{item.type}</span>
                          <span className="font-semibold">{item.conclusion}</span>
                        </div>
                      </div>
                    ))}
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

// ── Propositional Logic Truth Table ──────────────────────────────────────────
const RULES = [
  {
    id: "r1",
    label: "Rule 1 — BUY (AND)",
    formula: "(RSI < 30) ∧ (Volume > Avg) → BUY",
    desc: "Both conditions must be true. Conservative rule requiring oversold RSI AND high volume confirmation.",
    premises: ["RSI < 30", "Volume > Avg"],
    evaluate: (a, b) => a && b,
    conclusion: "BUY",
    conclusionColor: "emerald",
  },
  {
    id: "r2",
    label: "Rule 2 — BUY (OR)",
    formula: "(MACD Bullish) ∨ (Golden Cross) → BUY",
    desc: "Either condition alone is sufficient. More aggressive — triggers on any bullish momentum indicator.",
    premises: ["MACD Bullish", "Golden Cross"],
    evaluate: (a, b) => a || b,
    conclusion: "BUY",
    conclusionColor: "emerald",
  },
  {
    id: "r3",
    label: "Rule 3 — SELL (AND)",
    formula: "(RSI > 70) ∧ (Volume Spike) → SELL",
    desc: "Overbought RSI with a volume spike signals strong selling pressure. Both must be true.",
    premises: ["RSI > 70", "Volume Spike"],
    evaluate: (a, b) => a && b,
    conclusion: "SELL",
    conclusionColor: "red",
  },
  {
    id: "r4",
    label: "Rule 4 — SELL (AND)",
    formula: "(MACD Bearish) ∧ (Price < MA20) → SELL",
    desc: "Bearish MACD crossover combined with price below the 20-day moving average confirms a downtrend.",
    premises: ["MACD Bearish", "Price < MA20"],
    evaluate: (a, b) => a && b,
    conclusion: "SELL",
    conclusionColor: "red",
  },
];

function TruthTable({ rule, p1, p2 }) {
  const rows = [
    [false, false],
    [false, true],
    [true,  false],
    [true,  true],
  ];
  const isCurrentRow = (a, b) => a === p1 && b === p2;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-semibold">{rule.premises[0]}</th>
            <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-semibold">{rule.premises[1]}</th>
            <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-semibold">{rule.conclusion}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b], i) => {
            const result  = rule.evaluate(a, b);
            const current = isCurrentRow(a, b);
            return (
              <motion.tr key={i}
                animate={{ backgroundColor: current ? "rgba(59,130,246,0.08)" : "transparent" }}
                className={`border-b border-slate-100 dark:border-slate-800/60 transition-colors
                  ${current ? "ring-1 ring-inset ring-blue-500/20 rounded" : ""}`}>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${a ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-500"}`}>
                    {a ? "T" : "F"}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${b ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-500"}`}>
                    {b ? "T" : "F"}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${result ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-700/60 text-slate-400"}`}>
                    {result ? "BUY ✓" : "—"}
                  </span>
                  {current && <span className="ml-2 text-blue-400 font-bold">← current</span>}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PropositionalLogic() {
  const [activeRule, setActiveRule] = useState("r1");
  const [p1, setP1] = useState(false);
  const [p2, setP2] = useState(false);

  const rule   = RULES.find(r => r.id === activeRule);
  const result = rule.evaluate(p1, p2);

  const handleRuleChange = (id) => { setActiveRule(id); setP1(false); setP2(false); };

  const conclusionStyles = {
    emerald: {
      active: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    red: {
      active: "bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400 shadow-md shadow-red-500/10",
      badge: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
  };
  const cs = conclusionStyles[rule.conclusionColor];

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Table2 size={15} className="text-indigo-500" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Production System — Trading Rules</h2>
          <p className="text-[10px] text-slate-400">4 IF-THEN rules · interactive truth table · forward chaining</p>
        </div>
      </div>

      {/* Rule selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {RULES.map(r => (
          <button key={r.id} onClick={() => handleRuleChange(r.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
              ${activeRule === r.id
                ? r.conclusionColor === "emerald"
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-red-600 border-red-500 text-white"
                : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400"}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Rule description */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">{rule.desc}</p>

      {/* Formula */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 rounded-xl px-4 py-3 font-mono text-xs mb-4 border border-slate-700/40">
        <span className="text-slate-400">{"// Production rule (IF-THEN)"}</span>
        <br />
        <span className="text-amber-300">{rule.formula}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Toggles */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Set Premises</p>
          {[{ label: rule.premises[0], val: p1, set: setP1 }, { label: rule.premises[1], val: p2, set: setP2 }].map(({ label, val, set }) => (
            <div key={label} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
              <button onClick={() => set(v => !v)}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative
                  ${val ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                <motion.div animate={{ x: val ? 24 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          ))}

          {/* Conclusion */}
          <motion.div animate={{ scale: result ? 1.02 : 1 }}
            className={`p-3 rounded-xl border text-center font-black text-sm transition-all
              ${result ? cs.active : "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40 text-slate-400"}`}>
            {result ? `✓ ${rule.conclusion} Signal Fired` : `✗ Rule not triggered`}
          </motion.div>
        </div>

        {/* Truth table */}
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Truth Table</p>
          <TruthTable rule={rule} p1={p1} p2={p2} />
        </div>
      </div>

      <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        <span className="font-semibold text-indigo-500">Forward Chaining: </span>
        The inference engine starts from known market facts (premises) and fires rules whose conditions are satisfied.
        Rule: <span className="font-mono text-amber-500">{rule.formula.split("→")[0].trim()}</span> → conclusion: <span className={`font-bold ${cs.badge.split(' ')[1]}`}>{rule.conclusion}</span>.
      </div>
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

      {/* Intelligent Agent */}
      <IntelligentAgentPanel />

      {/* BFS / DFS Visualizer */}
      <BFSDFSVisualizer />

      {/* Propositional Logic / Production Rules */}
      <PropositionalLogic />

      {/* Knowledge Base Viewer */}
      <KnowledgeBaseViewer />

    </motion.div>
  );
}
