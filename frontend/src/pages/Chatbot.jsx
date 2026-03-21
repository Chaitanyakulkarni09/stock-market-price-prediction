import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User } from 'lucide-react'
import { saveChat } from '../api/api'
import { useAuth } from '../context/AuthContext'

const KB = {
  'nifty': 'NIFTY 50 is the flagship index of the National Stock Exchange (NSE) of India. It tracks the performance of the top 50 large-cap companies listed on NSE, representing about 13 sectors of the Indian economy.',
  'sensex': 'SENSEX (Sensitive Index) is the benchmark index of the Bombay Stock Exchange (BSE). It tracks 30 financially sound and well-established companies listed on BSE.',
  'rsi': 'RSI (Relative Strength Index) is a momentum oscillator that measures the speed and magnitude of price changes. Values above 70 indicate overbought conditions, while values below 30 indicate oversold conditions.',
  'macd': 'MACD (Moving Average Convergence Divergence) is a trend-following momentum indicator. It shows the relationship between two exponential moving averages (12-day and 26-day EMA).',
  'prediction': 'Our AI prediction system uses a Random Forest ML model trained on historical data from January 2010 to December 2023. It uses 16 technical features including Moving Averages, RSI, MACD, Bollinger Bands, and Volume indicators.',
  'random forest': 'Random Forest is an ensemble learning method that builds multiple decision trees and merges them for more accurate predictions. It reduces overfitting and handles non-linear relationships in stock data well.',
  'moving average': "A Moving Average smooths out price data by creating a constantly updated average price. When short-term MA crosses above long-term MA, it's a bullish signal (Golden Cross).",
  'bollinger': 'Bollinger Bands consist of a middle band (20-day MA) and two outer bands (±2 standard deviations). Upper band = overbought, lower band = oversold.',
  'reliance': "Reliance Industries (RELIANCE.NS) is India's largest company by market cap. It operates in petrochemicals, refining, oil, telecom (Jio), and retail.",
  'infy': "Infosys (INFY.NS) is one of India's largest IT services companies. It provides consulting, technology, and outsourcing services globally.",
  'dataset': 'Our ML models are trained on historical stock data from January 2010 to December 2023 — covering 14 years including bull runs, corrections, and the COVID-19 crash.',
  'hello': "Hello! I'm your AI stock market assistant. Ask me about NIFTY, SENSEX, RSI, MACD, stock predictions, or any of the stocks we track!",
  'hi': 'Hi there! How can I help you with stock market insights today?',
}

function getBotReply(msg) {
  const lower = msg.toLowerCase()
  for (const [key, val] of Object.entries(KB)) {
    if (lower.includes(key)) return val
  }
  return "I can help with NIFTY, SENSEX, RSI, MACD, Moving Averages, Bollinger Bands, stock predictions, and individual stocks like Reliance, Infosys, HDFC Bank, Maruti, and HUL."
}

const SUGGESTIONS = ['What is Nifty?', 'Explain RSI', 'What is MACD?', 'How does prediction work?', 'Tell me about the dataset']

export default function Chatbot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: "Hello! I'm your AI stock market assistant. Ask me about NIFTY, SENSEX, RSI, MACD, predictions, or any stock. How can I help?" }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: msg }])
    setTyping(true)
    await new Promise(r => setTimeout(r, 600 + Math.random() * 500))
    const reply = getBotReply(msg)
    setTyping(false)
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }])
    saveChat(msg, reply).catch(() => {})
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold gradient-text">AI Assistant</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ask anything about stocks, indices, and market concepts</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        <AnimatePresence>
          {messages.map(m => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                ${m.role === 'bot'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/30'
                  : 'bg-slate-200 dark:bg-slate-700'}`}>
                {m.role === 'bot'
                  ? <Bot size={16} className="text-white" />
                  : <User size={16} className="text-slate-600 dark:text-slate-300" />}
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${m.role === 'bot'
                  ? 'bg-white/80 dark:bg-slate-800/80 border border-white/90 dark:border-slate-700/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-tl-sm shadow-sm'
                  : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-md shadow-blue-600/20'}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/30">
              <Bot size={16} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/80 dark:bg-slate-800/80 border border-white/90 dark:border-slate-700/60 backdrop-blur-sm shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-blue-400"
                    animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium
              bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm
              border border-white/80 dark:border-slate-700/60
              text-slate-600 dark:text-slate-400
              hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm">
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about stocks, RSI, MACD, predictions..."
          className="input-base flex-1 py-3" />
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => send()}
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700
            hover:from-blue-500 hover:to-blue-600 flex items-center justify-center
            shadow-lg shadow-blue-600/30 transition-all">
          <Send size={18} className="text-white" />
        </motion.button>
      </div>
    </motion.div>
  )
}
