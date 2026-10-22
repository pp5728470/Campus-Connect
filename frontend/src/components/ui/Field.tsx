import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}

/** Label, control slot and message line shared by Input, Textarea and Select. */
export function Field({ id, label, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-meta font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-message`} role="alert" className="text-meta text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-message`} className="text-meta text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const controlClass = (hasError: boolean) =>
  cn(
    'w-full rounded-lg border bg-surface px-3 py-2 text-body text-ink placeholder:text-muted',
    'focus-visible:border-accent focus-visible:outline-offset-0 disabled:bg-bg disabled:text-muted',
    hasError ? 'border-danger' : 'border-border',
  )
