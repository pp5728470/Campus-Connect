import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileChipList } from '@/components/ui/FileChip'
import { FileUploader } from '@/components/ui/FileUploader'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useMySubmission, useSubmitWork, useUnsubmitWork } from '@/hooks/use-assignments'
import { useUploadFiles } from '@/hooks/use-files'
import { getErrorMessage } from '@/lib/errors'
import { timeAgo } from '@/lib/format'
import type { Assignment, FileResponse, Submission } from '@/types'

interface YourWorkPanelProps {
  assignment: Assignment
  archived?: boolean
}

function SubmissionForm({ assignment, submission }: { assignment: Assignment; submission: Submission }) {
  const toast = useToast()
  const submitWork = useSubmitWork(assignment.classroomId, assignment.id)
  const uploadFiles = useUploadFiles(assignment.classroomId)
  const [text, setText] = useState(submission.textAnswer ?? '')
  const [files, setFiles] = useState<File[]>([])
  const [keptFiles, setKeptFiles] = useState<FileResponse[]>(submission.files)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = progress !== null || submitWork.isPending
  const closed = submission.status === 'MISSING' && !assignment.allowLate
  const isLate = submission.status === 'MISSING'

  const submit = async () => {
    if (!text.trim() && files.length === 0 && keptFiles.length === 0) {
      setError('Add text or at least one file before turning in.')
      return
    }
    setError(null)
    try {
      let uploadedIds: number[] = []
      if (files.length > 0) {
        setProgress(0)
        const uploaded = await uploadFiles.mutateAsync({ files, onProgress: setProgress })
        uploadedIds = uploaded.map((file) => file.id)
      }
      await submitWork.mutateAsync({
        textAnswer: text.trim() || undefined,
        fileIds: [...keptFiles.map((file) => file.id), ...uploadedIds],
      })
      toast.success(isLate ? 'Turned in late' : 'Work turned in')
      setFiles([])
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setProgress(null)
    }
  }

  if (closed) {
    return <p className="text-body text-danger">This assignment is past due and no longer accepts late work.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label="Your answer"
        rows={4}
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={4000}
        disabled={busy}
        error={error ?? undefined}
      />
      <FileUploader
        label="Your files"
        files={files}
        onChange={setFiles}
        existing={keptFiles}
        onRemoveExisting={(file) => setKeptFiles((current) => current.filter((item) => item.id !== file.id))}
        progress={progress}
        disabled={busy}
      />
      <Button loading={busy} onClick={() => void submit()}>
        {isLate ? 'Turn in late' : 'Turn in'}
      </Button>
    </div>
  )
}

function SubmittedWork({ submission }: { submission: Submission }) {
  return (
    <div className="flex flex-col gap-3">
      {submission.textAnswer && (
        <div>
          <p className="text-meta font-medium text-muted">Your answer</p>
          <p className="whitespace-pre-wrap break-words text-body">{submission.textAnswer}</p>
        </div>
      )}
      <FileChipList files={submission.files} className="sm:grid-cols-1" />
    </div>
  )
}

export function YourWorkPanel({ assignment, archived = false }: YourWorkPanelProps) {
  const toast = useToast()
  const { data: submission, isLoading, isError, refetch } = useMySubmission(
    assignment.classroomId,
    assignment.id,
    true,
  )
  const unsubmit = useUnsubmitWork(assignment.classroomId, assignment.id)

  const handleUnsubmit = async () => {
    try {
      await unsubmit.mutateAsync()
      toast.success('Work unsubmitted')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  let body
  if (isLoading) {
    body = (
      <div role="status" aria-label="Loading your work" className="flex flex-col gap-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    )
  } else if (isError || !submission) {
    body = (
      <EmptyState
        title="Could not load your work"
        description="Something went wrong while contacting the server."
        action={
          <Button variant="secondary" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    )
  } else {
    const graded = submission.status === 'GRADED' || submission.status === 'RETURNED'
    const turnedIn = submission.status === 'SUBMITTED' || submission.status === 'LATE'
    body = (
      <>
        {graded && (
          <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <p className="text-meta font-medium text-muted">Grade</p>
            <p className="text-section font-semibold">
              {submission.grade ?? '-'} <span className="text-body font-normal text-muted">/ {assignment.maxPoints}</span>
            </p>
            {submission.feedback && (
              <div>
                <p className="text-meta font-medium text-muted">Feedback from {submission.gradedByName ?? 'your teacher'}</p>
                <p className="whitespace-pre-wrap break-words text-body">{submission.feedback}</p>
              </div>
            )}
            {submission.gradedAt && <p className="text-meta text-muted">Graded {timeAgo(submission.gradedAt)}</p>}
          </div>
        )}

        {(graded || turnedIn) && <SubmittedWork submission={submission} />}

        {turnedIn && (
          <div className="flex flex-col gap-2">
            {submission.submittedAt && (
              <p className="text-meta text-muted">Turned in {timeAgo(submission.submittedAt)}</p>
            )}
            {!archived && (
              <div>
                <Button variant="secondary" loading={unsubmit.isPending} onClick={() => void handleUnsubmit()}>
                  Unsubmit
                </Button>
              </div>
            )}
          </div>
        )}

        {!graded && !turnedIn && (
          archived ? (
            <p className="text-body text-muted">This class is archived. Submissions are closed.</p>
          ) : (
            // Re-key so the form picks up files kept after an unsubmit.
            <SubmissionForm key={`${submission.id}-${submission.status}`} assignment={assignment} submission={submission} />
          )
        )}
      </>
    )
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-section font-semibold">Your work</h2>
        {submission && <StatusBadge status={submission.status} />}
      </div>
      {body}
    </Card>
  )
}
