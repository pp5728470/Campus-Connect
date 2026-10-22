import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Classroom } from '@/types'

export function ClassCard({ classroom }: { classroom: Classroom }) {
  return (
    <Link
      to={`/classes/${classroom.id}`}
      className="block rounded-lg transition-colors hover:[&>div]:border-muted"
    >
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-col gap-1 p-4 text-white" style={{ backgroundColor: classroom.bannerColor }}>
          <h2 className="truncate text-section font-semibold">{classroom.name}</h2>
          <p className="truncate text-body">{classroom.section ?? classroom.subject ?? '\u00A0'}</p>
        </div>
        <div className="flex flex-1 items-end justify-between gap-2 p-4">
          <div className="min-w-0">
            <p className="truncate text-body font-medium">{classroom.ownerName}</p>
            <p className="text-meta text-muted">{classroom.myRole === 'TEACHER' ? 'Teaching' : 'Enrolled'}</p>
          </div>
          {classroom.archived && <Badge tone="warning">Archived</Badge>}
        </div>
      </Card>
    </Link>
  )
}

export function ClassCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-16 rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </Card>
  )
}
