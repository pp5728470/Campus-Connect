import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStore } from '@/lib/tokens'
import type { AuthResponse } from '@/types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

/** Called when the session can no longer be refreshed; set by the auth provider. */
let onSessionExpired: () => void = () => {}
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// Refresh requests use a bare client so they bypass the interceptors below.
const refreshClient = axios.create({ baseURL: API_BASE_URL })

let isRefreshing = false
let waiting: Array<(token: string | null) => void> = []

function flushQueue(token: string | null) {
  waiting.forEach((resolve) => resolve(token))
  waiting = []
}

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const isAuthCall = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'].some((path) =>
      original?.url?.startsWith(path),
    )

    if (error.response?.status !== 401 || !original || original._retry || isAuthCall) {
      return Promise.reject(error)
    }
    original._retry = true

    const refreshToken = tokenStore.getRefresh()
    if (!refreshToken) {
      tokenStore.clear()
      onSessionExpired()
      return Promise.reject(error)
    }

    // Concurrent 401s wait for the single in-flight refresh instead of starting their own.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waiting.push((token) => {
          if (!token) return reject(error)
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    isRefreshing = true
    try {
      const { data } = await refreshClient.post<AuthResponse>('/auth/refresh', { refreshToken })
      tokenStore.set(data.accessToken, data.refreshToken)
      flushQueue(data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch (refreshError) {
      flushQueue(null)
      tokenStore.clear()
      onSessionExpired()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
