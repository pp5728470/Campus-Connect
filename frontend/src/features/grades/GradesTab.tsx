import { lazy, Suspense, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import type { Classroom } from '@/types'
import { GradebookTable } from './GradebookTable'
import { StudentGradesView } from './StudentGradesView'

// Charts pull in Recharts, so they load only when the Analytics view is opened.
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel').then((m) => ({ default: m.AnalyticsPanel })))

const TEACHER_VIEWS: TabItem[] = [
  { id: 'gradebook', label: 'Gradebook' },
  { id: 'analytics', label: 'Analytics' },
]

export function GradesTab({ classroom }: { classroom: Classroom }) {
  const [view, setView] = useState('gradebook')

  if (classroom.myRole !== 'TEACHER') return <StudentGradesView classroom={classroom} />

  return (
    <div className="flex flex-col gap-4">
      <Tabs label="Grades views" idPrefix="grades" items={TEACHER_VIEWS} value={view} onChange={setView} />
      <div id="grades-panel" role="tabpanel" aria-labelledby={`grades-tab-${view}`}>
        {view === 'gradebook' ? (
          <GradebookTable classroom={classroom} />
        ) : (
          <Suspense fallback={<Skeleton role="status" aria-label="Loading analytics" className="h-64" />}>
            <AnalyticsPanel classroom={classroom} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
