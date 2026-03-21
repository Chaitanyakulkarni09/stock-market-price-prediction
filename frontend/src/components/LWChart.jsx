/**
 * LWChart — TradingView-style candlestick + volume chart
 * Uses lightweight-charts v5 API
 * Optional: predictionPrice prop draws a dashed line at predicted price
 */
import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, CrosshairMode } from "lightweight-charts";
import { getStockHistory } from "../api/api";
import { useTheme } from "../context/ThemeContext";

const PERIOD_MAP = {
  "1D": "1mo",
  "1W": "3mo",
  "1M": "6mo",
  "3M": "1y",
  "1Y": "2y",
};

function getThemeOptions(isDark) {
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
    rightPriceScale: {
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    },
    timeScale: {
      borderColor:    isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
      timeVisible:    true,
      secondsVisible: false,
    },
  };
}

/** Add one calendar day to a YYYY-MM-DD string */
function addOneDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function LWChart({ symbol, period = "1D", height = 480, mini = false, predictionPrice = null }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleRef    = useRef(null);
  const volRef       = useRef(null);
  const predRef      = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [stats,   setStats]   = useState(null);

  const { isDark } = useTheme();

  // Re-apply theme when toggled
  useEffect(() => {
    chartRef.current?.applyOptions(getThemeOptions(isDark));
  }, [isDark]);

  // Main effect: create chart + load data
  useEffect(() => {
    if (!containerRef.current) return;

    // Tear down previous instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
      predRef.current = null;
    }

    setLoading(true);
    setError(null);
    setStats(null);

    const STATS_H = mini ? 0 : 44;
    const chartH  = height - STATS_H;

    const chart = createChart(containerRef.current, {
      width:        containerRef.current.clientWidth || 600,
      height:       chartH,
      ...getThemeOptions(isDark),
      handleScroll: !mini,
      handleScale:  !mini,
    });
    chartRef.current = chart;

    // Candlestick series
    const candle = chart.addSeries(CandlestickSeries, {
      upColor:         "#22c55e",
      downColor:       "#ef4444",
      borderUpColor:   "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor:     "#22c55e",
      wickDownColor:   "#ef4444",
      priceScaleId:    "right",
    });
    candleRef.current = candle;

    // Volume histogram — full chart only
    let vol = null;
    if (!mini) {
      vol = chart.addSeries(HistogramSeries, {
        priceFormat:  { type: "volume" },
        priceScaleId: "vol",
        color:        "rgba(59,130,246,0.3)",
      });
      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
        borderVisible: false,
      });
      volRef.current = vol;
    }

    // Prediction line series — dashed, blue
    const pred = chart.addSeries(LineSeries, {
      color:        "#60a5fa",
      lineWidth:    2,
      lineStyle:    2, // dashed
      priceScaleId: "right",
      lastValueVisible: true,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
    });
    predRef.current = pred;

    // Auto-resize
    const onResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", onResize);

    let cancelled = false;
    const apiPeriod = PERIOD_MAP[period] || "1mo";

    getStockHistory(symbol, apiPeriod)
      .then((res) => {
        if (cancelled) return;
        const raw = res?.data || [];
        if (!raw.length) { setError("No data available"); return; }

        const seen = new Set();
        const candles = raw
          .map((d) => ({
            time:  d.date.slice(0, 10),
            open:  +d.open,
            high:  +d.high,
            low:   +d.low,
            close: +d.close,
          }))
          .sort((a, b) => (a.time > b.time ? 1 : -1))
          .filter((c) => {
            if (seen.has(c.time)) return false;
            seen.add(c.time);
            return true;
          });

        if (!candleRef.current) return;
        candleRef.current.setData(candles);

        if (volRef.current) {
          const seenV = new Set();
          const volData = raw
            .map((d) => ({
              time:  d.date.slice(0, 10),
              value: +d.volume,
              color: +d.close >= +d.open
                ? "rgba(34,197,94,0.4)"
                : "rgba(239,68,68,0.4)",
            }))
            .sort((a, b) => (a.time > b.time ? 1 : -1))
            .filter((v) => {
              if (seenV.has(v.time)) return false;
              seenV.add(v.time);
              return true;
            });
          volRef.current.setData(volData);
        }

        // Draw prediction line if predictionPrice provided
        if (predRef.current && predictionPrice != null && candles.length > 0) {
          const lastCandle = candles[candles.length - 1];
          const nextDay    = addOneDay(lastCandle.time);
          predRef.current.setData([
            { time: lastCandle.time, value: lastCandle.close },
            { time: nextDay,         value: predictionPrice  },
          ]);
        }

        chartRef.current?.timeScale().fitContent();

        const closes = candles.map((d) => d.close);
        const last   = closes.at(-1);
        const first  = closes[0];
        setStats({
          last,
          change:    +(last - first).toFixed(2),
          changePct: +(((last - first) / first) * 100).toFixed(2),
          high:      Math.max(...candles.map((d) => d.high)),
          low:       Math.min(...candles.map((d) => d.low)),
          vol:       raw.at(-1)?.volume ?? 0,
        });
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load chart data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current  = null;
        candleRef.current = null;
        volRef.current    = null;
        predRef.current   = null;
      }
    };
  }, [symbol, period]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update prediction line when predictionPrice changes without re-creating chart
  useEffect(() => {
    if (!predRef.current || !candleRef.current) return;
    if (predictionPrice == null) {
      predRef.current.setData([]);
      return;
    }
    // We need the last candle time — read from stats if available
    // This effect runs after the main effect sets stats
  }, [predictionPrice]);

  const isUp = stats ? stats.changePct >= 0 : true;

  return (
    <div className="flex flex-col w-full" style={{ height }}>
      {/* Stats bar — full chart only */}
      {!mini && (
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
                <span className="text-blue-400 hidden sm:inline font-medium">
                  ── Predicted: ₹{predictionPrice?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400">{error ?? "Loading…"}</span>
          )}
        </div>
      )}

      {/* Chart area */}
      <div className="relative flex-1 min-h-0">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center
            bg-white dark:bg-[#0b1220] z-10">
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
