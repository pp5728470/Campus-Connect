import { format, parseISO } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm'
import { useAuth } from '@/lib/auth-context'

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null

  const rows = [
    { label: 'Full name', value: user.fullName },
    { label: 'Email', value: user.email },
    { label: 'Role', value: user.role === 'TEACHER' ? 'Teacher' : user.role === 'STUDENT' ? 'Student' : 'Admin' },
    { label: 'Member since', value: format(parseISO(user.createdAt), 'd MMMM yyyy') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title font-semibold">Profile</h1>
      <Card className="max-w-2xl">
        <div className="flex items-center gap-4 border-b border-border p-6">
          <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-section font-semibold">{user.fullName}</p>
            <div className="mt-1">
              <Badge tone="accent">{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</Badge>
            </div>
          </div>
        </div>
        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 px-6 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="text-body text-muted">{row.label}</dt>
              <dd className="break-words text-body sm:col-span-2">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <ChangePasswordForm />
    </div>
  )
}
