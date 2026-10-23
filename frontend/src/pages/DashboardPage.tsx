import { CalendarDays } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ClassCard, ClassCardSkeleton } from '@/features/classrooms/ClassCard'
import { CreateClassModal } from '@/features/classrooms/CreateClassModal'
import { JoinClassModal } from '@/features/classrooms/JoinClassModal'
import { useWeekDueCount, WeekStrip } from '@/features/dashboard/WeekStrip'
import { useTeacherReview } from '@/features/dashboard/useTeacherReview'
import { useTodo } from '@/hooks/use-assignments'
import { useClassrooms } from '@/hooks/use-classrooms'
import { useAuth } from '@/lib/auth-context'
import { buildReviewSummary, buildTodoSummary } from '@/lib/todo-summary'

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch, isRefetching } = useClassrooms()
  const isStudent = user?.role === 'STUDENT'
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN'
  const todo = useTodo(isStudent)
  const weekDue = useWeekDueCount()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const canCreate = isTeacher
  const classes = (data?.content ?? []).filter((c) => !c.archived)
  const teaching = classes.filter((c) => c.myRole === 'TEACHER')
  const review = useTeacherReview(teaching, Boolean(isTeacher && !isStudent))
  const firstName = user?.fullName.split(' ')[0] ?? ''

  const summary = useMemo(() => {
    if (isStudent && todo.data) return buildTodoSummary(todo.data)
    if (isTeacher && review.ready) return buildReviewSummary(review.total, weekDue)
    return 'Here is your week at a glance.'
  }, [isStudent, isTeacher, todo.data, review.ready, review.total, weekDue])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-meta font-medium text-muted">{format(new Date(), 'EEEE, d MMMM')}</p>
          <h1 className="mt-1 font-serif text-[34px] font-normal leading-tight tracking-[-0.02em] sm:text-[40px]">
            {greetingForHour(new Date().getHours())}, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-muted">{summary}</p>
        </div>
        <Link
          to="/calendar"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-4 text-body font-semibold text-ink hover:bg-hover"
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          Open calendar
        </Link>
      </div>

      <WeekStrip />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-[26px] font-normal tracking-[-0.015em]">Your notebooks</h2>
        <button
          type="button"
          onClick={() => setJoinOpen(true)}
          className="text-body font-medium text-accent hover:underline"
        >
          Join a class
        </button>
      </div>

      {isLoading && (
        <div role="status" aria-label="Loading classes" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          title="No notebooks yet"
          description={
            canCreate
              ? 'Create a class to get your first notebook, then share the class code with students.'
              : 'Ask your teacher for a class code, then use Join a class to open your first notebook.'
          }
        />
      )}

      {classes.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classroom) => (
            <li key={classroom.id}>
              <ClassCard
                classroom={classroom}
                todoItems={todo.data}
                toReview={classroom.myRole === 'TEACHER' ? review.byClass.get(classroom.id) : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      <CreateClassModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinClassModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  )
}
