import { AdminClassesTable } from '@/features/admin/AdminClassesTable'
import { AdminStatsCards } from '@/features/admin/AdminStatsCards'
import { AdminUsersTable } from '@/features/admin/AdminUsersTable'

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-[34px] font-normal tracking-[-0.02em]">Admin</h1>
        <p className="mt-1 text-body text-muted">Manage accounts and keep an eye on how CampusConnect is used.</p>
      </div>
      <AdminStatsCards />
      <AdminUsersTable />
      <AdminClassesTable />
    </div>
  )
}
