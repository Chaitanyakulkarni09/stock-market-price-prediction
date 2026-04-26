import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, FlaskConical, RotateCcw, ThumbsUp, ThumbsDown, History, X } from 'lucide-react'
import { saveChat, getChatbotResponse, getChatHistory } from '../api/api'
import { useAuth } from '../context/AuthContext'

const SUGGESTIONS = [
  'What is RSI?', 'What is a production system?', 'Explain BFS vs DFS',
  'What is the Turing Test?', 'Price of Reliance', 'What is an intelligent agent?'
]

const LS_VOTES_KEY = 'turing_votes'

function loadVotes() {
  try { return JSON.parse(localStorage.getItem(LS_VOTES_KEY)) || { human: 0, machine: 0 } }
  catch { return { human: 0, machine: 0 } }
}

// ── Turing Test Panel ─────────────────────────────────────────────────────────
function TuringTestPanel({ humanVotes, machineVotes, onVote, onReset, totalMessages }) {
  const total = humanVotes + machineVotes
  const humanPct   = total > 0 ? Math.round((humanVotes   / total) * 100) : 0
  const machinePct = total > 0 ? Math.round((machineVotes / total) * 100) : 0

  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <FlaskConical size={14} className="text-purple-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-800 dark:text-white">Turing Test Evaluation</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Can you tell if this response came from a human or an AI?
          </p>
        </div>
        <button onClick={onReset} title="Reset votes"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all">
          <RotateCcw size={13} />
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => onVote('human')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
            border border-emerald-500/30 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400
            hover:bg-emerald-500/15 transition-all">
          <User size={13} /> 👤 Human
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => onVote('machine')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
            border border-blue-500/30 bg-blue-500/8 text-blue-600 dark:text-blue-400
            hover:bg-blue-500/15 transition-all">
          <Bot size={13} /> 🤖 Machine
        </motion.button>
      </div>

      {total > 0 ? (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <span>👤 Human — {humanVotes} votes ({humanPct}%)</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }} animate={{ width: `${humanPct}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <span>🤖 Machine — {machineVotes} votes ({machinePct}%)</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <motion.div className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }} animate={{ width: `${machinePct}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center pt-1">
            {total} rating{total !== 1 ? 's' : ''} across {totalMessages} bot message{totalMessages !== 1 ? 's' : ''}
            {machinePct >= 70 ? ' · Most think it\'s a machine 🤖' : humanPct >= 70 ? ' · Most think it\'s human! 👤' : ' · Jury is out!'}
          </p>
        </motion.div>
      ) : (
        <p className="text-[10px] text-slate-400 text-center">
          Rate the chatbot responses above — your feedback evaluates our AI
        </p>
      )}
    </div>
  )
}

// ── Per-message rating buttons ────────────────────────────────────────────────
function MessageRating({ msgId, ratings, onRate }) {
  const rating = ratings[msgId]
  return (
    <div className="flex gap-1 mt-1.5 ml-11">
      <button onClick={() => onRate(msgId, 'up')} title="Sounds human"
        className={`p-1 rounded-lg transition-all text-xs ${rating === 'up'
          ? 'text-emerald-500 bg-emerald-500/10'
          : 'text-slate-300 dark:text-slate-600 hover:text-emerald-500 hover:bg-emerald-500/10'}`}>
        <ThumbsUp size={11} />
      </button>
      <button onClick={() => onRate(msgId, 'down')} title="Sounds like a machine"
        className={`p-1 rounded-lg transition-all text-xs ${rating === 'down'
          ? 'text-blue-500 bg-blue-500/10'
          : 'text-slate-300 dark:text-slate-600 hover:text-blue-500 hover:bg-blue-500/10'}`}>
        <ThumbsDown size={11} />
      </button>
      {rating && (
        <span className="text-[10px] text-slate-400 self-center ml-1">
          {rating === 'up' ? 'Sounds human 👤' : 'Sounds like AI 🤖'}
        </span>
      )}
    </div>
  )
}

