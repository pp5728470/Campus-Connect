import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useJoinClassroom } from '@/hooks/use-classrooms'
import { getErrorMessage } from '@/lib/errors'
import { joinClassSchema, type JoinClassValues } from './schemas'

interface JoinClassModalProps {
  open: boolean
  onClose: () => void
}

function JoinClassForm({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const joinClassroom = useJoinClassroom()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinClassValues>({ resolver: zodResolver(joinClassSchema), defaultValues: { classCode: '' } })

  const onSubmit = handleSubmit(async ({ classCode }) => {
    setFormError(null)
    try {
      const classroom = await joinClassroom.mutateAsync(classCode.toUpperCase())
      toast.success(`Joined ${classroom.name}`)
      onClose()
      navigate(`/classes/${classroom.id}`)
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
      <Input
        label="Class code"
        placeholder="e.g. K7M2QXA"
        maxLength={7}
        autoComplete="off"
        className="uppercase"
        hint="Ask your teacher for the 7-character code."
        error={errors.classCode?.message}
        {...register('classCode')}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={joinClassroom.isPending}>
          Join
        </Button>
      </div>
    </form>
  )
}

export function JoinClassModal({ open, onClose }: JoinClassModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Join class">
      <JoinClassForm onClose={onClose} />
    </Modal>
  )
}
