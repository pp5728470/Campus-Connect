import type { CalendarEvent } from '@/types'
import { api } from './client'

export const calendarApi = {
  /** Due dates in one month; `month` is 1-12. Month boundaries use the browser's time zone. */
  month: (year: number, month: number) =>
    api
      .get<CalendarEvent[]>('/calendar', {
        params: { year, month, zone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      })
      .then((r) => r.data),
}
