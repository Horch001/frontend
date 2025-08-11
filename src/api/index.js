import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://hou.zeabur.app'

export const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})


