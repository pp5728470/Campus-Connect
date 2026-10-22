import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminStats } from '@/hooks/use-admin'
import { formatBytes } from '@/lib/format'

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card className="p-4">
      <p className="text-title font-semibold">{value}</p>
      <p className="text-body">{label}</p>
      {detail && <p className="text-meta text-muted">{detail}</p>}
    </Card>
  )
}

export function AdminStatsCards() {
  const { data, isLoading, isError, refetch, isRefetching } = useAdminStats()

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading statistics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return <ErrorState title="Could not load statistics" onRetry={() => void refetch()} retrying={isRefetching} />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Users"
        value={data.totalUsers.toLocaleString('en-IN')}
        detail={`${data.totalTeachers} teachers, ${data.totalStudents} students, ${data.totalAdmins} admins`}
      />
      <StatCard label="Classes" value={data.totalClasses.toLocaleString('en-IN')} />
      <StatCard label="Submissions" value={data.totalSubmissions.toLocaleString('en-IN')} />
      <StatCard label="Storage used" value={formatBytes(data.storageBytes)} />
    </div>
  )
}
