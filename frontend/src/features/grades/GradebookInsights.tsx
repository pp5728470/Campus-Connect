import { ProgressRing } from '@/components/ui/ProgressRing'
import { useClassAnalytics } from '@/hooks/use-grades'
import { formatPercent } from '@/lib/format'
import type { Gradebook } from '@/types'

interface GradebookInsightsProps {
  classId: number
  gradebook: Gradebook
}

/** Three insight cards under the gradebook: on-time ring, marks spread, needs attention. */
export function GradebookInsights({ classId, gradebook }: GradebookInsightsProps) {
  const { data, isLoading, isError } = useClassAnalytics(classId)

  if (isLoading || isError || !data || data.assignmentCount === 0) return null

  const totalSubmitted = data.assignments.reduce((sum, a) => sum + a.submitted, 0)
  const totalPossible = data.assignments.reduce((sum, a) => sum + a.totalStudents, 0)
  const onTimeRate = totalPossible > 0 ? Math.round((totalSubmitted / totalPossible) * 100) : 0

  const maxBucket = Math.max(1, ...data.distribution.map((b) => b.count))
  const hasGrades = data.distribution.some((b) => b.count > 0)

  const needsAttention = gradebook.rows
    .map((row) => {
      const missing = row.cells.filter((c) => c.status === 'MISSING').length
      const low = row.averagePercent !== null && row.averagePercent < 50
      return { name: row.studentName, missing, low, averagePercent: row.averagePercent }
    })
    .filter((row) => row.missing > 0 || row.low)
    .sort((a, b) => b.missing - a.missing || (a.averagePercent ?? 0) - (b.averagePercent ?? 0))
    .slice(0, 5)

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <article className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h4 className="text-[13px] font-semibold text-muted">On-time submissions</h4>
        <p className="mt-2 font-serif text-[48px] font-normal leading-none tracking-[-0.02em]">
          {onTimeRate}
          <span className="text-[24px] text-muted">%</span>
        </p>
        <ProgressRing
          className="mt-3"
          value={onTimeRate}
          label={`${totalSubmitted} of ${totalPossible} turned in across assignments`}
        />
      </article>

      <article className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h4 className="text-[13px] font-semibold text-muted">Marks spread</h4>
        <p className="mt-2 font-serif text-[28px] font-normal leading-none">
          {formatPercent(data.classAveragePercent)}
          <span className="ml-2 text-[13px] font-sans text-muted">class avg</span>
        </p>
        {hasGrades ? (
          <>
            <div
              className="mt-4 flex h-[84px] items-end gap-2"
              role="img"
              aria-label="Distribution of marks across percentage bands"
            >
              {data.distribution.map((bucket, index) => {
                const height = Math.max(6, (bucket.count / maxBucket) * 84)
                const opacity = index < 2 ? 0.35 : index < 4 ? 0.6 : 1
                return (
                  <i
                    key={bucket.label}
                    className="block flex-1 rounded-t-md bg-accent"
                    style={{ height, opacity }}
                    title={`${bucket.label}: ${bucket.count}`}
                  />
                )
              })}
            </div>
            <div className="mt-2 flex gap-2 text-[11px] text-muted">
              {data.distribution.map((bucket) => (
                <span key={bucket.label} className="flex-1 text-center">
                  {bucket.label}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-meta text-muted">Nothing graded yet.</p>
        )}
      </article>

      <article className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h4 className="text-[13px] font-semibold text-muted">Needs your attention</h4>
        {needsAttention.length === 0 ? (
          <p className="mt-4 text-body text-muted">Everyone is in good shape.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {needsAttention.map((row) => (
              <li key={row.name} className="flex items-baseline justify-between gap-2 text-body">
                <span className="truncate font-medium">{row.name}</span>
                <span className="shrink-0 text-meta text-muted">
                  {row.missing > 0
                    ? `${row.missing} missing`
                    : formatPercent(row.averagePercent)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  )
}
