import { formatDistanceToNow, parseISO } from 'date-fns'

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
