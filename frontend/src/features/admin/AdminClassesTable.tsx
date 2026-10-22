import { BookOpen } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pagination } from '@/components/ui/Pagination'
import { SearchField } from '@/components/ui/SearchField'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminClassrooms } from '@/hooks/use-admin'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { timeAgo } from '@/lib/format'

const PAGE_SIZE = 10

export function AdminClassesTable() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const q = useDebouncedValue(search.trim())
  const { data, isLoading, isError, refetch, isRefetching } = useAdminClassrooms(q, page, PAGE_SIZE)
  const classes = data?.content ?? []

  return (
    <section aria-labelledby="classes-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="classes-heading" className="text-section font-semibold">
          Classes
        </h2>
        <SearchField
          label="Search classes"
          placeholder="Search by name or class code"
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(0)
          }}
        />
      </div>

      {isLoading && (
        <Card role="status" aria-label="Loading classes" className="flex flex-col gap-3 p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
      )}

      {isError && <ErrorState title="Could not load classes" onRetry={() => void refetch()} retrying={isRefetching} />}

      {data && classes.length === 0 && (
        <EmptyState icon={BookOpen} title="No classes found" description="Try a different search." />
      )}

      {classes.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-body">
            <thead>
              <tr className="border-b border-border text-meta font-medium text-muted">
                <th scope="col" className="px-4 py-3 text-left">Class</th>
                <th scope="col" className="px-4 py-3 text-left">Code</th>
                <th scope="col" className="px-4 py-3 text-left">Teacher</th>
                <th scope="col" className="px-4 py-3 text-right">Students</th>
                <th scope="col" className="px-4 py-3 text-left">Status</th>
                <th scope="col" className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classes.map((row) => (
                <tr key={row.id}>
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <span className="block max-w-64 truncate font-medium">{row.name}</span>
                    <span className="block max-w-64 truncate text-meta text-muted">
                      {[row.subject, row.section].filter(Boolean).join(' \u00b7 ') || 'No subject'}
                    </span>
                  </th>
                  <td className="px-4 py-3 font-medium">{row.classCode}</td>
                  <td className="px-4 py-3">{row.ownerName}</td>
                  <td className="px-4 py-3 text-right">{row.studentCount}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.archived ? 'neutral' : 'success'}>{row.archived ? 'Archived' : 'Active'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{timeAgo(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {data && <Pagination label="Class pages" page={page} totalPages={data.totalPages} onChange={setPage} />}
    </section>
  )
}
