import { Home } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Skeleton } from '@/components/ui/Skeleton'
import { useClassrooms } from '@/hooks/use-classrooms'
import { cn } from '@/lib/cn'
import type { Classroom } from '@/types'

interface SidebarProps {
  open: boolean
  /** Called after a link is followed, so the mobile drawer can close. */
  onNavigate: () => void
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-body',
    isActive ? 'bg-accent-soft font-medium text-accent' : 'text-ink hover:bg-hover',
  )

function ClassLinks({ title, classes, onNavigate }: { title: string; classes: Classroom[]; onNavigate: () => void }) {
  if (classes.length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      <h2 className="px-3 text-meta font-medium text-muted">{title}</h2>
      <ul className="flex flex-col gap-1">
        {classes.map((classroom) => (
          <li key={classroom.id}>
            <NavLink to={`/classes/${classroom.id}`} onClick={onNavigate} className={linkClass}>
              <span
                aria-hidden="true"
                className="size-4 shrink-0 rounded-full"
                style={{ backgroundColor: classroom.bannerColor }}
              />
              <span className="truncate">{classroom.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { data, isLoading, isError, refetch } = useClassrooms()
  const classes = (data?.content ?? []).filter((classroom) => !classroom.archived)

  return (
    <aside
      id="app-sidebar"
      aria-label="Classes"
      className={cn(
        'z-20 w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-surface p-3',
        // Drawer on small screens, in-flow column on large screens.
        'fixed inset-y-0 left-0 top-14 lg:static',
        open ? 'flex' : 'hidden',
      )}
    >
      <NavLink to="/" end onClick={onNavigate} className={linkClass}>
        <Home className="size-4" aria-hidden="true" />
        Dashboard
      </NavLink>

      {isLoading && (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading classes">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      )}

      {isError && (
        <p className="px-3 text-meta text-muted">
          Could not load classes.{' '}
          <button type="button" onClick={() => void refetch()} className="font-medium text-accent hover:underline">
            Retry
          </button>
        </p>
      )}

      {data && classes.length === 0 && <p className="px-3 text-meta text-muted">No classes yet.</p>}

      {data && (
        <>
          <ClassLinks
            title="Teaching"
            classes={classes.filter((c) => c.myRole === 'TEACHER')}
            onNavigate={onNavigate}
          />
          <ClassLinks
            title="Enrolled"
            classes={classes.filter((c) => c.myRole === 'STUDENT')}
            onNavigate={onNavigate}
          />
        </>
      )}
    </aside>
  )
}
