import { endOfWeek, isBefore, parseISO, startOfDay, startOfWeek } from 'date-fns'
import type { TodoItem } from '@/types'

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

function countWord(n: number): string {
  if (n >= 0 && n <= 10) return WORDS[n]!
  return String(n)
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many
}

/** Builds a natural summary from the student to-do list. No invented counts. */
export function buildTodoSummary(items: TodoItem[]): string {
  const now = new Date()
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const today = startOfDay(now)

  const missing = items.filter((item) => item.status === 'MISSING').length
  const dueBeforeWeekEnds = items.filter((item) => {
    if (!item.dueAt) return false
    if (item.status === 'MISSING') return false
    if (item.status === 'GRADED' || item.status === 'RETURNED' || item.status === 'SUBMITTED' || item.status === 'LATE') {
      return false
    }
    const due = parseISO(item.dueAt)
    return !isBefore(due, today) && !isBefore(weekEnd, due)
  }).length

  if (dueBeforeWeekEnds === 0 && missing === 0) {
    return 'You are all caught up for this week.'
  }

  const monday = startOfWeek(now, { weekStartsOn: 1 })
  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)
  const dueBeforeMonday = items.filter((item) => {
    if (!item.dueAt) return false
    if (item.status === 'MISSING') return false
    if (item.status === 'GRADED' || item.status === 'RETURNED' || item.status === 'SUBMITTED' || item.status === 'LATE') {
      return false
    }
    const due = parseISO(item.dueAt)
    return !isBefore(due, today) && isBefore(due, nextMonday)
  }).length

  const dueCount = dueBeforeMonday
  const duePhrase =
    dueCount > 0
      ? `${countWord(dueCount).replace(/^./, (c) => c.toUpperCase())} ${plural(dueCount, 'thing is', 'things are')} due before Monday`
      : null
  const missingPhrase =
    missing > 0 ? `${countWord(missing)} ${plural(missing, 'is', 'are')} missing` : null

  if (duePhrase && missingPhrase) return `${duePhrase}, and ${missingPhrase}.`
  if (duePhrase) return `${duePhrase}.`
  if (missingPhrase) {
    const lead = countWord(missing).replace(/^./, (c) => c.toUpperCase())
    return `${lead} ${plural(missing, 'assignment is', 'assignments are')} missing.`
  }
  return 'You are all caught up for this week.'
}

/** Teacher greeting when review counts are known. */
export function buildReviewSummary(toReview: number, dueThisWeek: number): string {
  if (toReview === 0 && dueThisWeek === 0) {
    return 'Nothing waiting for you this week.'
  }
  const parts: string[] = []
  if (toReview > 0) {
    parts.push(
      `${countWord(toReview).replace(/^./, (c) => c.toUpperCase())} ${plural(toReview, 'submission needs', 'submissions need')} review`,
    )
  }
  if (dueThisWeek > 0) {
    parts.push(
      `${countWord(dueThisWeek)} ${plural(dueThisWeek, 'assignment is', 'assignments are')} due this week`,
    )
  }
  if (parts.length === 2) return `${parts[0]}, and ${parts[1]}.`
  return `${parts[0]}.`
}
