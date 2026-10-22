import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number, unreadOnly: boolean) => ['notifications', 'list', page, unreadOnly] as const,
  recent: ['notifications', 'recent'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

export const NOTIFICATION_PAGE_SIZE = 20
const RECENT_SIZE = 6
const POLL_INTERVAL_MS = 60_000

/** Unread badge count; polled so new activity shows up without a reload. */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: POLL_INTERVAL_MS,
  })
}

/** Latest unread notifications for the bell dropdown. */
export function useRecentNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.recent,
    queryFn: () => notificationsApi.list(0, RECENT_SIZE, true),
    enabled,
    staleTime: 0,
  })
}

export function useNotifications(page: number, unreadOnly: boolean) {
  return useQuery({
    queryKey: notificationKeys.list(page, unreadOnly),
    queryFn: () => notificationsApi.list(page, NOTIFICATION_PAGE_SIZE, unreadOnly),
    placeholderData: keepPreviousData,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
