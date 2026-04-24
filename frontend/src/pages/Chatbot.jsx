import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, FlaskConical, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react'
import { saveChat, getChatbotResponse } from '../api/api'
import { useAuth } from '../context/AuthContext'

const SUGGESTIONS = ['What is Nifty?', 'Explain RSI', 'What is MACD?', 'How does prediction work?', 'Tell me about the dataset']

// ── Turing Test Panel ─────────────────────────────────────────────────────────
function TuringTestPanel({ humanVotes, machineVotes, onVote, onReset, totalMessages }) {
  const total = humanVotes + machineVotes
  const humanPct = total > 0 ? Math.round((humanVotes / total) * 100) : 0
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
        <button onClick={onReset}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all"
          title="Reset votes">
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

      {total > 0 && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <span>👤 Human — {humanVotes} votes ({humanPct}%)</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }} animate={{ width: `${humanPct}%` }}
                transition={{ duration: 0.5 }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <span>🤖 Machine — {machineVotes} votes ({machinePct}%)</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <motion.div className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }} animate={{ width: `${machinePct}%` }}
                transition={{ duration: 0.5 }} />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center pt-1">
            {total} rating{total !== 1 ? 's' : ''} across {totalMessages} bot message{totalMessages !== 1 ? 's' : ''}
            {machinePct >= 70 ? ' · Most think it\'s a machine 🤖' : humanPct >= 70 ? ' · Most think it\'s human! 👤' : ' · Jury is out!'}
          </p>
        </motion.div>
      )}

      {total === 0 && (
        <p className="text-[10px] text-slate-400 text-center">
          Rate the chatbot responses above — your feedback evaluates our AI
        </p>
      )}
    </div>
  )
}

export default function Chatbot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: "Hello! I'm your AI stock market assistant. Ask me about NIFTY, SENSEX, RSI, MACD, predictions, or any stock. How can I help?" }
  ])
  const [input, setInput]           = useState('')
  const [typing, setTyping]         = useState(false)
  const [humanVotes, setHumanVotes] = useState(0)
  const [machineVotes, setMachineVotes] = useState(0)
  const bottomRef = useRef(null)

  const botMessageCount = messages.filter(m => m.role === 'bot').length

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: msg }])
    setTyping(true)
    
    let reply = ""
    try {
      const data = await getChatbotResponse(msg)
      reply = data.reply
    } catch (error) {
      console.error('Chatbot API error:', error.response?.status, error.response?.data);
      reply = `Error: ${error.response?.status || 'Network'} - ${error.response?.data?.detail || error.message}`;
    }

    setTyping(false)
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }])
    saveChat(msg, reply).catch(() => {})
  }

  const handleVote = (type) => {
    if (type === 'human') setHumanVotes(p => p + 1)
    else setMachineVotes(p => p + 1)
  }

  const handleReset = () => {
    setHumanVotes(0)
    setMachineVotes(0)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold gradient-text">AI Assistant</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Ask anything about stocks, indices, and market concepts
        </p>
      </div>

      {/* Turing Test Info */}
      <div className="mb-6 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <FlaskConical size={16} className="text-purple-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">🧪 Turing Test Active</p>
          <p className="text-xs text-purple-600/80 dark:text-purple-400/70 mt-0.5">
            After each response, rate whether it sounds human or machine. Your feedback helps evaluate our AI.
          </p>
        </div>
      </div>

      {/* Turing Test Panel */}
      <TuringTestPanel
        humanVotes={humanVotes}
        machineVotes={machineVotes}
        onVote={handleVote}
        onReset={handleReset}
        totalMessages={botMessageCount}
      />

      {/* Messages */}
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
                  ? 'bg-white border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 rounded-tl-sm shadow-sm'
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
              bg-white dark:bg-slate-800/70
              border border-slate-200 dark:border-slate-700/60
              text-slate-600 dark:text-slate-400
              hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
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
