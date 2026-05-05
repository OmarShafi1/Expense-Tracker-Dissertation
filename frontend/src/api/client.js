import axios from 'axios'

// In development VITE_API_URL is unset, so we fall back to '/api' which
// the Vite dev-server proxy forwards to http://localhost:5000.
// In production (Vercel) VITE_API_URL is set to the Render backend URL,
// e.g. https://expense-tracker-api.onrender.com
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const client = axios.create({ baseURL: BASE })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client
