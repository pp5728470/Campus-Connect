import { Bell, CalendarDays, CheckSquare, Home, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTodo } from '@/hooks/use-assignments'
import { useClassrooms } from '@/hooks/use-classrooms'
import { useUnreadCount } from '@/hooks/use-notifications'
import { resolveCoverColor } from '@/lib/covers'
import { cn } from '@/lib/cn'
import { useAuth } from '@/lib/auth-context'
import type { Classroom } from '@/types'

interface SidebarProps {
  open: boolean
  onNavigate: () => void
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex h-10 items-center gap-3 rounded-lg px-3 text-body font-medium',
    isActive ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-surface-2',
  )

function ClassLinks({
  title,
  classes,
  onNavigate,
}: {
  title: string
  classes: Classroom[]
  onNavigate: () => void
}) {
  if (classes.length === 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      <h2 className="px-3 pb-2 pt-5 text-meta font-semibold text-muted">{title}</h2>
      <ul className="flex flex-col gap-0.5">
        {classes.map((classroom) => (
          <li key={classroom.id}>
            <NavLink to={`/classes/${classroom.id}`} onClick={onNavigate} className={linkClass}>
              <span
                aria-hidden="true"
                className="inline-block h-8 w-2.5 shrink-0 rounded-[2px_4px_4px_2px] shadow-[inset_3px_0_0_rgba(0,0,0,0.25)]"
                style={{ backgroundColor: resolveCoverColor(classroom.bannerColor) }}
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
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useClassrooms()
  const todo = useTodo(user?.role === 'STUDENT')
  const { data: unread = 0 } = useUnreadCount()
  const classes = (data?.content ?? []).filter((classroom) => !classroom.archived)
  const todoCount = todo.data?.length ?? 0

  return (
    <aside
      id="app-sidebar"
      aria-label="Main"
      className={cn(
        'z-20 w-[248px] shrink-0 flex-col overflow-y-auto border-r border-border bg-surface px-3 py-4',
        'fixed inset-y-0 left-0 top-[60px] hidden lg:flex lg:static lg:top-0',
        open ? 'lg:flex' : 'lg:hidden',
      )}
    >
      <NavLink to="/" end onClick={onNavigate} className={linkClass}>
        <Home className="size-[18px]" aria-hidden="true" />
        Home
      </NavLink>
      <NavLink to="/calendar" onClick={onNavigate} className={linkClass}>
        <CalendarDays className="size-[18px]" aria-hidden="true" />
        Calendar
      </NavLink>
      {user?.role === 'STUDENT' && (
        <NavLink to="/todo" onClick={onNavigate} className={linkClass}>
          <CheckSquare className="size-[18px]" aria-hidden="true" />
          To-do
          {todoCount > 0 && (
            <span className="ml-auto text-meta font-medium text-muted">{todoCount}</span>
          )}
        </NavLink>
      )}
      <NavLink to="/notifications" onClick={onNavigate} className={linkClass}>
        <Bell className="size-[18px]" aria-hidden="true" />
        Notifications
        {unread > 0 && <span className="ml-auto text-meta font-medium text-muted">{unread}</span>}
      </NavLink>

      {isLoading && (
        <div className="mt-4 flex flex-col gap-2" role="status" aria-label="Loading classes">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-4 px-3 text-meta text-muted">
          Could not load classes.{' '}
          <button type="button" onClick={() => void refetch()} className="font-medium text-accent hover:underline">
            Retry
          </button>
        </p>
      )}

      {data && classes.length === 0 && <p className="mt-4 px-3 text-meta text-muted">No classes yet.</p>}

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

      <div className="mt-auto pt-4">
        <NavLink to="/profile" onClick={onNavigate} className={linkClass}>
          <Settings className="size-[18px]" aria-hidden="true" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
