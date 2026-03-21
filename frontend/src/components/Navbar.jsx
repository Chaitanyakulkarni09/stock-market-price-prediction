import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, TrendingUp, Menu, LogOut, User, ChevronDown, Zap, Trash2, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { deleteAccount } from '../api/api'

export default function Navbar({ onMenuClick, alerts = [], onClearAlerts }) {
  const [query,       setQuery]       = useState('')
  const [dropOpen,    setDropOpen]    = useState(false)
  const [alertsOpen,  setAlertsOpen]  = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const dropRef    = useRef(null)
  const alertsRef  = useRef(null)
  const navigate   = useNavigate()
  const { user, logout } = useAuth()

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current   && !dropRef.current.contains(e.target))   setDropOpen(false)
      if (alertsRef.current && !alertsRef.current.contains(e.target)) setAlertsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/stocks?symbol=${query.trim().toUpperCase()}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
    } catch {
      // backend may have deleted successfully even on network error after commit
    }
    // Remove token first, then hard redirect — avoids unmount race condition
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  const unreadCount = alerts.length

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 gap-4 navbar-glass">

      {/* Mobile menu */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <Menu size={20} className="text-slate-600 dark:text-slate-300" />
      </button>

      {/* Logo */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
          <TrendingUp size={16} className="text-white" />
        </div>
        <span className="font-bold text-lg text-slate-900 dark:text-white hidden sm:block">
          AI<span className="text-blue-500">Stocks</span>
        </span>
      </motion.div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search symbol... e.g. RELIANCE.NS"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl
              bg-white/70 dark:bg-slate-800/70
              border border-white/80 dark:border-slate-700/60
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              text-slate-900 dark:text-white placeholder-slate-400
              outline-none transition-all backdrop-blur-sm"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />

        {/* AI Alerts bell */}
        <div className="relative" ref={alertsRef}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setAlertsOpen(p => !p)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell size={18} className="text-slate-600 dark:text-slate-300" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                  bg-blue-500 text-white text-[10px] font-bold rounded-full
                  flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {alertsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl
                  bg-white dark:bg-slate-900
                  border border-slate-200 dark:border-slate-700
                  shadow-xl dark:shadow-slate-900/60 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-blue-500" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Alerts</p>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => { onClearAlerts?.(); setAlertsOpen(false); }}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell size={24} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No alerts yet</p>
                      <p className="text-xs text-slate-500 mt-1">Visit Analytics to generate AI alerts</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="px-4 py-3 border-b border-slate-50 dark:border-slate-800/60
                        hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md
                                ${alert.signal === 'BUY'  ? 'bg-emerald-500/15 text-emerald-400' :
                                  alert.signal === 'SELL' ? 'bg-red-500/15 text-red-400' :
                                  'bg-amber-500/15 text-amber-400'}`}>
                                {alert.signal}
                              </span>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{alert.symbol}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{alert.message}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{alert.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User dropdown */}
        {user ? (
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropOpen(p => !p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{user.name?.[0]?.toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:block">
                {user.name}
              </span>
              <ChevronDown size={14} className="text-slate-400 hidden md:block" />
            </button>

            <AnimatePresence>
              {dropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-2xl
                    bg-white dark:bg-slate-800
                    border border-slate-200 dark:border-slate-700
                    shadow-xl dark:shadow-slate-900/50 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-600 dark:text-slate-300
                      hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors border-b border-slate-100 dark:border-slate-700"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                  <button
                    onClick={() => { setDropOpen(false); setDeleteModal(true); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500
                      hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                    Delete account
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl
              hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <User size={18} className="text-slate-600 dark:text-slate-300" />
          </button>
        )}
      </div>
    </header>

    {/* ── Delete Account Confirmation Modal ── */}
    <AnimatePresence>
      {deleteModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => !deleting && setDeleteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-700
              shadow-2xl p-6"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/15 mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
              Delete Account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              This will permanently delete your account, watchlist, and all chat history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                  bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                  hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                  bg-red-500 hover:bg-red-600 text-white transition-colors
                  disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting…</>
                ) : (
                  <><Trash2 size={14} /> Delete</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
  )
}
