import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useGradebook } from '@/hooks/use-grades'
import { formatMarks, formatPercent } from '@/lib/format'
import type { Classroom, GradebookCell } from '@/types'
import { ExportButtons } from './ExportButtons'
import { GradeModal, type GradeTarget } from './GradeModal'

function CellContent({ cell, maxPoints }: { cell: GradebookCell; maxPoints: number }) {
  if (cell.grade !== null) {
    return (
      <span className="font-medium">
        {formatMarks(cell.grade)}
        <span className="font-normal text-muted"> / {maxPoints}</span>
      </span>
    )
  }
  if (cell.status === 'ASSIGNED') return <span className="text-meta text-muted">Assigned</span>
  return <StatusBadge status={cell.status} />
}

function GradebookSkeleton() {
  return (
    <Card role="status" aria-label="Loading gradebook" className="flex flex-col gap-3 p-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </Card>
  )
}

/** Teacher view: students down the side, assignments across the top. Clicking a cell opens the grading form. */
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

      <Card className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-body">
          <caption className="sr-only">Gradebook for {data.classroomName}. Select a mark to grade it.</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-meta font-medium text-muted">
                Student
              </th>
              {data.assignments.map((assignment) => (
                <th key={assignment.id} scope="col" className="min-w-32 px-4 py-3 text-left align-bottom">
                  <span className="block max-w-44 truncate text-body font-medium" title={assignment.title}>
                    {assignment.title}
                  </span>
                  <span className="text-meta font-normal text-muted">Out of {assignment.maxPoints}</span>
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right text-meta font-medium text-muted">
                Average
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.rows.map((row) => (
              <tr key={row.studentId}>
                <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-3 text-left font-normal">
                  <span className="block max-w-48 truncate font-medium">{row.studentName}</span>
                  <span className="block max-w-48 truncate text-meta text-muted">{row.studentEmail}</span>
                </th>
                {data.assignments.map((assignment, index) => {
                  const cell = row.cells[index]
                  return (
                    <td key={assignment.id} className="px-2 py-1">
                      {cell && (
                        <button
                          type="button"
                          onClick={() => setTarget({ assignmentId: assignment.id, studentId: row.studentId })}
                          aria-label={`Grade ${row.studentName}, ${assignment.title}`}
                          className="w-full rounded-lg px-2 py-2 text-left hover:bg-hover"
                        >
                          <CellContent cell={cell} maxPoints={assignment.maxPoints} />
                        </button>
                      )}
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-right font-medium">{formatPercent(row.averagePercent)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-meta font-medium text-muted">
                Class average
              </th>
              {data.assignments.map((assignment) => (
                <td key={assignment.id} className="px-4 py-3 font-medium">
                  {formatPercent(assignment.averagePercent)}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-semibold">{formatPercent(data.classAveragePercent)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <GradeModal classId={classroom.id} target={target} onClose={() => setTarget(null)} />
    </div>
  )
}
