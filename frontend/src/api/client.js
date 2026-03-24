/**
 * Axios API client — FIXED:
 * - VITE_API_URL env var properly used
 * - Falls back to /api for proxy in dev
 * - Token auto-attached
 * - 401 → redirect to login
 */
import axios from 'axios'

// In dev, Vite proxies /api → localhost:8000
// In prod, set VITE_API_URL=https://your-backend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('campusiq-auth')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
export const getBaseURL = () => BASE_URL
