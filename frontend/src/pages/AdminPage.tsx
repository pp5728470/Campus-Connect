import { AdminClassesTable } from '@/features/admin/AdminClassesTable'
import { AdminStatsCards } from '@/features/admin/AdminStatsCards'
import { AdminUsersTable } from '@/features/admin/AdminUsersTable'

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-title font-semibold">Admin</h1>
        <p className="text-body text-muted">Manage accounts and keep an eye on how CampusConnect is used.</p>
      </div>
      <AdminStatsCards />
      <AdminUsersTable />
      <AdminClassesTable />
    </div>
  )
}
