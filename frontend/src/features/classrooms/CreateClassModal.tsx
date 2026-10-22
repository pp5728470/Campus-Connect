import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useCreateClassroom } from '@/hooks/use-classrooms'
import { getErrorMessage } from '@/lib/errors'
import { BANNER_COLORS, createClassSchema, type CreateClassValues } from './schemas'

interface CreateClassModalProps {
  open: boolean
  onClose: () => void
}

function CreateClassForm({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const createClassroom = useCreateClassroom()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateClassValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: '', section: '', subject: '', room: '', description: '', bannerColor: BANNER_COLORS[0] },
  })
  const selectedColor = watch('bannerColor')

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const classroom = await createClassroom.mutateAsync({
        name: values.name,
        section: values.section || undefined,
        subject: values.subject || undefined,
        room: values.room || undefined,
        description: values.description || undefined,
        bannerColor: values.bannerColor,
      })
      toast.success(`Created ${classroom.name}`)
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
        label="Class name"
        placeholder="Advanced Java - MCA Sem II"
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Section" placeholder="Section A" error={errors.section?.message} {...register('section')} />
        <Input label="Room" placeholder="Lab 3" error={errors.room?.message} {...register('room')} />
      </div>
      <Input label="Subject" placeholder="Java Programming" error={errors.subject?.message} {...register('subject')} />
      <Textarea label="Description" error={errors.description?.message} {...register('description')} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-meta font-medium">Banner color</legend>
        <div className="flex flex-wrap gap-2">
          {BANNER_COLORS.map((color) => (
            <label
              key={color}
              className="relative cursor-pointer rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
            >
              <input type="radio" value={color} className="sr-only" aria-label={color} {...register('bannerColor')} />
              <span
                className="flex size-8 items-center justify-center rounded-full border border-border text-white"
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && <Check className="size-4" aria-hidden="true" />}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={createClassroom.isPending}>
          Create
        </Button>
      </div>
    </form>
  )
}

export function CreateClassModal({ open, onClose }: CreateClassModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Create class" description="Students join with the class code generated for you.">
      <CreateClassForm onClose={onClose} />
    </Modal>
  )
}

