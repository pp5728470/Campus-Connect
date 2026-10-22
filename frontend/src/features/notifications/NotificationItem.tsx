import { Bell, BookOpen, CalendarClock, ClipboardList, FileText, Megaphone, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import type { AppNotification, NotificationType } from '@/types'

const ICONS: Record<NotificationType, LucideIcon> = {
  ANNOUNCEMENT: Megaphone,
  ASSIGNMENT: ClipboardList,
  MATERIAL: FileText,
  GRADED: BookOpen,
  DUE_TOMORROW: CalendarClock,
}

interface NotificationItemProps {
  notification: AppNotification
  onSelect: (notification: AppNotification) => void
}

/** One notification row; unread items are marked with weight and a small accent dot. */
export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const Icon = ICONS[notification.type] ?? Bell
  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-hover"
    >
      <Icon className="mt-1 size-4 shrink-0 text-muted" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className={cn('block text-body', notification.read ? 'text-muted' : 'font-semibold')}>
          {notification.title}
        </span>
        {notification.body && <span className="line-clamp-2 block text-body text-muted">{notification.body}</span>}
        <span className="block text-meta text-muted">
          {notification.classroomName ? `${notification.classroomName} \u00b7 ` : ''}
          {timeAgo(notification.createdAt)}
        </span>
      </span>
      {!notification.read && (
        <>
          <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
          <span className="sr-only">Unread</span>
        </>
      )}
    </button>
  )
}

export function NotificationSkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading notifications" className="flex flex-col gap-3 p-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div aria-hidden="true" className="h-4 w-2/3 animate-pulse rounded-lg bg-border" />
          <div aria-hidden="true" className="h-3 w-1/3 animate-pulse rounded-lg bg-border" />
        </div>
      ))}
    </div>
  )
}
