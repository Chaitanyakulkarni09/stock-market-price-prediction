import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain, TrendingUp, TrendingDown, Minus,
  DollarSign, BarChart2, ChevronDown, Zap, AlertTriangle,
} from "lucide-react";
import {
  createChart, CandlestickSeries, HistogramSeries, LineSeries, CrosshairMode,
} from "lightweight-charts";
import { getPrediction, getStockQuote, getStockHistory } from "../api/api";
import { getDisplayName } from "../utils/symbols";
import { useTheme } from "../context/ThemeContext";

// ── Static constants (defined once, never recreated) ─────────────────────────
const STOCK_SYMBOLS = ["RELIANCE.NS", "INFY.NS", "HDFCBANK.NS", "MARUTI.NS", "HINDUNILVR.NS", "^NSEI", "^BSESN"];

const GLASS = {
  background: "rgba(15,23,42,0.7)",
  backdropFilter: "blur(12px)",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
};
const LIGHT = {
  background: "rgba(255,255,255,0.95)",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
};

const SIGNAL_CONFIG = {
  BUY:  { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", glow: "0 0 28px rgba(34,197,94,0.35)",  Icon: TrendingUp,   label: "BUY"  },
  SELL: { color: "text-red-400",     bg: "bg-red-500/15",     border: "border-red-500/30",     glow: "0 0 28px rgba(239,68,68,0.35)",  Icon: TrendingDown, label: "SELL" },
  HOLD: { color: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-500/30",   glow: "0 0 28px rgba(245,158,11,0.35)", Icon: Minus,        label: "HOLD" },
};

// Defined outside component so object references never change
const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const FADE_UP = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// ── Pure helpers ──────────────────────────────────────────────────────────────
function Skel({ h = "h-8", w = "w-full" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-xl ${h} ${w}`} />;
}

function getSignal(predicted, current, confidence) {
  if (predicted > current && confidence > 60) return "BUY";
  if (predicted < current && confidence > 60) return "SELL";
  return "HOLD";
}

function addDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function buildChartTheme(isDark) {
  return {
    layout: {
      background: { color: isDark ? "#0b1220" : "#ffffff" },
      textColor:  isDark ? "#9ca3af" : "#374151",
    },
    grid: {
      vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
      horzLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
    },
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)" },
    timeScale: {
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
      timeVisible: true, secondsVisible: false,
    },
  };
}

// ── AnalyticsChart — self-contained, stable chart component ──────────────────
// Props: symbol (string), predictionPrice (number|null)
// Uses a ref for predictionPrice to avoid re-running the main chart effect
function AnalyticsChart({ symbol, predictionPrice }) {
  const containerRef    = useRef(null);
  const chartRef        = useRef(null);
  const candleRef       = useRef(null);
  const volRef          = useRef(null);
  const predRef         = useRef(null);
  const lastDateRef     = useRef(null);
  const lastCloseRef    = useRef(null);
  // Keep predictionPrice in a ref so the chart effect doesn't depend on it
  const predPriceRef    = useRef(predictionPrice);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [stats,   setStats]   = useState(null);
  const { isDark } = useTheme();

  // Sync predPriceRef without triggering chart rebuild
  useEffect(() => {
    predPriceRef.current = predictionPrice;
  });

  // Theme sync — only updates chart options, never rebuilds
  useEffect(() => {
    chartRef.current?.applyOptions(buildChartTheme(isDark));
  }, [isDark]);

  // Main chart effect — only re-runs when symbol changes
  useEffect(() => {
    if (!containerRef.current) return;

    // Tear down previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = candleRef.current = volRef.current = predRef.current = null;
    }
    setLoading(true);
    setError(null);
    setStats(null);
    lastDateRef.current  = null;
    lastCloseRef.current = null;

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth || 700,
      height: 416,
      ...buildChartTheme(isDark),
    });
    chartRef.current = chart;

    candleRef.current = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e", downColor: "#ef4444",
      borderUpColor: "#22c55e", borderDownColor: "#ef4444",
      wickUpColor: "#22c55e", wickDownColor: "#ef4444",
      priceScaleId: "right",
    });

    volRef.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" }, priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 }, borderVisible: false,
    });

    predRef.current = chart.addSeries(LineSeries, {
      color: "#60a5fa", lineWidth: 2, lineStyle: 2,
      priceScaleId: "right", lastValueVisible: true,
      priceLineVisible: false, crosshairMarkerVisible: true,
    });

    const onResize = () => {
      if (containerRef.current && chartRef.current)
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", onResize);

    let cancelled = false;

    getStockHistory(symbol, "3mo")
      .then((res) => {
        if (cancelled) return;
        const raw = res?.data || [];
        if (!raw.length) { setError("No data available"); return; }

        // Sort + deduplicate candles
        const seen = new Set();
        const candles = raw
          .map((d) => ({
            time: d.date.slice(0, 10),
            open: +d.open, high: +d.high, low: +d.low, close: +d.close,
          }))
          .sort((a, b) => (a.time > b.time ? 1 : -1))
          .filter((c) => { if (seen.has(c.time)) return false; seen.add(c.time); return true; });

        if (!candleRef.current) return;
        candleRef.current.setData(candles);

        // Volume
        const seenV = new Set();
        volRef.current.setData(
          raw
            .map((d) => ({
              time: d.date.slice(0, 10), value: +d.volume,
              color: +d.close >= +d.open ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)",
            }))
            .sort((a, b) => (a.time > b.time ? 1 : -1))
            .filter((v) => { if (seenV.has(v.time)) return false; seenV.add(v.time); return true; })
        );

        const lastCandle = candles[candles.length - 1];
        lastDateRef.current  = lastCandle.time;
        lastCloseRef.current = lastCandle.close;

        // Draw prediction line using the ref value (avoids stale closure)
        if (predRef.current && predPriceRef.current != null) {
          predRef.current.setData([
            { time: lastCandle.time,        value: lastCandle.close       },
            { time: addDay(lastCandle.time), value: predPriceRef.current  },
          ]);
        }

        chart.timeScale().fitContent();

        const closes = candles.map((d) => d.close);
        const l = closes.at(-1), f = closes[0];
        setStats({
          last:      l,
          change:    +(l - f).toFixed(2),
          changePct: +(((l - f) / f) * 100).toFixed(2),
          high:      Math.max(...candles.map((d) => d.high)),
          low:       Math.min(...candles.map((d) => d.low)),
          vol:       raw.at(-1)?.volume ?? 0,
        });
      })
      .catch(() => { if (!cancelled) setError("Failed to load chart data"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = candleRef.current = volRef.current = predRef.current = null;
      }
    };
  }, [symbol]); // ← ONLY symbol. isDark handled separately above. predictionPrice via ref.

  // Update prediction line when predictionPrice prop changes AFTER chart is loaded
  // Uses refs — no state dependency, no chart rebuild
  useEffect(() => {
    if (!predRef.current || !lastDateRef.current || !lastCloseRef.current) return;
    if (predictionPrice == null) {
      predRef.current.setData([]);
      return;
    }
    predRef.current.setData([
      { time: lastDateRef.current,        value: lastCloseRef.current },
      { time: addDay(lastDateRef.current), value: predictionPrice     },
    ]);
  }, [predictionPrice]); // ← only predictionPrice, no stats dependency

  const isUp = stats ? stats.changePct >= 0 : true;

  return (
    <div className="flex flex-col w-full" style={{ height: 460 }}>
      {/* Stats bar */}
      <div
        className="shrink-0 flex flex-wrap items-center gap-x-5 gap-y-1 px-4
          border-b border-slate-200 dark:border-slate-700/60 text-xs"
        style={{ height: 44 }}
      >
        {stats && !loading ? (
          <>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
              ₹{stats.last?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className={`font-semibold ${isUp ? "text-emerald-500" : "text-red-500"}`}>
              {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{stats.change} ({isUp ? "+" : ""}{stats.changePct}%)
            </span>
            <span className="text-slate-400 hidden sm:inline">
              H: <span className="text-slate-600 dark:text-slate-300 font-medium">₹{stats.high?.toLocaleString("en-IN")}</span>
            </span>
            <span className="text-slate-400 hidden sm:inline">
              L: <span className="text-slate-600 dark:text-slate-300 font-medium">₹{stats.low?.toLocaleString("en-IN")}</span>
            </span>
            <span className="text-slate-400 hidden md:inline">
              Vol: <span className="text-slate-600 dark:text-slate-300 font-medium">{((stats.vol || 0) / 1e6).toFixed(2)}M</span>
            </span>
            {predictionPrice != null && (
              <span className="text-blue-400 font-medium hidden sm:inline">
                ── AI: ₹{predictionPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            )}
          </>
        ) : (
          <span className="text-slate-400">{error ?? "Loading chart…"}</span>
        )}
      </div>

      {/* Chart canvas */}
      <div className="relative flex-1 min-h-0">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#0b1220] z-10">
            <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-slate-400">Loading chart…</p>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#0b1220]">
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ opacity: loading || error ? 0 : 1, transition: "opacity 0.3s ease" }}
        />
      </div>
    </div>
  );
}

// ── Investment Simulator — isolated so input changes don't re-render parent ──
function InvestmentSimulator({ predictedPrice, currentPrice, loading, card }) {
  const [investment, setInvestment] = useState("10000");
  const investAmt      = parseFloat(investment) || 0;
  const expectedReturn = predictedPrice && currentPrice
    ? (investAmt * (predictedPrice / currentPrice)).toFixed(2) : null;
  const returnDiff = expectedReturn ? (parseFloat(expectedReturn) - investAmt).toFixed(2) : null;
  const returnIsUp = returnDiff ? parseFloat(returnDiff) >= 0 : true;

  return (
    <motion.div variants={FADE_UP} whileHover={{ scale: 1.02 }} style={card} className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign size={15} className="text-emerald-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Simulator</span>
      </div>
      <div className="mb-3">
        <label className="text-xs text-slate-400 mb-1 block">Investment Amount (₹)</label>
        <input
          type="number"
          value={investment}
          onChange={(e) => setInvestment(e.target.value)}
          placeholder="10000"
          className="w-full px-3 py-2 rounded-xl text-sm font-mono
            bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700
            text-slate-900 dark:text-white outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>
      {loading ? (
        <div className="space-y-2"><Skel h="h-6" /><Skel h="h-4" w="w-2/3" /></div>
      ) : expectedReturn ? (
        <>
          <p className="text-xs text-slate-400 mb-1">Expected Value</p>
          <p className={`text-xl font-bold font-mono ${returnIsUp ? "text-emerald-400" : "text-red-400"}`}>
            ₹{parseFloat(expectedReturn).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-sm font-semibold mt-0.5 ${returnIsUp ? "text-emerald-400" : "text-red-400"}`}>
            {returnIsUp ? "+" : ""}₹{parseFloat(returnDiff).toLocaleString("en-IN", { minimumFractionDigits: 2 })} next period
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-400">Enter amount to simulate</p>
      )}
    </motion.div>
  );
}

