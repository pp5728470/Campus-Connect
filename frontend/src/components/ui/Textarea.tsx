import { useId, type ComponentProps } from 'react'
import { controlClass, Field } from './Field'
import { cn } from '@/lib/cn'

interface TextareaProps extends ComponentProps<'textarea'> {
  label: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, id, rows = 3, ...props }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  return (
    <Field id={textareaId} label={label} error={error} hint={hint}>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${textareaId}-message` : undefined}
        className={cn(controlClass(Boolean(error)), 'resize-y', className)}
        {...props}
      />
    </Field>
  )
}
