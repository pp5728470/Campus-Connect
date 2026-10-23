import { LogOut, Menu, Plus, Search, User as UserIcon, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { CreateClassModal } from '@/features/classrooms/CreateClassModal'
import { JoinClassModal } from '@/features/classrooms/JoinClassModal'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { useAuth } from '@/lib/auth-context'
import { ThemeToggle } from './ThemeToggle'

interface TopBarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onOpenSearch: () => void
}

export function TopBar({ onToggleSidebar, sidebarOpen, onOpenSearch }: TopBarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [joinOpen, setJoinOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const canCreate = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:gap-4 sm:px-5">
        <div className="flex items-center gap-1 sm:w-[212px] sm:gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
            aria-controls="app-sidebar"
            className="hidden rounded-lg p-2 text-muted hover:bg-hover hover:text-ink lg:inline-flex"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em] text-ink no-underline"
          >
            <span className="notebook-mark" aria-hidden="true" />
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
              className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-border bg-surface-2 px-3.5 text-body text-muted hover:bg-hover lg:max-w-[520px]"
            >
              <Search className="size-[18px] shrink-0" aria-hidden="true" />
              <span className="hidden flex-1 truncate text-left sm:inline">
                Search classes, assignments, materials
              </span>
              <kbd className="hidden shrink-0 rounded border border-border-strong bg-surface px-1.5 text-[11px] font-semibold text-muted md:inline">
                Ctrl K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => (canCreate ? setCreateOpen(true) : setJoinOpen(true))}
                aria-label={canCreate ? 'Create or join a class' : 'Join a class'}
                className="rounded-lg p-2 text-muted hover:bg-hover hover:text-ink"
              >
                {canCreate ? (
                  <Plus className="size-5" aria-hidden="true" />
                ) : (
                  <UserPlus className="size-5" aria-hidden="true" />
                )}
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setJoinOpen(true)}
                  aria-label="Join a class"
                  className="hidden rounded-lg p-2 text-muted hover:bg-hover hover:text-ink sm:inline-flex"
                >
                  <UserPlus className="size-5" aria-hidden="true" />
                </button>
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

      <JoinClassModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      {canCreate && <CreateClassModal open={createOpen} onClose={() => setCreateOpen(false)} />}
    </>
  )
}
