import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FileUploader } from '@/components/ui/FileUploader'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useSaveAssignment } from '@/hooks/use-assignments'
import { useUploadFiles } from '@/hooks/use-files'
import { getErrorMessage } from '@/lib/errors'
import { fromLocalInputValue, toLocalInputValue } from '@/lib/format'
import type { Assignment, FileResponse, Topic } from '@/types'
import { assignmentSchema, type AssignmentValues } from './schemas'

interface AssignmentModalProps {
  open: boolean
  classId: number
  topics: Topic[]
  /** When set, the modal edits this assignment instead of creating one. */
  assignment: Assignment | null
  onClose: () => void
}

function AssignmentForm({ classId, topics, assignment, onClose }: Omit<AssignmentModalProps, 'open'>) {
  const toast = useToast()
  const saveAssignment = useSaveAssignment(classId)
  const uploadFiles = useUploadFiles(classId)
  const [files, setFiles] = useState<File[]>([])
  const [keptFiles, setKeptFiles] = useState<FileResponse[]>(assignment?.attachments ?? [])
  const [progress, setProgress] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignmentValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: assignment?.title ?? '',
      instructions: assignment?.instructions ?? '',
      topicId: assignment?.topicId ? String(assignment.topicId) : '',
      maxPoints: String(assignment?.maxPoints ?? 100),
      dueAt: assignment?.dueAt ? toLocalInputValue(assignment.dueAt) : '',
      allowLate: assignment?.allowLate ?? true,
    },
  })

  const busy = progress !== null || saveAssignment.isPending

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      // Upload new files first, then reference every kept and new file by id.
      let uploadedIds: number[] = []
      if (files.length > 0) {
        setProgress(0)
        const uploaded = await uploadFiles.mutateAsync({ files, onProgress: setProgress })
        uploadedIds = uploaded.map((file) => file.id)
      }
      await saveAssignment.mutateAsync({
        id: assignment?.id,
        payload: {
          title: values.title,
          instructions: values.instructions || undefined,
          topicId: values.topicId ? Number(values.topicId) : null,
          maxPoints: Number(values.maxPoints),
          dueAt: values.dueAt ? fromLocalInputValue(values.dueAt) : null,
          allowLate: values.allowLate,
          fileIds: [...keptFiles.map((file) => file.id), ...uploadedIds],
        },
      })
      toast.success(assignment ? 'Assignment updated' : 'Assignment created')
      onClose()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setProgress(null)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded-lg border border-border px-3 py-2 text-body text-danger">
          {formError}
        </p>
      )}
      <Input label="Title" placeholder="Lab 3 - REST API with Spring Boot" error={errors.title?.message} {...register('title')} />
      <Textarea label="Instructions" rows={4} error={errors.instructions?.message} {...register('instructions')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Topic" {...register('topicId')}>
          <option value="">No topic</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </Select>
        <Input
          label="Max points"
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          error={errors.maxPoints?.message}
          {...register('maxPoints')}
        />
      </div>

      <Input label="Due date and time" type="datetime-local" hint="Leave empty for no due date." {...register('dueAt')} />

      <label className="flex items-center gap-2 text-body">
        <input type="checkbox" className="size-4 accent-accent" {...register('allowLate')} />
        Allow late submissions
      </label>

      <FileUploader
        label="Attachments"
        files={files}
        onChange={setFiles}
        existing={keptFiles}
        onRemoveExisting={(file) => setKeptFiles((current) => current.filter((item) => item.id !== file.id))}
        progress={progress}
        disabled={busy}
      />

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {assignment ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

export function AssignmentModal({ open, classId, topics, assignment, onClose }: AssignmentModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={assignment ? 'Edit assignment' : 'Create assignment'}>
      <AssignmentForm classId={classId} topics={topics} assignment={assignment} onClose={onClose} />
    </Modal>
  )
}
