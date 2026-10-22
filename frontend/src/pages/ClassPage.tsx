import { BookOpen } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { ClassBanner, ClassBannerSkeleton } from '@/features/classrooms/ClassBanner'
import { GradesTab } from '@/features/grades/GradesTab'
import { ClassworkTab } from '@/features/classwork/ClassworkTab'
import { MaterialsTab } from '@/features/materials/MaterialsTab'
import { StreamTab } from '@/features/stream/StreamTab'
import { PeopleTab } from '@/features/classrooms/PeopleTab'
import { useClassroom } from '@/hooks/use-classrooms'
import { useAuth } from '@/lib/auth-context'

const TABS: TabItem[] = [
  { id: 'stream', label: 'Stream' },
  { id: 'classwork', label: 'Classwork' },
  { id: 'materials', label: 'Materials' },
  { id: 'people', label: 'People' },
  { id: 'grades', label: 'Grades' },
]

export default function ClassPage() {
  const { id, tab } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const classId = Number(id)
  const { data: classroom, isLoading, isError, refetch } = useClassroom(classId)

  if (tab && !TABS.some((item) => item.id === tab)) return <Navigate to={`/classes/${id}`} replace />
  const activeTab = tab ?? 'stream'

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <ClassBannerSkeleton />
      </div>
    )
  }

  if (isError || !classroom || !user) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Class not found"
        description="It may have been archived, or you may not be a member of this class."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
            <Link
              to="/"
              className="inline-flex items-center rounded-lg border border-accent bg-accent px-4 py-2 text-body font-medium text-white hover:bg-accent-hover"
            >
              Back to dashboard
            </Link>
          </div>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ClassBanner classroom={classroom} />
      <Tabs
        label="Class sections"
        idPrefix="class"
        items={TABS}
        value={activeTab}
        onChange={(next) => navigate(`/classes/${classroom.id}/${next}`)}
      />
      <div id="class-panel" role="tabpanel" aria-labelledby={`class-tab-${activeTab}`} tabIndex={0}>
        {activeTab === 'stream' && <StreamTab classroom={classroom} currentUserId={user.id} />}
        {activeTab === 'classwork' && <ClassworkTab classroom={classroom} />}
        {activeTab === 'materials' && <MaterialsTab classroom={classroom} />}
        {activeTab === 'people' && <PeopleTab classroom={classroom} currentUserId={user.id} />}
        {activeTab === 'grades' && <GradesTab classroom={classroom} />}
      </div>
    </div>
  )
}

