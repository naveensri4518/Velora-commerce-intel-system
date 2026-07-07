import axios from 'axios'
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})


api.interceptors.request.use(config => {
  const token = localStorage.getItem('smartbarcode_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('smartbarcode_refresh')
      if (refresh) {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
          const res = await axios.post(`${baseUrl}/auth/refresh`, { refreshToken: refresh })
          localStorage.setItem('smartbarcode_token', res.data.accessToken)
          original.headers.Authorization = `Bearer ${res.data.accessToken}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
