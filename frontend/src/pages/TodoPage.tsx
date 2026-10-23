import { Link } from 'react-router-dom'
import { isSameDay, isWithinInterval, parseISO, startOfDay, endOfWeek, startOfWeek } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useTodo } from '@/hooks/use-assignments'
import { useClassrooms } from '@/hooks/use-classrooms'
import { resolveCoverColor } from '@/lib/covers'
import { cn } from '@/lib/cn'
import { dueLabel } from '@/lib/format'
import { useAuth } from '@/lib/auth-context'
import type { TodoItem } from '@/types'

function TodoRow({ item, color }: { item: TodoItem; color: string }) {
  return (
    <li>
      <Link
        to={`/classes/${item.classroomId}/assignments/${item.assignmentId}`}
        className="flex items-start gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 shadow-card no-underline hover:bg-hover"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 h-10 w-3 shrink-0 rounded-[2px_4px_4px_2px] shadow-[inset_3px_0_0_rgba(0,0,0,0.25)]"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0 flex-1">
          <b className="block text-body font-semibold text-ink">{item.title}</b>
          <span className="mt-0.5 block text-meta text-muted">{item.classroomName}</span>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn('text-meta font-medium', item.status === 'MISSING' ? 'text-danger' : 'text-muted')}
            >
              {dueLabel(item.dueAt)}
            </span>
            <StatusBadge status={item.status} />
          </div>
        </div>
      </Link>
    </li>
  )
}

function Group({
  title,
  items,
  colors,
}: {
  title: string
  items: TodoItem[]
  colors: Map<number, string>
}) {
  if (items.length === 0) return null
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h2 className="text-meta font-semibold text-muted">
        {title} ({items.length})
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <TodoRow
            key={item.assignmentId}
            item={item}
            color={colors.get(item.classroomId) ?? resolveCoverColor(null)}
          />
        ))}
      </ul>
    </section>
  )
}

/** Student to-do page: Missing, Due today, This week. */
export default function TodoPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch, isRefetching } = useTodo(user?.role === 'STUDENT')
  const { data: classrooms } = useClassrooms()

  const colors = new Map(
    (classrooms?.content ?? []).map((c) => [c.id, resolveCoverColor(c.bannerColor)]),
  )

  const now = new Date()
  const today = startOfDay(now)
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  const missing = data?.filter((item) => item.status === 'MISSING') ?? []
  const dueToday =
    data?.filter(
      (item) => item.status !== 'MISSING' && item.dueAt && isSameDay(parseISO(item.dueAt), today),
    ) ?? []
  const thisWeek =
    data?.filter((item) => {
      if (item.status === 'MISSING' || !item.dueAt) return false
      const due = parseISO(item.dueAt)
      if (isSameDay(due, today)) return false
      return isWithinInterval(due, { start: weekStart, end: weekEnd })
    }) ?? []

  if (user?.role !== 'STUDENT') {
    return (
      <EmptyState
        title="To-do is for students"
        description="Teachers review submissions from each notebook and the gradebook."
        action={
          <Link to="/" className="text-body font-medium text-accent hover:underline">
            Back home
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-meta font-medium text-muted">Across your notebooks</p>
        <h1 className="mt-1 font-serif text-[34px] font-normal tracking-[-0.02em]">To-do</h1>
      </div>

      {isLoading && (
        <div role="status" aria-label="Loading to-do" className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title="Could not load your to-do list"
          description="Something went wrong while contacting the server."
          action={
            <Button variant="secondary" loading={isRefetching} onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {data && data.length === 0 && (
        <EmptyState
          title="You are all caught up"
          description="When something is due or missing from your notebooks, it will show up here."
        />
      )}

      {data && data.length > 0 && (
        <div className="flex flex-col gap-6">
          <Group title="Missing" items={missing} colors={colors} />
          <Group title="Due today" items={dueToday} colors={colors} />
          <Group title="This week" items={thisWeek} colors={colors} />
        </div>
      )}
    </div>
  )
}
