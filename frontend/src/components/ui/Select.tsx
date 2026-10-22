import { useId, type ComponentProps } from 'react'
import { controlClass, Field } from './Field'
import { cn } from '@/lib/cn'

interface SelectProps extends ComponentProps<'select'> {
  label: string
  error?: string
  hint?: string
}

export function Select({ label, error, hint, className, id, children, ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  return (
    <Field id={selectId} label={label} error={error} hint={hint}>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${selectId}-message` : undefined}
        className={cn(controlClass(Boolean(error)), className)}
        {...props}
      >
        {children}
      </select>
    </Field>
  )
}
