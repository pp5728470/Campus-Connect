import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useCreateTopic, useUpdateTopic } from '@/hooks/use-topics'
import { getErrorMessage } from '@/lib/errors'
import type { Topic } from '@/types'
import { topicSchema, type TopicValues } from './schemas'

interface TopicModalProps {
  open: boolean
  classId: number
  /** When set, the modal renames this topic instead of creating one. */
  topic: Topic | null
  onClose: () => void
}

function TopicForm({ classId, topic, onClose }: Omit<TopicModalProps, 'open'>) {
  const toast = useToast()
  const createTopic = useCreateTopic(classId)
  const updateTopic = useUpdateTopic(classId)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TopicValues>({ resolver: zodResolver(topicSchema), defaultValues: { name: topic?.name ?? '' } })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      if (topic) {
        await updateTopic.mutateAsync({ id: topic.id, payload: { name: values.name, sortOrder: topic.sortOrder } })
        toast.success('Topic renamed')
      } else {
        await createTopic.mutateAsync({ name: values.name })
        toast.success('Topic created')
      }
      onClose()
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded-lg border border-border px-3 py-2 text-body text-danger">
          {formError}
        </p>
      )}
      <Input label="Topic name" placeholder="Unit 2 - Spring Boot" error={errors.name?.message} {...register('name')} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={createTopic.isPending || updateTopic.isPending}>
          {topic ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

export function TopicModal({ open, classId, topic, onClose }: TopicModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={topic ? 'Rename topic' : 'Create topic'}
      description="Topics group assignments and materials on the Classwork and Materials pages."
    >
      <TopicForm classId={classId} topic={topic} onClose={onClose} />
    </Modal>
  )
}
