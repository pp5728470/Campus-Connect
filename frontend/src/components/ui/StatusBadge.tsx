import { cn } from '@/lib/cn'
import type { SubmissionStatus } from '@/types'

const statuses: Record<SubmissionStatus, { label: string; className: string }> = {
  ASSIGNED: { label: 'Assigned', className: 'text-muted' },
  SUBMITTED: { label: 'Turned in', className: 'text-accent' },
  LATE: { label: 'Turned in late', className: 'text-warn' },
  MISSING: { label: 'Missing', className: 'text-danger' },
  GRADED: { label: 'Graded', className: 'text-ok' },
  RETURNED: { label: 'Returned', className: 'text-ok' },
}

/** Small coloured status text with a leading status dot. */
export function StatusBadge({ status, className }: { status: SubmissionStatus; className?: string }) {
  const { label, className: color } = statuses[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-meta font-semibold whitespace-nowrap', color, className)}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </span>
  )
}
