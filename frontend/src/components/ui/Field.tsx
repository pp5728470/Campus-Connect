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
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
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
    'h-11 w-full rounded-[10px] border bg-surface px-3.5 text-body text-ink placeholder:text-muted',
    'transition-[border-color,box-shadow] duration-100',
    'focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)] focus:outline-none',
    'disabled:bg-bg disabled:text-muted',
    hasError ? 'border-danger' : 'border-line-strong',
  )
