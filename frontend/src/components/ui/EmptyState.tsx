import type { ComponentType, ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center">
      {Icon && <Icon className="size-8 text-muted" aria-hidden={true} />}
      <div>
        <p className="text-section font-semibold">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-md text-body text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