// ── History drawer ────────────────────────────────────────────────────────────
function HistoryDrawer({ open, onClose, history }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.2 }}
          className="absolute right-0 top-0 h-full w-80 z-20 bg-white dark:bg-slate-900
            border-l border-slate-200 dark:border-slate-700/60 shadow-xl rounded-r-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
            <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <History size={14} /> Chat History
            </p>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {history.length === 0 && (
              <p className="text-xs text-slate-400 text-center mt-8">No history yet</p>
            )}
            {history.map(h => (
              <div key={h.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50
                border border-slate-200 dark:border-slate-700/40 space-y-1.5">
                <p className="text-[10px] text-blue-500 font-semibold">You</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">{h.user_message}</p>
                <p className="text-[10px] text-purple-500 font-semibold">Bot</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{h.bot_response}</p>
                <p className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Chatbot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: "Hello! I'm your AI stock market assistant. Ask me about NIFTY, SENSEX, RSI, MACD, predictions, trading rules, or AI concepts like CSP and Turing Test. How can I help?" }
  ])
  const [input, setInput]             = useState('')
  const [typing, setTyping]           = useState(false)
  const [ratings, setRatings]         = useState({})
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory]         = useState([])

  const saved = loadVotes()
  const [humanVotes,   setHumanVotes]   = useState(saved.human)
  const [machineVotes, setMachineVotes] = useState(saved.machine)

  const bottomRef = useRef(null)
  const botMessageCount = messages.filter(m => m.role === 'bot').length

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  useEffect(() => {
    getChatHistory().then(setHistory).catch(() => {})
  }, [])

  const persistVotes = (h, m) => {
    localStorage.setItem(LS_VOTES_KEY, JSON.stringify({ human: h, machine: m }))
  }

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    const userMsg = { id: Date.now(), role: 'user', text: msg }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    let reply = ''
    try {
      const data = await getChatbotResponse(msg)
      reply = data.reply
    } catch (error) {
      reply = `Sorry, I couldn't connect to the server. Please try again.`
    }

    setTyping(false)
    const botMsg = { id: Date.now() + 1, role: 'bot', text: reply }
    setMessages(prev => [...prev, botMsg])
    saveChat(msg, reply).then(() => getChatHistory().then(setHistory).catch(() => {})).catch(() => {})
  }

  const handleVote = (type) => {
    const h = type === 'human' ? humanVotes + 1 : humanVotes
    const m = type === 'machine' ? machineVotes + 1 : machineVotes
    setHumanVotes(h)
    setMachineVotes(m)
    persistVotes(h, m)
  }

  const handleReset = () => {
    setHumanVotes(0)
    setMachineVotes(0)
    persistVotes(0, 0)
  }

  const handleRate = (msgId, val) => {
    setRatings(prev => {
      const next = { ...prev, [msgId]: prev[msgId] === val ? undefined : val }
      // tally into turing votes
      const prevVal = prev[msgId]
      let h = humanVotes, m = machineVotes
      if (prevVal === 'up') h--
      if (prevVal === 'down') m--
      if (next[msgId] === 'up') h++
      if (next[msgId] === 'down') m++
      setHumanVotes(h); setMachineVotes(m); persistVotes(h, m)
      return next
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-8rem)] relative">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">AI Assistant</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ask anything about stocks, indices, and market concepts
          </p>
        </div>
        <button onClick={() => setShowHistory(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
            border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400
            hover:border-blue-400 hover:text-blue-500 transition-all">
          <History size={13} /> History
        </button>
      </div>

      {/* Turing Test banner */}
      <div className="mb-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <FlaskConical size={16} className="text-purple-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">🧪 Turing Test Active</p>
          <p className="text-xs text-purple-600/80 dark:text-purple-400/70 mt-0.5">
            Rate each response with 👍 (sounds human) or 👎 (sounds like AI), or use the panel below. Votes are saved across sessions.
          </p>
        </div>
      </div>

      {/* Turing Test Panel */}
      <TuringTestPanel
        humanVotes={humanVotes} machineVotes={machineVotes}
        onVote={handleVote} onReset={handleReset} totalMessages={botMessageCount}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        <AnimatePresence>
          {messages.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
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
                    ? 'bg-white border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 rounded-tl-sm shadow-sm'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-md shadow-blue-600/20'}`}>
                  {m.text}
                </div>
              </div>
              {m.role === 'bot' && m.id !== 1 && (
                <MessageRating msgId={m.id} ratings={ratings} onRate={handleRate} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/30">
              <Bot size={16} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/60 shadow-sm">
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

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium
              bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60
              text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about stocks, RSI, MACD, trading rules, AI concepts..."
          className="input-base flex-1 py-3" />
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => send()}
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700
            hover:from-blue-500 hover:to-blue-600 flex items-center justify-center
            shadow-lg shadow-blue-600/30 transition-all">
          <Send size={18} className="text-white" />
        </motion.button>
      </div>

      {/* History drawer */}
      <HistoryDrawer open={showHistory} onClose={() => setShowHistory(false)} history={history} />
    </motion.div>
  )
}
