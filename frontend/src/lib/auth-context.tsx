import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type LoginPayload, type RegisterPayload } from '@/api/auth'
import { setSessionExpiredHandler } from '@/api/client'
import { tokenStore } from '@/lib/tokens'
import type { AuthResponse, User } from '@/types'

interface AuthContextValue {
  user: User | null
  /** True while the stored session is being restored on first load. */
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  /** Verifies the current password and swaps in the fresh session tokens the server returns. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => tokenStore.getAccess() !== null)

  // Restore the session from stored tokens.
  useEffect(() => {
    if (!tokenStore.getAccess()) return
    let cancelled = false
    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => tokenStore.clear())
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Drop to the logged-out state when the refresh token is rejected.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null)
      queryClient.clear()
    })
  }, [queryClient])

  const startSession = useCallback((data: AuthResponse) => {
    tokenStore.set(data.accessToken, data.refreshToken)
    setUser(data.user)
    return data.user
  }, [])

  const login = useCallback((payload: LoginPayload) => authApi.login(payload).then(startSession), [startSession])
  const register = useCallback(
    (payload: RegisterPayload) => authApi.register(payload).then(startSession),
    [startSession],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // The local session is cleared even if the server call fails.
    }
    tokenStore.clear()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      startSession(await authApi.changePassword(currentPassword, newPassword))
    },
    [startSession],
  )

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, changePassword }),
    [user, isLoading, login, register, logout, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

