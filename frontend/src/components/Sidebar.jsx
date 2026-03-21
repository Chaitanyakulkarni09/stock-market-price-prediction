import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, Brain, BarChart2,
  Star, MessageSquare, HelpCircle, Info, X, Cpu
} from 'lucide-react'

const links = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/stocks',      icon: TrendingUp,      label: 'Stocks' },
  { to: '/predictions', icon: Brain,           label: 'Predictions' },
  { to: '/analytics',   icon: BarChart2,       label: 'Analytics' },
  { to: '/ai-engine',   icon: Cpu,             label: 'AI Engine' },
  { to: '/watchlist',   icon: Star,            label: 'Watchlist' },
  { to: '/chatbot',     icon: MessageSquare,   label: 'Chatbot' },
  { to: '/help',        icon: HelpCircle,      label: 'Help' },
  { to: '/about',       icon: Info,            label: 'About' },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} end={to === '/'}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ x: 3 }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
            ${isActive
              ? 'text-white shadow-lg shadow-blue-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          style={isActive ? {
            background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
          } : {}}
        >
          <Icon size={17} />
          <span>{label}</span>
        </motion.div>
      )}
    </NavLink>
  )
}

function SidebarContent({ onClick }) {
  return (
    <nav className="space-y-0.5">
      {links.map(l => <NavItem key={l.to} {...l} onClick={onClick} />)}
    </nav>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-56 z-40
        sidebar-glass px-3 py-4 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden
                sidebar-glass px-3 py-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="font-bold text-slate-900 dark:text-white">Menu</span>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>
              <SidebarContent onClick={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
