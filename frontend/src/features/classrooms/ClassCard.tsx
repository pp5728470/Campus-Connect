import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { NotebookCover } from '@/components/ui/NotebookCover'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { assignmentsApi } from '@/api/assignments'
import { assignmentKeys } from '@/hooks/use-assignments'
import { dueLabel } from '@/lib/format'
import type { Assignment, Classroom, TodoItem } from '@/types'

function cardSubtitle(classroom: Classroom) {
  return [classroom.section, classroom.subject].filter(Boolean).join(', ') || '\u00A0'
}

const DONE: Set<string> = new Set(['SUBMITTED', 'LATE', 'GRADED', 'RETURNED'])

function progressFromAssignments(assignments: Assignment[]) {
  if (assignments.length === 0) return null
  const completed = assignments.filter((a) => a.mySubmissionStatus && DONE.has(a.mySubmissionStatus)).length
  return { completed, total: assignments.length }
}

function nextLine(
  classroom: Classroom,
  assignments: Assignment[] | undefined,
  todoItems: TodoItem[] | undefined,
  toReview: number | undefined,
): { text: string; alert?: boolean } {
  if (classroom.myRole === 'TEACHER') {
    if (toReview !== undefined && toReview > 0) {
      return {
        text: `${toReview} ${toReview === 1 ? 'submission' : 'submissions'} to review`,
        alert: true,
      }
    }
    const next = (assignments ?? [])
      .filter((a) => a.dueAt && new Date(a.dueAt).getTime() >= Date.now())
      .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())[0]
    if (next) return { text: `${next.title}, ${dueLabel(next.dueAt)}` }
    return { text: 'No upcoming work' }
  }

  const missing = (todoItems ?? []).find(
    (item) => item.classroomId === classroom.id && item.status === 'MISSING',
  )
  if (missing) return { text: `${missing.title} is missing`, alert: true }

  const nextTodo = (todoItems ?? [])
    .filter((item) => item.classroomId === classroom.id && item.status !== 'MISSING')
    .sort((a, b) => {
      if (!a.dueAt) return 1
      if (!b.dueAt) return -1
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    })[0]
  if (nextTodo) return { text: `${nextTodo.title}, ${dueLabel(nextTodo.dueAt)}` }

  const next = (assignments ?? [])
    .filter((a) => a.dueAt && (!a.mySubmissionStatus || a.mySubmissionStatus === 'ASSIGNED'))
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())[0]
  if (next) return { text: `${next.title}, ${dueLabel(next.dueAt)}` }

  return { text: 'All caught up this week' }
}

interface ClassCardProps {
  classroom: Classroom
  todoItems?: TodoItem[]
  /** Ungraded submitted work for teachers; omit when unknown. */
  toReview?: number
}

export function ClassCard({ classroom, todoItems, toReview }: ClassCardProps) {
  const assignmentQuery = useQuery({
    queryKey: assignmentKeys.list(classroom.id),
    queryFn: () => assignmentsApi.list(classroom.id),
  })

  const assignments = assignmentQuery.data?.content
  const progress =
    classroom.myRole === 'STUDENT' && assignments ? progressFromAssignments(assignments) : null
  const next = nextLine(classroom, assignments, todoItems, toReview)

  return (
    <Link
      to={`/classes/${classroom.id}`}
      className="book-lift group block rounded-[6px_12px_12px_6px] text-ink no-underline outline-offset-2"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[6px_12px_12px_6px] border border-border bg-surface shadow-card">
        <NotebookCover
          size="card"
          color={classroom.bannerColor}
          title={classroom.name}
          subtitle={cardSubtitle(classroom)}
          className="min-h-[160px] rounded-none"
        >
          <div className="relative mt-auto flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-meta text-white/90">
              <Avatar name={classroom.ownerName} size="sm" className="ring-1 ring-white/30" />
              <span className="truncate">{classroom.ownerName}</span>
              {classroom.archived && (
                <Badge tone="warning" className="bg-white/95">
                  Archived
                </Badge>
              )}
            </div>
            <p
              className={[
                'm-0 text-[12px] leading-snug',
                next.alert ? 'font-semibold text-white' : 'text-white/88',
              ].join(' ')}
            >
              {next.text}
            </p>
            {progress && (
              <ProgressBar
                onCover
                value={(progress.completed / progress.total) * 100}
                label={`${progress.completed} of ${progress.total} done`}
              />
            )}
          </div>
        </NotebookCover>
      </article>
    </Link>
  )
}

export function ClassCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[6px_12px_12px_6px] border border-border bg-surface shadow-card"
    >
      <Skeleton className="h-[232px] rounded-[6px_12px_12px_6px]" />
    </div>
  )
}
