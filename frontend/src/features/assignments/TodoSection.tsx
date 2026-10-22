import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useTodo } from '@/hooks/use-assignments'
import { cn } from '@/lib/cn'
import { dueLabel } from '@/lib/format'
import type { TodoItem } from '@/types'

function TodoGroup({ title, items }: { title: string; items: TodoItem[] }) {
  if (items.length === 0) return null
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h3 className="text-meta font-semibold text-muted">
        {title} ({items.length})
      </h3>
      <Card>
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.assignmentId} className="first:rounded-t-lg last:rounded-b-lg hover:bg-hover">
              <Link
                to={`/classes/${item.classroomId}/assignments/${item.assignmentId}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium">{item.title}</p>
                  <p className="truncate text-meta text-muted">{item.classroomName}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={cn('text-meta font-medium', item.status === 'MISSING' ? 'text-danger' : 'text-muted')}
                  >
                    {dueLabel(item.dueAt)}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

/** Student to-do list across all classes: missing work first, then upcoming. */
export function TodoSection() {
  const { data, isLoading, isError, refetch, isRefetching } = useTodo(true)
  const missing = data?.filter((item) => item.status === 'MISSING') ?? []
  const upcoming = data?.filter((item) => item.status !== 'MISSING') ?? []

  return (
    <section aria-labelledby="todo-heading" className="flex flex-col gap-4">
      <h2 id="todo-heading" className="text-section font-semibold">
        To-do
      </h2>

      {isLoading && (
        <Card role="status" aria-label="Loading to-do list" className="flex flex-col gap-3 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
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
          icon={CheckCircle2}
          title="You are all caught up"
          description="Upcoming and missing assignments from your classes will appear here."
        />
      )}

      {data && data.length > 0 && (
        <div className="flex flex-col gap-4">
          <TodoGroup title="Missing" items={missing} />
          <TodoGroup title="Upcoming" items={upcoming} />
        </div>
      )}
    </section>
  )
}
