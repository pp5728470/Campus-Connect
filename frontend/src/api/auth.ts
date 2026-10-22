import type { AuthResponse, Role, User } from '@/types'
import { api } from './client'

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  role: Extract<Role, 'TEACHER' | 'STUDENT'>
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),
  logout: () => api.post<void>('/auth/logout').then(() => undefined),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
}
