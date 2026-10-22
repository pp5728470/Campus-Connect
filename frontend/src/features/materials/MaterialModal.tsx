import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FileUploader } from '@/components/ui/FileUploader'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useUploadFiles } from '@/hooks/use-files'
import { useCreateMaterial } from '@/hooks/use-materials'
import { getErrorMessage } from '@/lib/errors'
import type { Topic } from '@/types'

interface MaterialModalProps {
  open: boolean
  classId: number
  topics: Topic[]
  onClose: () => void
}

function MaterialForm({ classId, topics, onClose }: Omit<MaterialModalProps, 'open'>) {
  const toast = useToast()
  const createMaterial = useCreateMaterial(classId)
  const uploadFiles = useUploadFiles(classId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topicId, setTopicId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<number | null>(null)
  const [errors, setErrors] = useState<{ title?: string; files?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)

  const busy = progress !== null || createMaterial.isPending

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Title is required'
    else if (title.trim().length > 200) next.title = 'Title must be at most 200 characters'
    if (files.length === 0) next.files = 'Add at least one file'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setFormError(null)
    try {
      setProgress(0)
      const uploaded = await uploadFiles.mutateAsync({ files, onProgress: setProgress })
      await createMaterial.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        topicId: topicId ? Number(topicId) : null,
        fileIds: uploaded.map((file) => file.id),
      })
      toast.success('Material added')
      onClose()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setProgress(null)
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded-lg border border-border px-3 py-2 text-body text-danger">
          {formError}
        </p>
      )}
      <Input
        label="Title"
        placeholder="Unit 3 lecture notes"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        error={errors.title}
        disabled={busy}
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={2000}
        disabled={busy}
      />
      <Select label="Topic" value={topicId} onChange={(event) => setTopicId(event.target.value)} disabled={busy}>
        <option value="">No topic</option>
        {topics.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.name}
          </option>
        ))}
      </Select>
      <FileUploader
        label="Files"
        files={files}
        onChange={setFiles}
        progress={progress}
        disabled={busy}
        error={errors.files}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Add material
        </Button>
      </div>
    </form>
  )
}

export function MaterialModal({ open, classId, topics, onClose }: MaterialModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Add material" description="Share notes, slides or reference files with the class.">
      <MaterialForm classId={classId} topics={topics} onClose={onClose} />
    </Modal>
  )
}
