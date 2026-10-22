import { GraduationCap, LogOut, Menu, User as UserIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { useAuth } from '@/lib/auth-context'

interface TopBarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function TopBar({ onToggleSidebar, sidebarOpen }: TopBarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 py-2">
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
          CampusConnect
        </Link>
      </div>

      {user && (
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
      )}
    </header>
  )
}
