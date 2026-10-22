import { Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useSubmissions } from '@/hooks/use-assignments'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import type { Assignment, SubmissionStatus } from '@/types'
import { GradingPanel } from './GradingPanel'

type Filter = 'ALL' | 'TURNED_IN' | 'GRADED' | 'MISSING' | 'ASSIGNED'

const FILTER_STATUSES: Record<Exclude<Filter, 'ALL'>, SubmissionStatus[]> = {
  TURNED_IN: ['SUBMITTED', 'LATE'],
  GRADED: ['GRADED', 'RETURNED'],
  MISSING: ['MISSING'],
  ASSIGNED: ['ASSIGNED'],
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-title font-semibold">{value}</p>
      <p className="text-meta text-muted">{label}</p>
    </Card>
  )
}

export function SubmissionsPanel({ assignment }: { assignment: Assignment }) {
  const { data, isLoading, isError, refetch } = useSubmissions(assignment.classroomId, assignment.id, true)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const rows = useMemo(() => {
    if (!data) return []
    if (filter === 'ALL') return data.submissions
    return data.submissions.filter((row) => FILTER_STATUSES[filter].includes(row.status))
  }, [data, filter])

  const selected = data?.submissions.find((row) => row.studentId === selectedId) ?? null

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading submissions" className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Card className="flex flex-col gap-3 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Could not load submissions"
        description="Something went wrong while contacting the server."
        action={
          <Button variant="secondary" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Assigned" value={data.assigned} />
        <Stat label="Turned in" value={data.submitted} />
        <Stat label="Graded" value={data.graded} />
        <Stat label="Missing" value={data.missing} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-section font-semibold">Student work</h2>
        <div className="w-full sm:w-48">
          <Select label="Filter by status" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
            <option value="ALL">All students</option>
            <option value="TURNED_IN">Turned in</option>
            <option value="GRADED">Graded</option>
            <option value="MISSING">Missing</option>
            <option value="ASSIGNED">Not turned in yet</option>
          </Select>
        </div>
      </div>

      {data.submissions.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students in this class"
          description="Student work will appear here once students join the class."
        />
      ) : rows.length === 0 ? (
        <EmptyState title="No students match this filter" description="Try a different status." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li key={row.studentId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.studentId)}
                    aria-pressed={row.studentId === selectedId}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover',
                      row.studentId === selectedId && 'bg-accent-soft hover:bg-accent-soft',
                    )}
                  >
                    <Avatar name={row.studentName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-medium">{row.studentName}</p>
                      <p className="truncate text-meta text-muted">
                        {row.submittedAt ? `Turned in ${timeAgo(row.submittedAt)}` : row.studentEmail}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <StatusBadge status={row.status} />
                      {row.grade !== null && (
                        <span className="text-meta text-muted">
                          {row.grade} / {assignment.maxPoints}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {selected ? (
            <GradingPanel assignment={assignment} submission={selected} />
          ) : (
            <EmptyState title="Select a student" description="Choose a student from the list to review and grade their work." />
          )}
        </div>
      )}
    </div>
  )
}
