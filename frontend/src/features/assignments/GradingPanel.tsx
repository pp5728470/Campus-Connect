import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FileChipList } from '@/components/ui/FileChip'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useGradeSubmission } from '@/hooks/use-assignments'
import { getErrorMessage } from '@/lib/errors'
import { timeAgo } from '@/lib/format'
import type { Assignment, Submission } from '@/types'
import { gradeSchema, type GradeValues } from './schemas'

interface GradingPanelProps {
  assignment: Assignment
  submission: Submission
}

function GradeForm({ assignment, submission }: GradingPanelProps) {
  const toast = useToast()
  const gradeSubmission = useGradeSubmission(assignment.classroomId, assignment.id)
  const schema = useMemo(() => gradeSchema(assignment.maxPoints), [assignment.maxPoints])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GradeValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      grade: submission.grade !== null ? String(submission.grade) : '',
      feedback: submission.feedback ?? '',
      // Graded-but-held work stays held until the teacher chooses to return it.
      returnWork: submission.status !== 'GRADED',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await gradeSubmission.mutateAsync({
        studentId: submission.studentId,
        payload: {
          grade: Number(values.grade),
          feedback: values.feedback || undefined,
          returnWork: values.returnWork,
        },
      })
      toast.success(values.returnWork ? 'Grade saved and returned' : 'Grade saved')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label={`Marks (out of ${assignment.maxPoints})`}
        type="number"
        inputMode="decimal"
        step="any"
        min={0}
        max={assignment.maxPoints}
        error={errors.grade?.message}
        {...register('grade')}
      />
      <Textarea label="Feedback" rows={4} error={errors.feedback?.message} {...register('feedback')} />
      <label className="flex items-center gap-2 text-body">
        <input type="checkbox" className="size-4 accent-accent" {...register('returnWork')} />
        Return to student
      </label>
      <div>
        <Button type="submit" loading={gradeSubmission.isPending}>
          Save grade
        </Button>
      </div>
    </form>
  )
}

export function GradingPanel({ assignment, submission }: GradingPanelProps) {
  const hasWork = submission.submittedAt !== null

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-section font-semibold">{submission.studentName}</h3>
          <p className="truncate text-meta text-muted">{submission.studentEmail}</p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      {hasWork ? (
        <div className="flex flex-col gap-3">
          {submission.submittedAt && (
            <p className="text-meta text-muted">Turned in {timeAgo(submission.submittedAt)}</p>
          )}
          {submission.textAnswer && <p className="whitespace-pre-wrap break-words text-body">{submission.textAnswer}</p>}
          <FileChipList files={submission.files} className="sm:grid-cols-1" />
          {!submission.textAnswer && submission.files.length === 0 && (
            <p className="text-body text-muted">Nothing attached.</p>
          )}
        </div>
      ) : (
        <p className="text-body text-muted">This student has not turned in any work.</p>
      )}

      <div className="border-t border-border pt-4">
        {/* Re-key so the form resets when another student or a fresh grade is shown. */}
        <GradeForm key={`${submission.studentId}-${submission.gradedAt ?? 'none'}`} assignment={assignment} submission={submission} />
      </div>
    </Card>
  )
}
