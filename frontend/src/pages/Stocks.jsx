import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, TrendingUp } from "lucide-react";
import { SYMBOL_MAP, ALL_SYMBOLS } from "../utils/symbols";
import LWChart from "../components/LWChart";

const PERIODS = ["1D", "1W", "1M", "3M", "1Y"];

export default function Stocks() {
  const [params] = useSearchParams();
  const initSym  = params.get("symbol") || "RELIANCE.NS";
  const [selected, setSelected] = useState(
    ALL_SYMBOLS.includes(initSym) ? initSym : "RELIANCE.NS"
  );
  const [period, setPeriod] = useState("1D");
  const info = SYMBOL_MAP[selected];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Stocks</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Professional candlestick charts • Real backend data
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="input-base appearance-none pl-4 pr-10 py-2.5 w-auto cursor-pointer"
          >
            {ALL_SYMBOLS.map((sym) => (
              <option key={sym} value={sym}>
                {SYMBOL_MAP[sym].display} ({sym})
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        <div className="flex gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-1 border border-white/80 dark:border-slate-700/60">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${period === p
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol pills */}
      <div className="flex flex-wrap gap-2">
        {ALL_SYMBOLS.map((sym) => (
          <motion.button
            key={sym}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelected(sym)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
              ${selected === sym
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 backdrop-blur-sm"
              }`}
          >
            {SYMBOL_MAP[sym].short}
          </motion.button>
        ))}
      </div>

      {/* Chart card */}
      <div className="card overflow-hidden p-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/40
          flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <TrendingUp size={17} className="text-blue-500" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{info.display}</p>
            <p className="text-xs text-slate-400">{selected} • {period} • Candlestick + Volume</p>
          </div>
        </div>

        <LWChart key={`${selected}-${period}`} symbol={selected} period={period} height={540} />
      </div>
    </motion.div>
  );
}
