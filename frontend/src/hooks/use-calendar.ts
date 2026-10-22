import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { calendarApi } from '@/api/calendar'

export function useCalendarMonth(year: number, month: number) {
  return useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => calendarApi.month(year, month),
    placeholderData: keepPreviousData,
  })
}
