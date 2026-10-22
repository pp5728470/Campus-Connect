import { useNavigate } from 'react-router-dom'
import { useMarkNotificationRead } from '@/hooks/use-notifications'
import type { AppNotification } from '@/types'

/** Marks a notification read (best effort) and goes to the page it points at. */
export function useOpenNotification(afterOpen?: () => void) {
  const navigate = useNavigate()
  const { mutate } = useMarkNotificationRead()

  return (notification: AppNotification) => {
    if (!notification.read) mutate(notification.id)
    afterOpen?.()
    if (notification.link) navigate(notification.link)
  }
}
