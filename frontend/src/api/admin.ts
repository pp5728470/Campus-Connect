import type { AdminClassroom, AdminStats, PageResponse, Role, User } from '@/types'
import { api } from './client'

export interface AdminUserQuery {
  q?: string
  role?: Role
  page: number
  size: number
}

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),
  users: ({ q, role, page, size }: AdminUserQuery) =>
    api
      .get<PageResponse<User>>('/admin/users', { params: { q: q || undefined, role, page, size } })
      .then((r) => r.data),
  activate: (id: number) => api.patch<User>(`/admin/users/${id}/activate`).then((r) => r.data),
  deactivate: (id: number) => api.patch<User>(`/admin/users/${id}/deactivate`).then((r) => r.data),
  changeRole: (id: number, role: Role) => api.patch<User>(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  classrooms: (q: string, page: number, size: number) =>
    api
      .get<PageResponse<AdminClassroom>>('/admin/classrooms', { params: { q: q || undefined, page, size } })
      .then((r) => r.data),
}
