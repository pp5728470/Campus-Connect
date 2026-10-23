import type { ComponentType, ReactNode } from 'react'
import { EmptyNotebook } from './EmptyNotebook'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  /** When false, hide the faded notebook illustration. */
  showNotebook?: boolean
  /** @deprecated Ignored — empty states use the notebook illustration. */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

export function EmptyState({ title, description, action, showNotebook = true }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line-strong bg-surface px-4 py-12 text-center shadow-card">
      {showNotebook && <EmptyNotebook />}
      <div>
        <p className="font-serif text-[26px] font-normal tracking-[-0.01em] text-ink sm:text-[28px]">{title}</p>
        {description && <p className="mx-auto mt-2 max-w-md text-body text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
