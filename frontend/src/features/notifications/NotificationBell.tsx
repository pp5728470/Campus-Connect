import { Bell } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useMarkAllNotificationsRead, useRecentNotifications, useUnreadCount } from '@/hooks/use-notifications'
import { NotificationItem, NotificationSkeletonRows } from './NotificationItem'
import { useOpenNotification } from './use-open-notification'

/** Bell with an unread badge and a dropdown of the latest unread notifications. */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const { data: unread = 0 } = useUnreadCount()
  const recent = useRecentNotifications(open)
  const markAll = useMarkAllNotificationsRead()
  const openNotification = useOpenNotification(() => setOpen(false))

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false)
      rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    }
  }

  const items = recent.data?.content ?? []

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="relative rounded-lg p-2 text-muted hover:bg-hover hover:text-ink"
      >
        <Bell className="size-6" aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 min-w-4 rounded-full border-2 border-surface bg-danger px-1 text-center text-[10px] font-bold leading-4 text-white"
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-4 top-14 z-30 mt-1 rounded-lg border border-border bg-surface sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:w-96"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="text-body font-semibold">Notifications</h2>
            <Button
              variant="ghost"
              size="sm"
              disabled={unread === 0}
              loading={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Mark all as read
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recent.isLoading && <NotificationSkeletonRows />}

            {recent.isError && (
              <div className="flex flex-col items-start gap-2 p-4">
                <p role="alert" className="text-body text-danger">
                  Could not load notifications.
                </p>
                <Button variant="secondary" size="sm" onClick={() => void recent.refetch()}>
                  Try again
                </Button>
              </div>
            )}

            {recent.data && items.length === 0 && (
              <p className="px-4 py-6 text-center text-body text-muted">You are all caught up.</p>
            )}

            {items.length > 0 && (
              <ul className="divide-y divide-border">
                {items.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} onSelect={openNotification} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-4 py-3 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-body font-medium text-accent hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
