import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useGradebook } from '@/hooks/use-grades'
import { cn } from '@/lib/cn'
import { formatMarks, formatPercent } from '@/lib/format'
import type { Classroom, GradebookCell } from '@/types'
import { ExportButtons } from './ExportButtons'
import { GradebookInsights } from './GradebookInsights'
import { GradeModal, type GradeTarget } from './GradeModal'

function CellContent({ cell, maxPoints }: { cell: GradebookCell; maxPoints: number }) {
  if (cell.grade !== null) {
    return (
      <span className="tabular-nums">
        <b className="font-semibold">{formatMarks(cell.grade)}</b>
        <span className="text-muted">/{maxPoints}</span>
      </span>
    )
  }
  if (cell.status === 'ASSIGNED') return <span className="text-meta text-muted">Assigned</span>
  return <StatusBadge status={cell.status} />
}

function OverallMeter({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="text-muted">-</span>
  const low = percent < 50
  return (
    <span className={cn('meter inline-flex items-center gap-2.5', low && 'low')}>
      <i className="block h-1.5 w-14 overflow-hidden rounded-sm bg-line" aria-hidden="true">
        <em
          className={cn('block h-full rounded-sm', low ? 'bg-danger' : 'bg-ok')}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </i>
      <span className="tabular-nums font-semibold">{formatPercent(percent)}</span>
    </span>
  )
}

function GradebookSkeleton() {
  return (
    <div role="status" aria-label="Loading gradebook" className="overflow-hidden rounded-xl border border-border bg-surface p-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="mb-3 h-8 w-full last:mb-0" />
      ))}
    </div>
  )
}

/** Teacher view: students down the side, assignments across the top. */
export function GradebookTable({ classroom }: { classroom: Classroom }) {
  const { data, isLoading, isError, refetch, isRefetching } = useGradebook(classroom.id)
  const [target, setTarget] = useState<GradeTarget | null>(null)

  if (isLoading) return <GradebookSkeleton />
  if (isError || !data) {
    return <ErrorState title="Could not load the gradebook" onRetry={() => void refetch()} retrying={isRefetching} />
  }

  if (data.assignments.length === 0 || data.rows.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title={data.assignments.length === 0 ? 'No assignments yet' : 'No students yet'}
        description={
          data.assignments.length === 0
            ? 'Create an assignment in Classwork and its marks will appear here.'
            : `Share the class code ${classroom.classCode} so students can join.`
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-body text-muted">
          Class average <span className="font-semibold text-ink">{formatPercent(data.classAveragePercent)}</span>
        </p>
        <ExportButtons classId={classroom.id} className={classroom.name} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <caption className="sr-only">Gradebook for {data.classroomName}. Select a mark to grade it.</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 top-0 z-20 border-b border-r border-border bg-surface-2 px-3.5 py-2.5 text-left font-semibold"
              >
                Student
              </th>
              {data.assignments.map((assignment) => (
                <th
                  key={assignment.id}
                  scope="col"
                  className="sticky top-0 z-10 min-w-[110px] border-b border-r border-border bg-surface-2 px-3.5 py-2.5 text-left align-bottom font-semibold last:border-r-0"
                >
                  <span className="block max-w-44 whitespace-normal" title={assignment.title}>
                    {assignment.title}
                  </span>
                  <small className="mt-0.5 block font-normal text-muted">Out of {assignment.maxPoints}</small>
                </th>
              ))}
              <th
                scope="col"
                className="sticky top-0 z-10 border-b border-border bg-surface-2 px-3.5 py-2.5 text-right font-semibold"
              >
                Overall
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.studentId} className="hover:bg-surface-2/80">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-r border-border bg-surface px-3.5 py-2.5 text-left font-normal"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={row.studentName} size="sm" />
                    <span className="max-w-48 truncate font-medium">{row.studentName}</span>
                  </div>
                </th>
                {data.assignments.map((assignment, index) => {
                  const cell = row.cells[index]
                  return (
                    <td key={assignment.id} className="border-b border-r border-border px-1 py-0.5 last:border-r-0">
                      {cell &&
                        (classroom.archived ? (
                          <div className="w-full px-2.5 py-2 text-left">
                            <CellContent cell={cell} maxPoints={assignment.maxPoints} />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setTarget({ assignmentId: assignment.id, studentId: row.studentId })}
                            aria-label={`Grade ${row.studentName}, ${assignment.title}`}
                            className="w-full rounded-lg px-2.5 py-2 text-left hover:bg-accent-soft focus-visible:bg-accent-soft"
                          >
                            <CellContent cell={cell} maxPoints={assignment.maxPoints} />
                          </button>
                        ))}
                    </td>
                  )
                })}
                <td className="border-b border-border px-3.5 py-2.5 text-right">
                  <OverallMeter percent={row.averagePercent} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th
                scope="row"
                className="sticky left-0 z-10 border-r border-border bg-surface-2 px-3.5 py-2.5 text-left text-meta font-semibold text-muted"
              >
                Class average
              </th>
              {data.assignments.map((assignment) => (
                <td
                  key={assignment.id}
                  className="border-r border-border bg-surface-2 px-3.5 py-2.5 font-semibold last:border-r-0"
                >
                  {formatPercent(assignment.averagePercent)}
                </td>
              ))}
              <td className="bg-surface-2 px-3.5 py-2.5 text-right font-semibold">
                <OverallMeter percent={data.classAveragePercent} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <GradebookInsights classId={classroom.id} gradebook={data} />

      <GradeModal classId={classroom.id} target={target} onClose={() => setTarget(null)} />
    </div>
  )
}
