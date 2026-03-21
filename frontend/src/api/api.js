import axios from 'axios'

const BASE = 'http://localhost:8000'

const api = axios.create({ baseURL: BASE, timeout: 15000 })

// Attach JWT token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Stocks ────────────────────────────────────────────────────────────────────
export const getPrediction   = (symbol)         => api.get('/api/predict/',       { params: { symbol } }).then(r => r.data)
export const getStockHistory = (symbol, period) => api.get('/api/stocks/history', { params: { symbol, period } }).then(r => r.data)
export const getStockQuote   = (symbol)         => api.get('/api/stocks/quote',   { params: { symbol } }).then(r => r.data)
export const getSymbols      = ()               => api.get('/api/stocks/symbols').then(r => r.data)

// ── Watchlist — user resolved from JWT on backend ────────────────────────────
export const getWatchlist          = ()       => api.get('/api/watchlist/').then(r => r.data)
export const addToWatchlist        = (symbol) => api.post('/api/watchlist/', { symbol }).then(r => r.data)
export const removeFromWatchlist   = (symbol) => api.delete(`/api/watchlist/${encodeURIComponent(symbol)}`).then(r => r.data)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginUser    = (email, password)       => api.post('/api/auth/login',    { email, password }).then(r => r.data)
export const registerUser = (name, email, password) => api.post('/api/auth/register', { name, email, password }).then(r => r.data)
export const getMe        = (token)                 => axios.get(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data)
export const deleteAccount = ()                     => api.delete('/api/auth/delete-account').then(r => r.data)

// ── Chat — user resolved from JWT on backend ──────────────────────────────────
export const saveChat        = (user_message, bot_response) => api.post('/api/chat/save',    { user_message, bot_response }).then(r => r.data)
export const getChatHistory  = ()                           => api.get('/api/chat/history').then(r => r.data)

export default api