// ── Main Analytics page ───────────────────────────────────────────────────────
export default function Analytics({ onAlert }) {
  const [symbol,     setSymbol]     = useState("RELIANCE.NS");
  const [quote,      setQuote]      = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [histStats,  setHistStats]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const { isDark } = useTheme();

  // Keep onAlert in a ref so it never appears in useCallback deps
  const onAlertRef = useRef(onAlert);
  useEffect(() => { onAlertRef.current = onAlert; });

  // fetchData only depends on nothing — uses refs for callbacks
  // This prevents the infinite loop: onAlert changes → fetchData changes → effect re-runs
  const fetchData = useCallback(async (sym) => {
    setLoading(true);
    setQuote(null);
    setPrediction(null);
    setHistStats(null);
    try {
      const [q, p, h] = await Promise.allSettled([
        getStockQuote(sym),
        getPrediction(sym),
        getStockHistory(sym, "3mo"),
      ]);
      const qd = q.status === "fulfilled" ? q.value : null;
      const pd = p.status === "fulfilled" ? p.value : null;
      const hd = h.status === "fulfilled" ? h.value : null;

      setQuote(qd);
      setPrediction(pd);

      if (hd?.data?.length) {
        const closes = hd.data.map((d) => d.close);
        const last = closes.at(-1), first = closes[0];
        setHistStats({
          high:      Math.max(...closes).toFixed(2),
          low:       Math.min(...closes).toFixed(2),
          changePct: (((last - first) / first) * 100).toFixed(2),
          isUp:      last >= first,
        });
      }

      // Fire alert via ref — doesn't affect fetchData stability
      if (pd && Math.abs(pd.change_percent) > 2 && onAlertRef.current) {
        const dir = pd.change_percent > 0 ? "+" : "";
        onAlertRef.current({
          id:      Date.now(),
          symbol:  sym,
          message: `${getDisplayName(sym)} predicted ${dir}${pd.change_percent.toFixed(2)}% tomorrow`,
          signal:  getSignal(pd.predicted_price, pd.current_price, pd.confidence),
          time:    new Date().toLocaleTimeString(),
        });
      }
    } finally {
      setLoading(false);
    }
  }, []); // ← empty deps: fetchData is created once and never changes

  // Only re-fetch when symbol changes
  useEffect(() => {
    fetchData(symbol);
  }, [symbol, fetchData]);

  // ── Derived values (computed, not state — no extra renders) ──────────────
  const currentPrice   = quote?.current_price ?? prediction?.current_price ?? 0;
  const predictedPrice = prediction?.predicted_price ?? null;
  const changePct      = quote?.change_pct ?? 0;
  const signal         = prediction
    ? getSignal(prediction.predicted_price, prediction.current_price, prediction.confidence)
    : "HOLD";
  const sigCfg  = SIGNAL_CONFIG[signal];
  const SigIcon = sigCfg.Icon;

  // Card style — memoised by isDark to avoid object recreation every render
  const card = isDark ? GLASS : LIGHT;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Brain size={22} className="text-blue-500" /> AI Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            AI predictions • Buy/Sell signals • Investment simulation
          </p>
        </div>
        <div className="relative">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-semibold
              bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
              text-slate-900 dark:text-white outline-none cursor-pointer shadow-sm"
          >
            {STOCK_SYMBOLS.map((s) => (
              <option key={s} value={s}>{getDisplayName(s)} ({s})</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Price bar ── */}
      <div style={card} className="p-5 flex flex-wrap items-center gap-6">
        {loading ? (
          <><Skel h="h-9" w="w-44" /><Skel h="h-7" w="w-28" /></>
        ) : (
          <>
            <div>
              <p className="text-xs text-slate-400 mb-1">{getDisplayName(symbol)}</p>
              <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold
              ${changePct >= 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
              {changePct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}% today
            </div>
            {quote && (
              <div className="flex gap-4 text-xs text-slate-400 ml-auto">
                <span>H: <span className="text-slate-600 dark:text-slate-300 font-medium">₹{quote.high?.toLocaleString("en-IN")}</span></span>
                <span>L: <span className="text-slate-600 dark:text-slate-300 font-medium">₹{quote.low?.toLocaleString("en-IN")}</span></span>
                <span>Vol: <span className="text-slate-600 dark:text-slate-300 font-medium">{((quote.volume || 0) / 1e6).toFixed(2)}M</span></span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 4-card grid — animate only on first mount ── */}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {/* AI Prediction */}
        <motion.div variants={FADE_UP} whileHover={{ scale: 1.02 }} style={card} className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={15} className="text-blue-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Prediction</span>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skel h="h-7" w="w-3/4" /><Skel h="h-4" w="w-1/2" /><Skel h="h-3" />
            </div>
          ) : prediction ? (
            <>
              <p className={`text-2xl font-bold font-mono mb-1 ${prediction.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                ₹{prediction.predicted_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className={`text-sm font-semibold mb-3 ${prediction.change_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {prediction.change_percent >= 0 ? "↑ +" : "↓ "}{prediction.change_percent.toFixed(2)}%
              </p>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Confidence</span>
                  <span className="font-semibold text-slate-300">{prediction.confidence}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.confidence}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      prediction.confidence >= 75 ? "bg-emerald-500" :
                      prediction.confidence >= 55 ? "bg-amber-500" : "bg-red-500"
                    }`}
                  />
                </div>
              </div>
              {!prediction.model_available && (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                  <AlertTriangle size={11} /> Fallback estimate
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">No prediction available</p>
          )}
        </motion.div>

        {/* Signal */}
        <motion.div
          variants={FADE_UP}
          whileHover={{ scale: 1.02 }}
          style={{ ...card, boxShadow: loading ? undefined : sigCfg.glow }}
          className="p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-amber-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Signal</span>
          </div>
          {loading ? (
            <div className="space-y-2"><Skel h="h-14" /><Skel h="h-4" w="w-3/4" /></div>
          ) : (
            <>
              <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border text-xl font-black mb-3
                ${sigCfg.bg} ${sigCfg.border} ${sigCfg.color}`}>
                <SigIcon size={20} />{sigCfg.label}
              </div>
              <p className="text-xs text-slate-400">
                {signal === "BUY"  && "Predicted price is higher with strong confidence"}
                {signal === "SELL" && "Predicted price is lower with strong confidence"}
                {signal === "HOLD" && "Confidence too low or price change minimal"}
              </p>
              {prediction && (
                <p className="text-xs text-slate-500 mt-1">
                  Confidence: {prediction.confidence}% (threshold: 60%)
                </p>
              )}
            </>
          )}
        </motion.div>

        {/* Investment Simulator — isolated component to prevent parent re-renders on input */}
        <InvestmentSimulator
          predictedPrice={predictedPrice}
          currentPrice={currentPrice}
          loading={loading}
          card={card}
        />

        {/* 3M Stats */}
        <motion.div variants={FADE_UP} whileHover={{ scale: 1.02 }} style={card} className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={15} className="text-purple-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">3M Stats</span>
          </div>
          {loading ? (
            <div className="space-y-2"><Skel h="h-5" /><Skel h="h-5" /><Skel h="h-5" w="w-3/4" /></div>
          ) : histStats ? (
            <div className="space-y-2.5">
              {[
                { label: "3M High",   value: `₹${parseFloat(histStats.high).toLocaleString("en-IN")}`,  color: "text-emerald-400" },
                { label: "3M Low",    value: `₹${parseFloat(histStats.low).toLocaleString("en-IN")}`,   color: "text-red-400"     },
                { label: "3M Change", value: `${histStats.isUp ? "+" : ""}${histStats.changePct}%`,      color: histStats.isUp ? "text-emerald-400" : "text-red-400" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{s.label}</span>
                  <span className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No stats available</p>
          )}
        </motion.div>
      </motion.div>

      {/* ── Chart ── key={symbol} forces full remount on symbol change ── */}
      <div style={card} className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
          <BarChart2 size={16} className="text-blue-500" />
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{getDisplayName(symbol)}</p>
            <p className="text-xs text-slate-400">
              {symbol} • 3 months • Candlestick + Volume
              {predictedPrice && <span className="text-blue-400 ml-2">• Dashed = AI prediction</span>}
            </p>
          </div>
        </div>
        <AnalyticsChart key={symbol} symbol={symbol} predictionPrice={predictedPrice} />
      </div>

    </div>
  );
}
