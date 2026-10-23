import { Bell } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { NotificationItem, NotificationSkeletonRows } from '@/features/notifications/NotificationItem'
import { useOpenNotification } from '@/features/notifications/use-open-notification'
import { useMarkAllNotificationsRead, useNotifications, useUnreadCount } from '@/hooks/use-notifications'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/errors'

export default function NotificationsPage() {
  const [page, setPage] = useState(0)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const toast = useToast()
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications(page, unreadOnly)
  const { data: unread = 0 } = useUnreadCount()
  const markAll = useMarkAllNotificationsRead()
  const openNotification = useOpenNotification()

  const items = data?.content ?? []

  const markAllRead = async () => {
    try {
      await markAll.mutateAsync()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const filterButton = (label: string, value: boolean) => (
    <button
      type="button"
      aria-pressed={unreadOnly === value}
      onClick={() => {
        setUnreadOnly(value)
        setPage(0)
      }}
      className={cn(
        'rounded-lg border px-3 py-1 text-body font-medium',
        unreadOnly === value ? 'border-accent bg-accent-soft text-accent' : 'border-border text-muted hover:bg-hover',
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[34px] font-normal tracking-[-0.02em]">Notifications</h1>
          <p className="mt-1 text-body text-muted">{unread === 0 ? 'You are all caught up.' : `${unread} unread`}</p>
        </div>
        <Button variant="secondary" disabled={unread === 0} loading={markAll.isPending} onClick={() => void markAllRead()}>
          Mark all as read
        </Button>
      </div>

      <div className="flex gap-2" role="group" aria-label="Filter notifications">
        {filterButton('All', false)}
        {filterButton('Unread', true)}
      </div>

      {isLoading && (
        <Card>
          <NotificationSkeletonRows count={5} />
        </Card>
      )}

      {isError && (
        <ErrorState title="Could not load notifications" onRetry={() => void refetch()} retrying={isRefetching} />
      )}

      {data && items.length === 0 && (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          description="Announcements, new assignments, grades and due-date reminders show up here."
        />
      )}

      {items.length > 0 && (
        <Card>
          <ul className="divide-y divide-border">
            {items.map((notification) => (
              <li key={notification.id}>
                <NotificationItem notification={notification} onSelect={openNotification} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data && <Pagination label="Notification pages" page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  )
}
