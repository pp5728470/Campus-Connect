import { differenceInCalendarDays, format, formatDistanceToNow, parseISO } from 'date-fns'

/** Formats an ISO timestamp as a relative date, e.g. "2 days ago". */
export function timeAgo(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}

/** Up to two uppercase initials for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

/** Formats a byte count as B, KB or MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Absolute date and time, e.g. "24 Oct 2026, 11:59 PM". */
export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy, h:mm a')
}

/** Converts an ISO timestamp to the value format used by datetime-local inputs. */
export function toLocalInputValue(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm")
}

/** Converts a datetime-local input value to an ISO instant for the API. */
export function fromLocalInputValue(value: string): string {
  return new Date(value).toISOString()
}

/** Short due date label such as "Due tomorrow" or "Due 2 days ago", without a status judgement. */
export function dueLabel(iso: string | null): string {
  if (!iso) return 'No due date'
  const due = parseISO(iso)
  const days = differenceInCalendarDays(due, new Date())
  const time = format(due, 'h:mm a')
  if (days === 0) return `Due today, ${time}`
  if (days === 1) return `Due tomorrow, ${time}`
  if (days === -1) return `Due yesterday, ${time}`
  if (days < 0) return `Due ${formatDistanceToNow(due, { addSuffix: true })}`
  if (days < 7) return `Due in ${days} days`
  return `Due ${format(due, 'd MMM')}`
}
