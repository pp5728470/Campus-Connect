import { useId, type ComponentProps } from 'react'
import { controlClass, Field } from './Field'
import { cn } from '@/lib/cn'

interface InputProps extends ComponentProps<'input'> {
  label: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <Field id={inputId} label={label} error={error} hint={hint}>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${inputId}-message` : undefined}
        className={cn(controlClass(Boolean(error)), className)}
        {...props}
      />
    </Field>
  )
}
