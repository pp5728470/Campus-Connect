import { ChevronRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileChipList } from '@/components/ui/FileChip'
import { NotebookCover } from '@/components/ui/NotebookCover'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SubmissionsPanel } from '@/features/assignments/SubmissionsPanel'
import { YourWorkPanel } from '@/features/assignments/YourWorkPanel'
import { useAssignment } from '@/hooks/use-assignments'
import { useClassroom } from '@/hooks/use-classrooms'
import { dueLabel, formatDateTime, timeAgo } from '@/lib/format'

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading assignment" className="flex flex-col gap-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-1/2" />
      <Card className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    </div>
  )
}

/** Renders instructions with numbered steps when the text has line breaks starting with digits or as a plain paragraph. */
function Instructions({ text }: { text: string }) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  const looksNumbered = lines.length > 1 && lines.every((line) => /^\d+[.)]\s/.test(line) || /^- /.test(line))
  if (!looksNumbered) {
    return <p className="whitespace-pre-wrap break-words text-body leading-relaxed">{text}</p>
  }
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {lines.map((line, index) => {
        const cleaned = line.replace(/^\d+[.)]\s*/, '').replace(/^- /, '')
        return (
          <li key={index} className="flex gap-3 text-body leading-relaxed">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-meta font-semibold text-accent"
            >
              {index + 1}
            </span>
            <span className="pt-0.5">{cleaned}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default function AssignmentDetailPage() {
  const params = useParams()
  const classId = Number(params.classId)
  const assignmentId = Number(params.assignmentId)
  const classroomQuery = useClassroom(classId)
  const assignmentQuery = useAssignment(classId, assignmentId)

  const classroom = classroomQuery.data
  const assignment = assignmentQuery.data

  if (classroomQuery.isLoading || assignmentQuery.isLoading) return <DetailSkeleton />

  if (classroomQuery.isError || assignmentQuery.isError || !classroom || !assignment) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          to={`/classes/${classId}/classwork`}
          className="inline-flex items-center gap-2 self-start text-body font-medium text-accent hover:underline"
        >
          Back to classwork
        </Link>
        <EmptyState
          title="Assignment not found"
          description="It may have been deleted, or you may not be a member of this class."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                void classroomQuery.refetch()
                void assignmentQuery.refetch()
              }}
            >
              Try again
            </Button>
          }
        />
      </div>
    )
  }

  const isTeacher = classroom.myRole === 'TEACHER'

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-2 text-[13px] text-muted" aria-label="Breadcrumb">
        <Link to={`/classes/${classId}`} className="text-accent hover:underline">
          {classroom.name}
        </Link>
        <ChevronRight className="size-4" aria-hidden="true" />
        <Link to={`/classes/${classId}/classwork`} className="text-accent hover:underline">
          Classwork
        </Link>
        <ChevronRight className="size-4" aria-hidden="true" />
        <span className="text-ink">{assignment.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0">
          <div className="flex gap-4">
            <span aria-hidden="true" className="shrink-0">
              <NotebookCover
                size="icon"
                color={classroom.bannerColor}
                showLabel={false}
                ribbon={false}
                corner={false}
              />
            </span>
            <div className="min-w-0">
              <h1 className="font-serif text-[28px] font-normal leading-tight tracking-[-0.02em] sm:text-[34px]">
                {assignment.title}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
                <span>{assignment.createdByName}</span>
                <span>Posted {timeAgo(assignment.createdAt)}</span>
                <span>
                  <strong className="font-semibold text-ink">{assignment.maxPoints}</strong> points
                </span>
                {assignment.dueAt && (
                  <span className="inline-flex items-center rounded-full border border-warn/30 bg-warn-soft px-2.5 py-0.5 text-meta font-semibold text-warn">
                    {dueLabel(assignment.dueAt)}
                  </span>
                )}
                {!isTeacher && assignment.mySubmissionStatus && (
                  <StatusBadge status={assignment.mySubmissionStatus} />
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 max-w-[66ch] border-t border-border pt-6">
            {assignment.instructions ? (
              <Instructions text={assignment.instructions} />
            ) : (
              <p className="text-body text-muted">No instructions were added.</p>
            )}

            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-body">
              <div>
                <dt className="text-meta text-muted">Due</dt>
                <dd className="font-medium">
                  {assignment.dueAt ? formatDateTime(assignment.dueAt) : 'No due date'}
                </dd>
              </div>
              <div>
                <dt className="text-meta text-muted">Late work</dt>
                <dd className="font-medium">{assignment.allowLate ? 'Accepted' : 'Not accepted'}</dd>
              </div>
              {assignment.topicName && (
                <div>
                  <dt className="text-meta text-muted">Topic</dt>
                  <dd className="font-medium">{assignment.topicName}</dd>
                </div>
              )}
            </dl>

            {assignment.attachments.length > 0 && (
              <div className="mt-6 flex flex-col gap-2">
                <h2 className="font-serif text-[22px] font-normal">Handouts</h2>
                <FileChipList files={assignment.attachments} />
              </div>
            )}
          </div>
        </div>

        {!isTeacher && (
          <div className="lg:sticky lg:top-4">
            <YourWorkPanel assignment={assignment} archived={classroom.archived} />
          </div>
        )}
      </div>

      {isTeacher && <SubmissionsPanel assignment={assignment} archived={classroom.archived} />}
    </div>
  )
}
