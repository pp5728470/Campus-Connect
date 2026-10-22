import { Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pagination } from '@/components/ui/Pagination'
import { SearchField } from '@/components/ui/SearchField'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { useAdminUsers, useChangeUserRole, useSetUserActive } from '@/hooks/use-admin'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useAuth } from '@/lib/auth-context'
import { getErrorMessage } from '@/lib/errors'
import { timeAgo } from '@/lib/format'
import type { Role, User } from '@/types'

const PAGE_SIZE = 10
const ROLES: Role[] = ['STUDENT', 'TEACHER', 'ADMIN']
const roleLabel = (role: Role) => role.charAt(0) + role.slice(1).toLowerCase()

export function AdminUsersTable() {
  const { user: me } = useAuth()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [page, setPage] = useState(0)
  const q = useDebouncedValue(search.trim())

  const { data, isLoading, isError, refetch, isRefetching } = useAdminUsers({
    q,
    role: role || undefined,
    page,
    size: PAGE_SIZE,
  })
  const setActive = useSetUserActive()
  const changeRole = useChangeUserRole()

  const toggleActive = async (target: User) => {
    try {
      await setActive.mutateAsync({ id: target.id, active: !target.active })
      toast.success(`${target.fullName} ${target.active ? 'deactivated' : 'activated'}`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const updateRole = async (target: User, next: Role) => {
    try {
      await changeRole.mutateAsync({ id: target.id, role: next })
      toast.success(`${target.fullName} is now ${roleLabel(next).toLowerCase()}`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const users = data?.content ?? []

  return (
    <section aria-labelledby="users-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="users-heading" className="text-section font-semibold">
          Users
        </h2>
        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
          <SearchField
            label="Search users"
            placeholder="Search by name or email"
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(0)
            }}
          />
          <Select
            label="Filter by role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as Role | '')
              setPage(0)
            }}
            className="py-2"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading && (
        <Card role="status" aria-label="Loading users" className="flex flex-col gap-3 p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
      )}

      {isError && <ErrorState title="Could not load users" onRetry={() => void refetch()} retrying={isRefetching} />}

      {data && users.length === 0 && (
        <EmptyState icon={Users} title="No users found" description="Try a different search or role filter." />
      )}

      {users.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-body">
            <thead>
              <tr className="border-b border-border text-meta font-medium text-muted">
                <th scope="col" className="px-4 py-3 text-left">User</th>
                <th scope="col" className="px-4 py-3 text-left">Role</th>
                <th scope="col" className="px-4 py-3 text-left">Status</th>
                <th scope="col" className="px-4 py-3 text-left">Joined</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((row) => {
                const isSelf = row.id === me?.id
                return (
                  <tr key={row.id}>
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="block max-w-56 truncate font-medium">{row.fullName}</span>
                      <span className="block max-w-56 truncate text-meta text-muted">{row.email}</span>
                    </th>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Role for ${row.fullName}`}
                        value={row.role}
                        disabled={isSelf || changeRole.isPending}
                        onChange={(event) => void updateRole(row, event.target.value as Role)}
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-body text-ink disabled:text-muted"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={row.active ? 'success' : 'danger'}>{row.active ? 'Active' : 'Deactivated'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{timeAgo(row.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant={row.active ? 'danger' : 'secondary'}
                        size="sm"
                        disabled={isSelf}
                        loading={setActive.isPending && setActive.variables?.id === row.id}
                        onClick={() => void toggleActive(row)}
                        aria-label={`${row.active ? 'Deactivate' : 'Activate'} ${row.fullName}`}
                      >
                        {row.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {data && <Pagination label="User pages" page={page} totalPages={data.totalPages} onChange={setPage} />}
    </section>
  )
}
