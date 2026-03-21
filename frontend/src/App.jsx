import { lazy, Suspense, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Spinner } from './components/Loader'

const Dashboard   = lazy(() => import('./pages/Dashboard'))
const Stocks      = lazy(() => import('./pages/Stocks'))
const Predictions = lazy(() => import('./pages/Predictions'))
const Analytics   = lazy(() => import('./pages/Analytics'))
const AIEngine    = lazy(() => import('./pages/AIEngine'))
const Watchlist   = lazy(() => import('./pages/Watchlist'))
const Chatbot     = lazy(() => import('./pages/Chatbot'))
const Help        = lazy(() => import('./pages/Help'))
const About       = lazy(() => import('./pages/About'))
const Login       = lazy(() => import('./pages/Login'))
const Signup      = lazy(() => import('./pages/Signup'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alerts,      setAlerts]      = useState([])

  const handleAlert = useCallback((alert) => setAlerts(prev => [alert, ...prev].slice(0, 20)), [])
  const clearAlerts = useCallback(() => setAlerts([]), [])

  return (
    <div className="min-h-screen text-slate-900 dark:text-white">
      <Navbar
        onMenuClick={() => setSidebarOpen(p => !p)}
        alerts={alerts}
        onClearAlerts={clearAlerts}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-56 pt-16 min-h-screen">
        <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/stocks"      element={<ProtectedRoute><Stocks /></ProtectedRoute>} />
              <Route path="/predictions" element={<ProtectedRoute><Predictions /></ProtectedRoute>} />
              <Route path="/analytics"   element={<ProtectedRoute><Analytics onAlert={handleAlert} /></ProtectedRoute>} />
              <Route path="/ai-engine"   element={<ProtectedRoute><AIEngine /></ProtectedRoute>} />
              <Route path="/watchlist"   element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
              <Route path="/chatbot"     element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
              <Route path="/help"        element={<Help />} />
              <Route path="/about"       element={<About />} />
              <Route path="/login"       element={<Login />} />
              <Route path="/signup"      element={<Signup />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
