import { cn } from '@/lib/cn'
import type { SubmissionStatus } from '@/types'

const statuses: Record<SubmissionStatus, { label: string; className: string }> = {
  ASSIGNED: { label: 'Assigned', className: 'text-muted' },
  SUBMITTED: { label: 'Turned in', className: 'text-accent' },
  LATE: { label: 'Turned in late', className: 'text-warning' },
  MISSING: { label: 'Missing', className: 'text-danger' },
  GRADED: { label: 'Graded', className: 'text-success' },
  RETURNED: { label: 'Returned', className: 'text-success' },
}

/** Small colored status text for a submission. */
export function StatusBadge({ status, className }: { status: SubmissionStatus; className?: string }) {
  const { label, className: color } = statuses[status]
  return <span className={cn('text-meta font-medium', color, className)}>{label}</span>
}
