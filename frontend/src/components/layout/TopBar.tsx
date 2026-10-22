import { CalendarDays, GraduationCap, LogOut, Menu, Search, ShieldCheck, User as UserIcon } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/cn'
import { ThemeToggle } from './ThemeToggle'

interface TopBarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onOpenSearch: () => void
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-lg p-2 text-body font-medium hover:bg-hover',
    isActive ? 'bg-accent-soft text-accent hover:bg-accent-soft' : 'text-muted hover:text-ink',
  )

export function TopBar({ onToggleSidebar, sidebarOpen, onOpenSearch }: TopBarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2 sm:gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={sidebarOpen}
          aria-controls="app-sidebar"
          className="rounded-lg p-2 text-muted hover:bg-hover hover:text-ink"
        >
          <Menu className="size-6" aria-hidden="true" />
        </button>
        <Link to="/" className="flex items-center gap-2 rounded-lg px-2 py-1 text-section font-semibold">
          <GraduationCap className="size-6 text-accent" aria-hidden="true" />
          <span className="hidden sm:inline">CampusConnect</span>
        </Link>
      </div>

      {user && (
        <>
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search"
            aria-keyshortcuts="Control+K"
            className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-bg p-2 text-body text-muted hover:bg-hover sm:w-64 md:w-80 lg:flex-1 lg:max-w-md"
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="hidden flex-1 truncate text-left sm:inline">Search</span>
            <kbd className="hidden rounded-lg border border-border px-2 text-meta md:inline">Ctrl K</kbd>
          </button>

          <div className="flex items-center gap-1">
            <NavLink to="/calendar" className={navLinkClass} aria-label="Calendar" title="Calendar">
              <CalendarDays className="size-6" aria-hidden="true" />
              <span className="hidden lg:inline">Calendar</span>
            </NavLink>
            {user.role === 'ADMIN' && (
              <NavLink to="/admin" className={navLinkClass} aria-label="Admin" title="Admin">
                <ShieldCheck className="size-6" aria-hidden="true" />
                <span className="hidden lg:inline">Admin</span>
              </NavLink>
            )}
            <NotificationBell />
            <ThemeToggle />
            <Dropdown
              label="Account menu"
              triggerClassName="p-1"
              trigger={<Avatar name={user.fullName} src={user.avatarUrl} />}
              header={
                <div className="min-w-0">
                  <p className="truncate text-body font-medium">{user.fullName}</p>
                  <p className="truncate text-meta text-muted">{user.email}</p>
                </div>
              }
              items={[
                { label: 'Profile', icon: UserIcon, onSelect: () => navigate('/profile') },
                {
                  label: 'Log out',
                  icon: LogOut,
                  onSelect: () => {
                    void logout().then(() => navigate('/login', { replace: true }))
                  },
                },
              ]}
            />
          </div>
        </>
      )}
    </header>
  )
}
