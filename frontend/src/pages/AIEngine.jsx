import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain, Search, Cpu, BookOpen, Layers, Target,
  TrendingUp, TrendingDown, Minus, ChevronDown,
  ArrowRight, ArrowDown, CheckCircle, Circle,
  Zap, Database, GitBranch, BarChart2, Shield,
} from "lucide-react";
import { getPrediction, getStockQuote } from "../api/api";
import { SYMBOL_MAP, ALL_SYMBOLS, getDisplayName } from "../utils/symbols";

// ── constants ─────────────────────────────────────────────────────────────────
const FADE_UP  = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const STAGGER  = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

function SectionBadge({ label }) {
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest
      bg-blue-500/15 text-blue-400 border border-blue-500/25 mb-2">
      {label}
    </span>
  );
}

function GlassCard({ children, className = "", glow }) {
  return (
    <motion.div
      variants={FADE_UP}
      whileHover={{ scale: 1.015, y: -3 }}
      className={`card relative overflow-hidden ${className}`}
      style={glow ? { boxShadow: glow } : {}}
    >
      {children}
    </motion.div>
  );
}

function CardTitle({ icon: Icon, color = "text-blue-400", title, unit }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/10`}>
          <Icon size={17} className={color} />
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{title}</p>
          {unit && <p className="text-[10px] text-slate-400 mt-0.5">{unit}</p>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = "text-slate-300" }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100/40 dark:border-slate-700/30 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className={`text-xs font-semibold text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

// ── Unit I: Intelligent Agent ─────────────────────────────────────────────────
function AgentPanel({ signal, quote, prediction }) {
  const actions = { BUY: "Buy Stock", SELL: "Sell Stock", HOLD: "Hold Position" };
  const actionColor = { BUY: "text-emerald-400", SELL: "text-red-400", HOLD: "text-amber-400" };
  const percepts = quote
    ? [`Price: ₹${quote.current_price?.toLocaleString("en-IN")}`,
       `Volume: ${((quote.volume || 0) / 1e6).toFixed(2)}M`,
       `Trend: ${quote.change_pct >= 0 ? "↑ Upward" : "↓ Downward"}`]
    : ["Price: Loading…", "Volume: Loading…", "Trend: Loading…"];

  return (
    <GlassCard glow="0 0 32px rgba(59,130,246,0.15)">
      <SectionBadge label="Unit I — Intelligent Agents" />
      <CardTitle icon={Cpu} title="Intelligent Agent Model" unit="PEAS Framework" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {[
          { label: "Agent Type",    value: "Goal-Based Agent" },
          { label: "Environment",   value: "Stock Market (Dynamic, Stochastic, Partially Observable)" },
          { label: "Goal",          value: "Maximize Profit / Minimize Loss" },
          { label: "Performance",   value: prediction ? `Confidence: ${prediction.confidence}%` : "Evaluating…" },
        ].map(r => (
          <div key={r.label} className="bg-slate-50/60 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100/60 dark:border-slate-700/30">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{r.label}</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50/60 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100/60 dark:border-slate-700/30">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Percepts (Sensors)</p>
          {percepts.map(p => (
            <div key={p} className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-xs text-slate-700 dark:text-slate-300">{p}</span>
            </div>
          ))}
        </div>
        <div className="bg-slate-50/60 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100/60 dark:border-slate-700/30">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Actions (Actuators)</p>
          {["Buy", "Sell", "Hold"].map((a, i) => (
            <div key={a} className="flex items-center gap-1.5 mb-1">
              <div className={`w-1.5 h-1.5 rounded-full ${i===0?"bg-emerald-400":i===1?"bg-red-400":"bg-amber-400"}`} />
              <span className="text-xs text-slate-700 dark:text-slate-300">{a}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/30">
            <p className="text-[10px] text-slate-400 mb-1">Current Decision</p>
            <span className={`text-sm font-black ${actionColor[signal] || "text-amber-400"}`}>
              {actions[signal] || "Evaluating…"}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
        This system behaves as an intelligent agent by continuously observing market data (percepts) and making rational decisions (actions) to achieve its goal of maximizing returns.
      </p>
    </GlassCard>
  );
}

// ── Unit II: Uninformed Search ────────────────────────────────────────────────
function SearchPanel() {
  const strategies = [
    {
      name: "BFS (Breadth-First Search)",
      color: "border-red-500/30 bg-red-500/5",
      badge: "bg-red-500/15 text-red-400",
      badgeText: "Not Used",
      points: ["Explores all nodes level by level", "Guarantees shortest path", "High memory cost O(b^d)", "Impractical for large stock state spaces"],
    },
    {
      name: "DFS (Depth-First Search)",
      color: "border-amber-500/30 bg-amber-500/5",
      badge: "bg-amber-500/15 text-amber-400",
      badgeText: "Not Used",
      points: ["Deep exploration of one path", "Low memory cost O(bd)", "Risk of missing optimal solution", "Can get stuck in infinite loops"],
    },
    {
      name: "Heuristic Search (A* / Hill Climbing)",
      color: "border-emerald-500/30 bg-emerald-500/5",
      badge: "bg-emerald-500/15 text-emerald-400",
      badgeText: "System Uses This",
      points: ["Guided by domain knowledge", "Evaluates promising states first", "Uses f(n) = g(n) + h(n)", "Efficient for stock prediction space"],
    },
  ];

  return (
    <GlassCard>
      <SectionBadge label="Unit II — Problem Solving & Search" />
      <CardTitle icon={Search} title="Search Strategy Comparison" unit="Uninformed vs Informed" />
      <div className="space-y-3">
        {strategies.map(s => (
          <div key={s.name} className={`rounded-xl p-3.5 border ${s.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.name}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{s.badgeText}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {s.points.map(p => (
                <div key={p} className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ── Unit III: Heuristic / Informed Search ─────────────────────────────────────
function HeuristicPanel({ prediction, quote }) {
  const current   = quote?.current_price ?? prediction?.current_price ?? 0;
  const predicted = prediction?.predicted_price ?? 0;
  const hn        = predicted - current;
  const gn        = prediction?.confidence ?? 0;
  const fn        = gn + Math.abs(hn / (current || 1)) * 100;

  return (
    <GlassCard>
      <SectionBadge label="Unit III — Informed Search & Heuristics" />
      <CardTitle icon={Brain} title="Heuristic Prediction Model" unit="A* / Hill Climbing" />

      <div className="bg-slate-900/60 rounded-xl p-4 font-mono text-xs mb-4 border border-slate-700/40">
        <p className="text-slate-400 mb-2">{"// Heuristic Function"}</p>
        <p className="text-blue-300">h(n) = predicted_price − current_price</p>
        <p className="text-slate-400 mt-2">{"// Cost so far (confidence)"}</p>
        <p className="text-emerald-300">g(n) = model_confidence</p>
        <p className="text-slate-400 mt-2">{"// Total evaluation"}</p>
        <p className="text-amber-300">f(n) = g(n) + h(n)</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "h(n) — Heuristic", value: `₹${hn.toFixed(2)}`, color: hn >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "g(n) — Cost",      value: `${gn}%`,             color: "text-blue-400" },
          { label: "f(n) — Total",     value: fn.toFixed(1),        color: "text-amber-400" },
        ].map(v => (
          <div key={v.label} className="bg-slate-50/60 dark:bg-slate-800/50 rounded-xl p-3 text-center border border-slate-100/60 dark:border-slate-700/30">
            <p className={`text-lg font-black font-mono ${v.color}`}>{prediction ? v.value : "—"}</p>
            <p className="text-[10px] text-slate-400 mt-1">{v.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
        The system uses heuristic estimation similar to A* search and Hill Climbing to navigate the stock price prediction space, always moving toward states with higher expected returns.
      </p>
    </GlassCard>
  );
}

// ── Unit III: Minimax / Adversarial ──────────────────────────────────────────
function MinimaxPanel({ signal, prediction }) {
  const threshold = 1.5;
  const changePct = prediction?.change_percent ?? 0;
  const steps = [
    { label: "AI Agent (MAX)", desc: "Tries to maximize predicted gain", active: true },
    { label: "Market (MIN)",   desc: "Acts as adversary — introduces volatility", active: true },
    { label: "Evaluation",     desc: `Change: ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}% | Threshold: ±${threshold}%`, active: !!prediction },
    { label: "Decision",       desc: signal ? `→ ${signal}` : "Evaluating…", active: !!signal },
  ];

  return (
    <GlassCard>
      <SectionBadge label="Unit III — Adversarial Search" />
      <CardTitle icon={GitBranch} title="Market as Adversarial Game" unit="Minimax Strategy" color="text-purple-400" />

      <div className="space-y-2 mb-4">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5
              ${s.active ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"}`}>
              {i + 1}
            </div>
            <div className="flex-1 bg-slate-50/60 dark:bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-100/60 dark:border-slate-700/30">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{s.label}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 rounded-xl p-3.5 font-mono text-xs border border-slate-700/40 mb-3">
        <p className="text-slate-400 mb-1">{"// Minimax-inspired decision logic"}</p>
        <p className="text-emerald-300">IF predicted_gain &gt; {threshold}%  → BUY</p>
        <p className="text-red-300">ELSE IF predicted_loss &gt; {threshold}% → SELL</p>
        <p className="text-amber-300">ELSE                              → HOLD</p>
        <p className="text-blue-300 mt-2">Current: <span className={signal === "BUY" ? "text-emerald-400" : signal === "SELL" ? "text-red-400" : "text-amber-400"}>{signal || "…"}</span></p>
      </div>
      <p className="text-[10px] text-slate-400 italic">Alpha-Beta pruning eliminates unpromising market branches to reduce computation.</p>
    </GlassCard>
  );
}

// ── Unit IV: Logical Agent / Rule System ─────────────────────────────────────
function LogicPanel({ signal, prediction, quote }) {
  const trend      = quote ? (quote.change_pct >= 0 ? "UP" : "DOWN") : null;
  const confidence = prediction?.confidence ?? 0;
  const rules = [
    {
      id: 1,
      condition: "trend = UP ∧ confidence > 70",
      conclusion: "BUY",
      active: trend === "UP" && confidence > 70,
      color: "emerald",
    },
    {
      id: 2,
      condition: "trend = DOWN ∧ confidence > 70",
      conclusion: "SELL",
      active: trend === "DOWN" && confidence > 70,
      color: "red",
    },
    {
      id: 3,
      condition: "confidence ≤ 70 ∨ trend = NEUTRAL",
      conclusion: "HOLD",
      active: confidence <= 70,
      color: "amber",
    },
  ];

  const firedRule = rules.find(r => r.active);

  return (
    <GlassCard>
      <SectionBadge label="Unit IV — Knowledge & Reasoning" />
      <CardTitle icon={BookOpen} title="Rule-Based Decision System" unit="Propositional Logic" color="text-emerald-400" />

      <div className="space-y-2.5 mb-4">
        {rules.map(r => (
          <div key={r.id}
            className={`rounded-xl p-3 border transition-all duration-300
              ${r.active
                ? `border-${r.color}-500/40 bg-${r.color}-500/10 shadow-lg shadow-${r.color}-500/10`
                : "border-slate-200/50 dark:border-slate-700/30 bg-slate-50/40 dark:bg-slate-800/30 opacity-50"}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Rule {r.id}</span>
              {r.active && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${r.color}-500/20 text-${r.color}-400`}>
                  ✓ FIRED
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
              IF <span className="text-blue-400">{r.condition}</span>
            </p>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
              THEN <span className={`font-bold text-${r.color}-400`}>{r.conclusion}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50/60 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100/60 dark:border-slate-700/30">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Live Fact Base</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">{trend ?? "—"}</p>
            <p className="text-[10px] text-slate-400">trend</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">{confidence ? `${confidence}%` : "—"}</p>
            <p className="text-[10px] text-slate-400">confidence</p>
          </div>
          <div>
            <p className={`text-xs font-bold ${signal === "BUY" ? "text-emerald-400" : signal === "SELL" ? "text-red-400" : "text-amber-400"}`}>
              {signal ?? "—"}
            </p>
            <p className="text-[10px] text-slate-400">decision</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Unit IV: Forward & Backward Chaining ─────────────────────────────────────
function ChainingPanel({ signal, prediction, quote }) {
  const trend      = quote ? (quote.change_pct >= 0 ? "UP" : "DOWN") : "?";
  const confidence = prediction?.confidence ?? 0;
  const confLabel  = confidence > 70 ? "HIGH" : "LOW";

  const forwardSteps = [
    { label: "Observe",  value: `Price: ₹${quote?.current_price?.toLocaleString("en-IN") ?? "…"}`, done: !!quote },
    { label: "Compute",  value: `Trend = ${trend}`,                                                  done: !!quote },
    { label: "Evaluate", value: `Confidence = ${confLabel} (${confidence}%)`,                        done: !!prediction },
    { label: "Conclude", value: `Decision → ${signal ?? "…"}`,                                       done: !!signal },
  ];

  const backwardSteps = [
    { label: "Goal",      value: `Achieve: ${signal ?? "BUY"}`,                                      done: !!signal },
    { label: "Check",     value: `Is confidence > 70? → ${confidence > 70 ? "YES" : "NO"}`,          done: !!prediction },
    { label: "Check",     value: `Is trend ${signal === "SELL" ? "DOWN" : "UP"}? → ${trend === (signal === "SELL" ? "DOWN" : "UP") ? "YES" : "NO"}`, done: !!quote },
    { label: "Satisfied", value: "All conditions verified",                                           done: !!signal && !!quote },
  ];

  return (
    <GlassCard>
      <SectionBadge label="Unit IV — Inference Mechanisms" />
      <CardTitle icon={Zap} title="Forward & Backward Chaining" unit="Inference Engine" color="text-amber-400" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1.5">
            <ArrowRight size={12} /> Forward Chaining (Data → Decision)
          </p>
          <div className="space-y-1.5">
            {forwardSteps.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                {s.done
                  ? <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  : <Circle size={13} className="text-slate-500 shrink-0 mt-0.5" />}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{s.label}: </span>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1.5">
            <ArrowDown size={12} /> Backward Chaining (Goal → Conditions)
          </p>
          <div className="space-y-1.5">
            {backwardSteps.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                {s.done
                  ? <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  : <Circle size={13} className="text-slate-500 shrink-0 mt-0.5" />}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{s.label}: </span>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Unit V: Expert System ─────────────────────────────────────────────────────
function ExpertSystemPanel({ prediction, signal }) {
  return (
    <GlassCard>
      <SectionBadge label="Unit V — Expert Systems" />
      <CardTitle icon={Shield} title="Expert System Model" unit="Knowledge Base + Inference Engine" color="text-cyan-400" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {[
          {
            title: "Knowledge Base",
            icon: Database,
            color: "text-blue-400",
            items: ["14 years historical data (2010–2023)", "16 technical indicators", "MA5, MA10, MA20, RSI, MACD", "Bollinger Bands, Volume trends"],
          },
          {
            title: "Inference Engine",
            icon: Cpu,
            color: "text-purple-400",
            items: ["Random Forest algorithm", "100 decision trees", "Feature importance ranking", "Ensemble prediction"],
          },
          {
            title: "Rule Base",
            icon: BookOpen,
            color: "text-emerald-400",
            items: ["Buy/Sell/Hold logic", "Confidence thresholds", "Trend direction rules", "Risk management rules"],
          },
        ].map(s => (
          <div key={s.title} className="bg-slate-50/60 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100/60 dark:border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={13} className={s.color} />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.title}</p>
            </div>
            {s.items.map(item => (
              <div key={item} className="flex items-start gap-1.5 mb-1">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Prolog-style logic */}
      <div className="bg-slate-900/70 rounded-xl p-4 font-mono text-xs border border-slate-700/40 mb-3">
        <p className="text-slate-500 mb-2">{"% Prolog-style knowledge representation"}</p>
        <p className="text-emerald-300">buy  :- trend(up),   confidence(high).</p>
        <p className="text-red-300">sell :- trend(down), confidence(high).</p>
        <p className="text-amber-300">hold :- confidence(low).</p>
        <p className="text-amber-300">hold :- trend(neutral).</p>
        <p className="text-slate-500 mt-2">{"% Current query result:"}</p>
        <p className="text-blue-300">?- decision(X).  X = <span className={signal === "BUY" ? "text-emerald-400" : signal === "SELL" ? "text-red-400" : "text-amber-400"}>{signal?.toLowerCase() ?? "hold"}</span>.</p>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
        This system mimics an expert trader by encoding domain knowledge as rules and using an inference engine to derive decisions — exactly like a medical or financial expert system.
      </p>
    </GlassCard>
  );
}

// ── Unit VI: Planning System ──────────────────────────────────────────────────
function PlanningPanel({ prediction, quote, signal }) {
  const current   = quote?.current_price ?? 0;
  const predicted = prediction?.predicted_price ?? 0;
  const gain      = predicted - current;
  const gainPct   = current ? ((gain / current) * 100).toFixed(2) : "0.00";

  const plan = [
    {
      step: 1, action: "OBSERVE",
      desc: `Monitor market: ₹${current.toLocaleString("en-IN")} current price`,
      done: !!quote, color: "blue",
    },
    {
      step: 2, action: signal === "BUY" ? "BUY" : signal === "SELL" ? "SKIP" : "WAIT",
      desc: signal === "BUY" ? "Execute buy order at current price" : signal === "SELL" ? "Skip — market unfavorable" : "Wait for favorable conditions",
      done: !!signal, color: signal === "BUY" ? "emerald" : signal === "SELL" ? "red" : "amber",
    },
    {
      step: 3, action: "HOLD",
      desc: `Hold position — monitor for predicted target ₹${predicted.toLocaleString("en-IN")}`,
      done: !!prediction, color: "purple",
    },
    {
      step: 4, action: "SELL",
      desc: `Sell at predicted price — expected gain: ${gainPct >= 0 ? "+" : ""}${gainPct}%`,
      done: !!prediction, color: gain >= 0 ? "emerald" : "red",
    },
  ];

  const stack = ["SELL", "HOLD", signal === "BUY" ? "BUY" : "WAIT", "OBSERVE"];

  return (
    <GlassCard>
      <SectionBadge label="Unit VI — Planning" />
      <CardTitle icon={Layers} title="Investment Planning System" unit="Goal Stack Planning" color="text-pink-400" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Plan steps */}
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Execution Plan</p>
          <div className="space-y-2">
            {plan.map((p, i) => (
              <div key={p.step} className="flex items-start gap-2.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5
                  ${p.done ? `bg-${p.color}-500 text-white` : "bg-slate-200 dark:bg-slate-700 text-slate-400"}`}>
                  {p.step}
                </div>
                <div className="flex-1">
                  <span className={`text-[10px] font-black uppercase text-${p.color}-400`}>{p.action}</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goal stack */}
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Goal Stack</p>
          <div className="space-y-1.5">
            {stack.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold
                  ${i === 0
                    ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                    : "bg-slate-50/60 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/30 text-slate-500 dark:text-slate-400"}`}
              >
                <span>{item}</span>
                {i === 0 && <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded-full">TOP</span>}
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 italic">Goal Stack Planning — top goal executed first, then popped to reveal next sub-goal.</p>
        </div>
      </div>

      <div className="bg-slate-50/60 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100/60 dark:border-slate-700/30">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Plan Summary</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              ₹{current.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-400">Entry Price</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              ₹{predicted.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-400">Target Price</p>
          </div>
          <div>
            <p className={`text-xs font-bold ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {gain >= 0 ? "+" : ""}{gainPct}%
            </p>
            <p className="text-[10px] text-slate-400">Expected Return</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function getSignal(predicted, current, confidence) {
  if (predicted > current && confidence > 60) return "BUY";
  if (predicted < current && confidence > 60) return "SELL";
  return "HOLD";
}

export default function AIEngine() {
  const [symbol,     setSymbol]     = useState("RELIANCE.NS");
  const [quote,      setQuote]      = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading,    setLoading]    = useState(true);

  const fetchData = useCallback(async (sym) => {
    setLoading(true);
    setQuote(null);
    setPrediction(null);
    try {
      const [q, p] = await Promise.allSettled([getStockQuote(sym), getPrediction(sym)]);
      if (q.status === "fulfilled") setQuote(q.value);
      if (p.status === "fulfilled") setPrediction(p.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(symbol); }, [symbol, fetchData]);

  const signal = prediction
    ? getSignal(prediction.predicted_price, prediction.current_price, prediction.confidence)
    : null;

  const unitCards = [
    { id: "unit1", label: "Unit I",   title: "Intelligent Agent",       color: "bg-blue-500"   },
    { id: "unit2", label: "Unit II",  title: "Uninformed Search",        color: "bg-red-500"    },
    { id: "unit3a",label: "Unit III", title: "Heuristic Search",         color: "bg-emerald-500"},
    { id: "unit3b",label: "Unit III", title: "Adversarial / Minimax",    color: "bg-purple-500" },
    { id: "unit4a",label: "Unit IV",  title: "Rule-Based Logic",         color: "bg-amber-500"  },
    { id: "unit4b",label: "Unit IV",  title: "Forward/Backward Chain",   color: "bg-orange-500" },
    { id: "unit5", label: "Unit V",   title: "Expert System",            color: "bg-cyan-500"   },
    { id: "unit6", label: "Unit VI",  title: "Planning System",          color: "bg-pink-500"   },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Brain size={24} className="text-blue-500" /> AI Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Complete AI system — Agents · Search · Logic · Expert Systems · Planning
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Fetching live data…
            </div>
          )}
          <div className="relative">
            <select
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              className="input-base appearance-none pl-4 pr-10 py-2 w-auto cursor-pointer text-sm"
            >
              {ALL_SYMBOLS.map(s => (
                <option key={s} value={s}>{SYMBOL_MAP[s].display} ({s})</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Unit overview pills ── */}
      <div className="flex flex-wrap gap-2">
        {unitCards.map(u => (
          <div key={u.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
            bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700/60
            backdrop-blur-sm text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className={`w-2 h-2 rounded-full ${u.color}`} />
            <span className="font-bold text-slate-500 dark:text-slate-500">{u.label}</span>
            <span>{u.title}</span>
          </div>
        ))}
      </div>

      {/* ── Live data bar ── */}
      {(quote || prediction) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card p-4 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{SYMBOL_MAP[symbol]?.display}</p>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ₹{(quote?.current_price ?? prediction?.current_price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          {quote && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold
              ${quote.change_pct >= 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
              {quote.change_pct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {quote.change_pct >= 0 ? "+" : ""}{quote.change_pct?.toFixed(2)}% today
            </div>
          )}
          {prediction && (
            <div className="flex items-center gap-4 text-xs text-slate-400 ml-auto flex-wrap">
              <span>Predicted: <span className="font-bold text-blue-400">₹{prediction.predicted_price?.toLocaleString("en-IN")}</span></span>
              <span>Confidence: <span className="font-bold text-slate-300">{prediction.confidence}%</span></span>
              <span className={`font-black text-sm px-3 py-1 rounded-xl border
                ${signal === "BUY"  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
                  signal === "SELL" ? "bg-red-500/15 border-red-500/30 text-red-400" :
                  "bg-amber-500/15 border-amber-500/30 text-amber-400"}`}>
                {signal}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* ── All AI panels ── */}
      <motion.div variants={STAGGER} initial="hidden" animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AgentPanel      signal={signal} quote={quote} prediction={prediction} />
        <SearchPanel />
        <HeuristicPanel  prediction={prediction} quote={quote} />
        <MinimaxPanel    signal={signal} prediction={prediction} />
        <LogicPanel      signal={signal} prediction={prediction} quote={quote} />
        <ChainingPanel   signal={signal} prediction={prediction} quote={quote} />
        <ExpertSystemPanel prediction={prediction} signal={signal} />
        <PlanningPanel   prediction={prediction} quote={quote} signal={signal} />
      </motion.div>

    </motion.div>
  );
}
