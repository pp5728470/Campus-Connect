import { differenceInDays, differenceInHours, differenceInMinutes, parseISO } from 'date-fns'

/** Splits remaining time until `dueAt` into days / hours / minutes. Null when past due. */
export function remainingUntil(dueAt: string | null): { days: number; hours: number; minutes: number } | null {
  if (!dueAt) return null
  const due = parseISO(dueAt)
  const now = new Date()
  if (due.getTime() <= now.getTime()) return null
  const days = differenceInDays(due, now)
  const hours = differenceInHours(due, now) % 24
  const minutes = differenceInMinutes(due, now) % 60
  return { days, hours, minutes }
}
