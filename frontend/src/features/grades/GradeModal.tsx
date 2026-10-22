import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { GradingPanel } from '@/features/assignments/GradingPanel'
import { useAssignment, useSubmissions } from '@/hooks/use-assignments'

export interface GradeTarget {
  assignmentId: number
  studentId: number
}

interface GradeModalProps {
  classId: number
  target: GradeTarget | null
  onClose: () => void
}

/** Opens the existing grading form (marks, feedback, return) for one student's submission. */
export function GradeModal({ classId, target, onClose }: GradeModalProps) {
  const assignmentId = target?.assignmentId ?? NaN
  const assignment = useAssignment(classId, assignmentId)
  const submissions = useSubmissions(classId, assignmentId, target !== null)

  const submission = submissions.data?.submissions.find((row) => row.studentId === target?.studentId)
  const isLoading = assignment.isLoading || submissions.isLoading
  const hasError = assignment.isError || submissions.isError || (!isLoading && (!assignment.data || !submission))

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={assignment.data ? `Grade: ${assignment.data.title}` : 'Grade submission'}
      description={assignment.data ? `Out of ${assignment.data.maxPoints} marks` : undefined}
    >
      {isLoading && (
        <div role="status" aria-label="Loading submission" className="flex flex-col gap-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-16" />
          <Skeleton className="h-10" />
          <Skeleton className="h-24" />
        </div>
      )}

      {!isLoading && hasError && (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-body text-danger">
            Could not load this submission.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              void assignment.refetch()
              void submissions.refetch()
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !hasError && assignment.data && submission && (
        <GradingPanel assignment={assignment.data} submission={submission} />
      )}
    </Modal>
  )
}
