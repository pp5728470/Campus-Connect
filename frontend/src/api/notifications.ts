import type { AppNotification, PageResponse } from '@/types'
import { api } from './client'

export const notificationsApi = {
  list: (page = 0, size = 20, unreadOnly = false) =>
    api
      .get<PageResponse<AppNotification>>('/notifications', { params: { page, size, unreadOnly } })
      .then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
  markRead: (id: number) => api.patch<AppNotification>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post<void>('/notifications/read-all').then(() => undefined),
}
