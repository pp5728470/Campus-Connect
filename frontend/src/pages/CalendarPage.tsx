import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useCalendarMonth } from '@/hooks/use-calendar'
import { useClassrooms } from '@/hooks/use-classrooms'
import { cn } from '@/lib/cn'
import type { CalendarEvent } from '@/types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_CHIPS = 3
/** Used when a class is not in the user's list (for example an archived one). */
const FALLBACK_COLOR = '#5F6368'

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd')

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const { data: events, isLoading, isError, refetch, isRefetching } = useCalendarMonth(
    cursor.getFullYear(),
    cursor.getMonth() + 1,
  )
  const { data: classes } = useClassrooms()

  const colors = useMemo(
    () => new Map((classes?.content ?? []).map((classroom) => [classroom.id, classroom.bannerColor])),
    [classes],
  )
  const colorOf = (event: CalendarEvent) => colors.get(event.classroomId) ?? FALLBACK_COLOR

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(cursor)),
        end: endOfWeek(endOfMonth(cursor)),
      }),
    [cursor],
  )

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events ?? []) {
      const key = dayKey(parseISO(event.dueAt))
      map.set(key, [...(map.get(key) ?? []), event])
    }
    return map
  }, [events])

  const sorted = useMemo(
    () => [...(events ?? [])].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    [events],
  )

  // One legend entry per class that has something due this month.
  const legend = new Map<number, { name: string; color: string }>()
  for (const event of sorted) {
    if (!legend.has(event.classroomId)) legend.set(event.classroomId, { name: event.classroomName, color: colorOf(event) })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold">Calendar</h1>
          <p className="text-body text-muted">Assignment due dates across your classes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
            Today
          </Button>
          <Button variant="secondary" size="sm" aria-label="Previous month" onClick={() => setCursor((c) => addMonths(c, -1))}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="sm" aria-label="Next month" onClick={() => setCursor((c) => addMonths(c, 1))}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          <h2 aria-live="polite" className="min-w-32 text-right text-section font-semibold">
            {format(cursor, 'MMMM yyyy')}
          </h2>
        </div>
      </div>

      {isError ? (
        <ErrorState title="Could not load the calendar" onRetry={() => void refetch()} retrying={isRefetching} />
      ) : (
        <Card className="overflow-hidden">
          <div role="group" aria-label={`Due dates for ${format(cursor, 'MMMM yyyy')}`} aria-busy={isLoading}>
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((day) => (
                <div key={day} className="px-2 py-2 text-center text-meta font-medium text-muted">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const dayEvents = byDay.get(dayKey(day)) ?? []
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'flex min-h-20 flex-col gap-1 border-border p-1 sm:min-h-24 sm:p-2',
                      index % 7 !== 6 && 'border-r',
                      index < days.length - 7 && 'border-b',
                      !isSameMonth(day, cursor) && 'bg-bg',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex size-6 items-center justify-center self-start rounded-full text-meta',
                        isToday(day) ? 'bg-accent font-medium text-white' : isSameMonth(day, cursor) ? 'text-ink' : 'text-muted',
                      )}
                      aria-label={format(day, 'd MMMM')}
                    >
                      {format(day, 'd')}
                    </span>
                    {isLoading ? (
                      index % 3 === 0 && <Skeleton className="h-4" />
                    ) : (
                      <>
                        {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                          <Link
                            key={event.assignmentId}
                            to={event.link}
                            title={`${event.title} (${event.classroomName})`}
                            style={{ backgroundColor: colorOf(event) }}
                            className="block rounded-lg px-1 text-meta text-white hover:opacity-90"
                          >
                            <span className="hidden truncate sm:block">{event.title}</span>
                            <span className="block h-2 sm:hidden" />
                            <span className="sr-only sm:hidden">{event.title}</span>
                          </Link>
                        ))}
                        {dayEvents.length > MAX_CHIPS && (
                          <span className="text-meta text-muted">+{dayEvents.length - MAX_CHIPS} more</span>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {legend.size > 0 && (
        <ul aria-label="Classes" className="flex flex-wrap gap-4">
          {[...legend.values()].map((item) => (
            <li key={item.name} className="flex items-center gap-2 text-meta text-muted">
              <span aria-hidden="true" className="size-4 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="agenda-heading" className="flex flex-col gap-2">
        <h2 id="agenda-heading" className="text-section font-semibold">
          Due in {format(cursor, 'MMMM')}
        </h2>
        {isLoading && (
          <Card role="status" aria-label="Loading due dates" className="flex flex-col gap-3 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </Card>
        )}
        {events && sorted.length === 0 && (
          <EmptyState icon={CalendarDays} title="Nothing due this month" description="Assignments with due dates will appear here." />
        )}
        {sorted.length > 0 && (
          <Card>
            <ul className="divide-y divide-border">
              {sorted.map((event) => (
                <li key={event.assignmentId}>
                  <Link to={event.link} className="flex items-center gap-3 px-4 py-3 hover:bg-hover">
                    <span
                      aria-hidden="true"
                      className="size-4 shrink-0 rounded-full"
                      style={{ backgroundColor: colorOf(event) }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-medium">{event.title}</span>
                      <span className="block truncate text-meta text-muted">
                        {event.classroomName} &middot; {format(parseISO(event.dueAt), 'EEE d MMM, h:mm a')} &middot;{' '}
                        {event.maxPoints} marks
                      </span>
                    </span>
                    {event.status && <StatusBadge status={event.status} />}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  )
}
