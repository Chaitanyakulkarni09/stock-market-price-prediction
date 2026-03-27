import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slow, setSlow] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setSlow(false)
    const slowTimer = setTimeout(() => setSlow(true), 8000)
    try {
      await register(form.name, form.email, form.password)
      navigate('/')
    } catch (err) {
      const msg = err?.response?.data?.detail
        || err?.message
        || 'Registration failed. Make sure the backend is running.'
      setError(msg)
    } finally {
      clearTimeout(slowTimer)
      setLoading(false)
      setSlow(false)
    }
  }

  const pwMatch = form.confirm && form.password === form.confirm

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            AI<span className="text-blue-500">Stocks</span>
          </span>
        </div>

        <div className="card shadow-2xl">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Create account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Start your AI trading journey</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm mb-4"
            >
              <AlertCircle size={15} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
                    bg-slate-50 dark:bg-slate-800/80
                    border border-slate-200 dark:border-slate-700
                    text-slate-900 dark:text-white placeholder-slate-400
                    outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
                    bg-slate-50 dark:bg-slate-800/80
                    border border-slate-200 dark:border-slate-700
                    text-slate-900 dark:text-white placeholder-slate-400
                    outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm
                    bg-slate-50 dark:bg-slate-800/80
                    border border-slate-200 dark:border-slate-700
                    text-slate-900 dark:text-white placeholder-slate-400
                    outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password" required
                  value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm
                    bg-slate-50 dark:bg-slate-800/80
                    border border-slate-200 dark:border-slate-700
                    text-slate-900 dark:text-white placeholder-slate-400
                    outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                {form.confirm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {pwMatch
                      ? <CheckCircle size={15} className="text-emerald-500" />
                      : <AlertCircle size={15} className="text-red-400" />}
                  </div>
                )}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white
                disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                       boxShadow: "0 4px 16px rgba(59,130,246,0.4)" }}
            >
              {loading ? (slow ? 'Waking up server (~30s)...' : 'Creating account...') : 'Create Account'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-400 font-semibold">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
