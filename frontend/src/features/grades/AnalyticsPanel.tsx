import { BarChart3 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useClassAnalytics } from '@/hooks/use-grades'
import { formatPercent } from '@/lib/format'
import type { Classroom } from '@/types'

// Chart colors come from the same CSS variables as the rest of the UI, so they follow the theme.
const AXIS_TICK = { fill: 'var(--color-muted)', fontSize: 12 }
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  color: 'var(--color-ink)',
  fontSize: 12,
}
const CURSOR = { fill: 'var(--color-hover)' }
const ROW_HEIGHT = 40

function truncate(text: string, max = 22) {
  return text.length > max ? `${text.slice(0, max - 1)}...` : text
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-title font-semibold">{value}</p>
      <p className="text-meta text-muted">{label}</p>
    </Card>
  )
}

function AnalyticsSkeleton() {
  return (
    <div role="status" aria-label="Loading analytics" className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  )
}

/** Teacher analytics: submission rate per assignment and the spread of marks. */
export function AnalyticsPanel({ classroom }: { classroom: Classroom }) {
  const { data, isLoading, isError, refetch, isRefetching } = useClassAnalytics(classroom.id)

  if (isLoading) return <AnalyticsSkeleton />
  if (isError || !data) {
    return <ErrorState title="Could not load analytics" onRetry={() => void refetch()} retrying={isRefetching} />
  }

  if (data.assignmentCount === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics yet"
        description="Charts appear once this class has assignments and students."
      />
    )
  }

  const rates = data.assignments.map((assignment) => ({
    name: truncate(assignment.title),
    title: assignment.title,
    rate: Math.round(assignment.submissionRate * 10) / 10,
  }))
  const hasGrades = data.distribution.some((bucket) => bucket.count > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Students" value={String(data.studentCount)} />
        <Stat label="Assignments" value={String(data.assignmentCount)} />
        <Stat label="Class average" value={formatPercent(data.classAveragePercent)} />
      </div>

      <section aria-labelledby="rate-heading" className="flex flex-col gap-2">
        <h2 id="rate-heading" className="text-section font-semibold">
          Submission rate
        </h2>
        <Card className="p-4">
          <div role="img" aria-label="Bar chart of the percentage of students who submitted each assignment">
            <ResponsiveContainer width="100%" height={Math.max(160, rates.length * ROW_HEIGHT + 32)}>
              <BarChart data={rates} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  tick={AXIS_TICK}
                  stroke="var(--color-border)"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={AXIS_TICK}
                  stroke="var(--color-border)"
                  interval={0}
                />
                <Tooltip
                  cursor={CURSOR}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [`${value}%`, 'Submitted']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.title ?? ''}
                />
                <Bar dataKey="rate" fill="var(--color-accent)" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section aria-labelledby="distribution-heading" className="flex flex-col gap-2">
        <h2 id="distribution-heading" className="text-section font-semibold">
          Grade distribution
        </h2>
        {hasGrades ? (
          <Card className="p-4">
            <div role="img" aria-label="Bar chart of how many graded submissions fall in each percentage range">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.distribution} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={AXIS_TICK} stroke="var(--color-border)" />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} stroke="var(--color-border)" width={32} />
                  <Tooltip
                    cursor={CURSOR}
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => [value, 'Submissions']}
                  />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : (
          <EmptyState title="Nothing graded yet" description="The distribution appears after the first marks are saved." />
        )}
      </section>

      <section aria-labelledby="breakdown-heading" className="flex flex-col gap-2">
        <h2 id="breakdown-heading" className="text-section font-semibold">
          Assignment breakdown
        </h2>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-body">
            <thead>
              <tr className="border-b border-border text-meta font-medium text-muted">
                <th scope="col" className="px-4 py-3 text-left">Assignment</th>
                <th scope="col" className="px-4 py-3 text-right">Submitted</th>
                <th scope="col" className="px-4 py-3 text-right">Graded</th>
                <th scope="col" className="px-4 py-3 text-right">Missing</th>
                <th scope="col" className="px-4 py-3 text-right">Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.assignments.map((assignment) => (
                <tr key={assignment.assignmentId}>
                  <th scope="row" className="max-w-64 truncate px-4 py-3 text-left font-medium">
                    {assignment.title}
                  </th>
                  <td className="px-4 py-3 text-right">
                    {assignment.submitted} / {assignment.totalStudents}
                  </td>
                  <td className="px-4 py-3 text-right">{assignment.graded}</td>
                  <td className="px-4 py-3 text-right">{assignment.missing}</td>
                  <td className="px-4 py-3 text-right">{formatPercent(assignment.averagePercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  )
}
