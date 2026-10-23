import { ArrowLeft, ClipboardList } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileChipList } from '@/components/ui/FileChip'
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

export default function AssignmentDetailPage() {
  const params = useParams()
  const classId = Number(params.classId)
  const assignmentId = Number(params.assignmentId)
  const classroomQuery = useClassroom(classId)
  const assignmentQuery = useAssignment(classId, assignmentId)

  const classroom = classroomQuery.data
  const assignment = assignmentQuery.data

  const backLink = (
    <Link
      to={`/classes/${classId}/classwork`}
      className="inline-flex items-center gap-2 self-start rounded-lg text-body font-medium text-accent hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden={true} />
      Back to classwork
    </Link>
  )

  if (classroomQuery.isLoading || assignmentQuery.isLoading) return <DetailSkeleton />

  if (classroomQuery.isError || assignmentQuery.isError || !classroom || !assignment) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <EmptyState
          icon={ClipboardList}
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
      {backLink}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-col gap-1">
            <p className="text-meta text-muted">
              {classroom.name}
              {assignment.topicName && ` \u00B7 ${assignment.topicName}`}
            </p>
            <h1 className="text-title font-semibold">{assignment.title}</h1>
            <p className="text-meta text-muted">
              {assignment.createdByName} &middot; Posted {timeAgo(assignment.createdAt)}
            </p>
          </div>

          <dl className="flex flex-wrap gap-x-6 gap-y-2 border-y border-border py-3 text-body">
            <div>
              <dt className="text-meta text-muted">Points</dt>
              <dd className="font-medium">{assignment.maxPoints}</dd>
            </div>
            <div>
              <dt className="text-meta text-muted">Due</dt>
              <dd className="font-medium">
                {assignment.dueAt ? formatDateTime(assignment.dueAt) : 'No due date'}
                {assignment.dueAt && <span className="block text-meta font-normal text-muted">{dueLabel(assignment.dueAt)}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-muted">Late work</dt>
              <dd className="font-medium">{assignment.allowLate ? 'Accepted' : 'Not accepted'}</dd>
            </div>
            {!isTeacher && assignment.mySubmissionStatus && (
              <div>
                <dt className="text-meta text-muted">Status</dt>
                <dd>
                  <StatusBadge status={assignment.mySubmissionStatus} />
                </dd>
              </div>
            )}
          </dl>

          {assignment.instructions ? (
            <p className="whitespace-pre-wrap break-words text-body">{assignment.instructions}</p>
          ) : (
            <p className="text-body text-muted">No instructions were added.</p>
          )}

          {assignment.attachments.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-meta font-medium text-muted">Attachments</h2>
              <FileChipList files={assignment.attachments} />
            </div>
          )}
        </div>

        {!isTeacher && (
          <div className="lg:col-span-1">
            <YourWorkPanel assignment={assignment} archived={classroom.archived} />
          </div>
        )}
      </div>

      {isTeacher && <SubmissionsPanel assignment={assignment} archived={classroom.archived} />}
    </div>
  )
}
