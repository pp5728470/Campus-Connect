import { Bell, CalendarDays, CheckSquare, Home, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTodo } from '@/hooks/use-assignments'
import { useUnreadCount } from '@/hooks/use-notifications'
import { cn } from '@/lib/cn'
import { useAuth } from '@/lib/auth-context'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium',
    isActive ? 'text-accent' : 'text-muted',
  )

/** Phone-width bottom bar: Home, To-do, Calendar, Alerts (students). */
export function MobileBottomNav() {
  const { user } = useAuth()
  const isStudent = user?.role === 'STUDENT'
  const todo = useTodo(isStudent)
  const { data: unread = 0 } = useUnreadCount()
  const todoCount = todo.data?.length ?? 0

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-30 grid h-[70px] grid-cols-4 border-t border-border bg-surface pb-2 sm:hidden"
    >
      <NavLink to="/" end className={linkClass}>
        <Home className="size-5" aria-hidden="true" />
        Home
      </NavLink>
      {isStudent ? (
        <NavLink to="/todo" className={linkClass}>
          <CheckSquare className="size-5" aria-hidden="true" />
          To-do
          {todoCount > 0 && (
            <span className="absolute right-[18%] top-1 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-white">
              {todoCount > 99 ? '99+' : todoCount}
            </span>
          )}
        </NavLink>
      ) : (
        <NavLink to="/profile" className={linkClass}>
          <User className="size-5" aria-hidden="true" />
          Profile
        </NavLink>
      )}
      <NavLink to="/calendar" className={linkClass}>
        <CalendarDays className="size-5" aria-hidden="true" />
        Calendar
      </NavLink>
      <NavLink to="/notifications" className={linkClass}>
        <Bell className="size-5" aria-hidden="true" />
        Alerts
        {unread > 0 && (
          <span className="absolute right-[18%] top-1 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </NavLink>
    </nav>
  )
}
