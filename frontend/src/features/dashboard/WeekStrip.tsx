import {
  addDays,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useCalendarMonth } from '@/hooks/use-calendar'
import { useClassrooms } from '@/hooks/use-classrooms'
import { resolveCoverColor } from '@/lib/covers'
import type { CalendarEvent, SubmissionStatus } from '@/types'

function weekDays(anchor = new Date()) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

function eventsForDay(events: CalendarEvent[], day: Date) {
  return events.filter((event) => isSameDay(parseISO(event.dueAt), day))
}

function DueItem({
  event,
  coverColor,
}: {
  event: CalendarEvent
  coverColor: string
}) {
  const status = event.status as SubmissionStatus | null
  return (
    <Link
      to={event.link}
      className="planner-due"
      style={{ ['--due-color' as string]: coverColor }}
    >
      <b className="block font-semibold">{event.title}</b>
      {status ? (
        <StatusBadge status={status} />
      ) : (
        <span className="text-muted">{format(parseISO(event.dueAt), 'h:mm a')}</span>
      )}
    </Link>
  )
}

export function WeekStrip() {
  const now = new Date()
  const days = weekDays(now)
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const primary = useCalendarMonth(year, month)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const needPrev = weekStart.getMonth() !== now.getMonth()
  const needNext = weekEnd.getMonth() !== now.getMonth()
  const prev = useCalendarMonth(
    needPrev ? (weekStart.getMonth() === 11 ? year - 1 : year) : year,
    needPrev ? weekStart.getMonth() + 1 : month,
  )
  const next = useCalendarMonth(
    needNext ? (weekEnd.getMonth() === 0 ? year + 1 : year) : year,
    needNext ? weekEnd.getMonth() + 1 : month,
  )
  const { data: classrooms } = useClassrooms()

  const coverByClass = new Map(
    (classrooms?.content ?? []).map((c) => [c.id, resolveCoverColor(c.bannerColor)]),
  )

  const events = [
    ...(primary.data ?? []),
    ...(needPrev ? (prev.data ?? []) : []),
    ...(needNext ? (next.data ?? []) : []),
  ]
  const unique = [...new Map(events.map((e) => [e.assignmentId, e])).values()]

  const loading = primary.isLoading || (needPrev && prev.isLoading) || (needNext && next.isLoading)

  if (loading) {
    return (
      <div role="status" aria-label="Loading this week" className="planner-strip">
        {days.map((day) => (
          <div key={day.toISOString()} className="planner-day">
            <Skeleton className="mb-3 h-4 w-12" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div role="list" aria-label="This week" className="planner-strip">
      {days.map((day) => {
        const today = isToday(day)
        const past = isBefore(startOfDay(day), startOfDay(now)) && !today
        const dayEvents = eventsForDay(unique, day)
        return (
          <div
            key={day.toISOString()}
            role="listitem"
            aria-current={today ? 'date' : undefined}
            className={['planner-day', today ? 'is-today' : '', past ? 'is-past' : ''].filter(Boolean).join(' ')}
          >
            <div
              className={[
                'flex items-baseline gap-1.5 text-meta font-medium',
                today ? 'text-accent' : 'text-muted',
              ].join(' ')}
            >
              {today ? 'Today' : format(day, 'EEE')}
              <b className={['text-lg font-semibold', today ? 'text-accent' : 'text-ink'].join(' ')}>
                {format(day, 'd')}
              </b>
            </div>
            {dayEvents.map((event) => (
              <DueItem
                key={event.assignmentId}
                event={event}
                coverColor={coverByClass.get(event.classroomId) ?? resolveCoverColor(null)}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

/** Compact counts for teacher greeting when todo is unavailable. */
export function useWeekDueCount() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const { data } = useCalendarMonth(year, month)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const inWeek = (data ?? []).filter((e) => {
    const d = parseISO(e.dueAt)
    return d >= weekStart && d <= weekEnd
  })
  return inWeek.length
}
