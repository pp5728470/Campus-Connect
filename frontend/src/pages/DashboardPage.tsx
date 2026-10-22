import { BookOpen, Plus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TodoSection } from '@/features/assignments/TodoSection'
import { ClassCard, ClassCardSkeleton } from '@/features/classrooms/ClassCard'
import { CreateClassModal } from '@/features/classrooms/CreateClassModal'
import { JoinClassModal } from '@/features/classrooms/JoinClassModal'
import { useClassrooms } from '@/hooks/use-classrooms'
import { useAuth } from '@/lib/auth-context'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch, isRefetching } = useClassrooms()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const canCreate = user?.role === 'TEACHER' || user?.role === 'ADMIN'
  const classes = data?.content ?? []

  const actions = (
    <div className="flex gap-2">
      <Button variant={canCreate ? 'secondary' : 'primary'} onClick={() => setJoinOpen(true)}>
        <UserPlus className="size-4" aria-hidden="true" />
        Join class
      </Button>
      {canCreate && (
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Create class
        </Button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold">Your classes</h1>
          <p className="text-body text-muted">Welcome back, {user?.fullName.split(' ')[0]}.</p>
        </div>
        {actions}
      </div>

      {isLoading && (
        <div role="status" aria-label="Loading classes" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ClassCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title="Could not load your classes"
          description="Something went wrong while contacting the server."
          action={
            <Button variant="secondary" loading={isRefetching} onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {data && classes.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No classes yet"
          description={
            canCreate
              ? 'Create your first class, then share the class code with your students.'
              : 'Ask your teacher for a class code and join your first class.'
          }
        />
      )}

      {classes.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classroom) => (
            <li key={classroom.id}>
              <ClassCard classroom={classroom} />
            </li>
          ))}
        </ul>
      )}

      {user?.role === 'STUDENT' && <TodoSection />}

      <CreateClassModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinClassModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  )
}
