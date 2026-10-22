import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useMyGrades } from '@/hooks/use-grades'
import { dueLabel, formatMarks, formatPercent } from '@/lib/format'
import type { Classroom } from '@/types'

/** Student view: marks and feedback for every assignment, plus the class average. */
export function StudentGradesView({ classroom }: { classroom: Classroom }) {
  const { data, isLoading, isError, refetch, isRefetching } = useMyGrades(classroom.id)

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading grades" className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Card className="flex flex-col gap-3 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      </div>
    )
  }

  if (isError || !data) {
    return <ErrorState title="Could not load your grades" onRetry={() => void refetch()} retrying={isRefetching} />
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No grades to show yet"
        description="Marks and feedback appear here once your teacher posts assignments and grades them."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-title font-semibold">{formatPercent(data.averagePercent)}</p>
          <p className="text-meta text-muted">Your average</p>
        </Card>
        <Card className="p-4">
          <p className="text-title font-semibold">
            {data.gradedCount} of {data.totalCount}
          </p>
          <p className="text-meta text-muted">Assignments graded</p>
        </Card>
      </div>

      <Card>
        <ul className="divide-y divide-border">
          {data.items.map((item) => (
            <li key={item.assignmentId} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    to={`/classes/${classroom.id}/assignments/${item.assignmentId}`}
                    className="block truncate text-body font-medium hover:text-accent"
                  >
                    {item.title}
                  </Link>
                  <p className="text-meta text-muted">{dueLabel(item.dueAt)}</p>
                </div>
                <div className="shrink-0 text-right">
                  {item.grade !== null ? (
                    <p className="text-body font-semibold">
                      {formatMarks(item.grade)}
                      <span className="font-normal text-muted"> / {item.maxPoints}</span>
                    </p>
                  ) : (
                    <p className="text-body text-muted">- / {item.maxPoints}</p>
                  )}
                  <StatusBadge status={item.status} />
                </div>
              </div>
              {item.feedback && (
                <p className="whitespace-pre-wrap break-words border-l-2 border-border pl-3 text-body text-muted">
                  {item.feedback}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
