import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://hou.zeabur.app'

export const adminApi = axios.create({ baseURL: API_BASE })

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
