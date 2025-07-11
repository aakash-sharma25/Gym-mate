import axios from "axios"

const api = axios.create({
  baseURL: "/api",
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle 511 status code
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 511) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export default api
