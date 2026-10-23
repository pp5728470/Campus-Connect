import { useQueries } from '@tanstack/react-query'
import { gradesApi } from '@/api/grades'
import { gradeKeys } from '@/hooks/use-grades'
import type { Classroom } from '@/types'

/** Counts ungraded submitted work per teaching class from gradebooks (real data only). */
export function useTeacherReview(teaching: Classroom[], enabled: boolean) {
  const queries = useQueries({
    queries: teaching.map((classroom) => ({
      queryKey: gradeKeys.gradebook(classroom.id),
      queryFn: () => gradesApi.gradebook(classroom.id),
      enabled: enabled && teaching.length > 0,
    })),
  })

  const byClass = new Map<number, number>()
  let total = 0
  let ready = true

  teaching.forEach((classroom, index) => {
    const q = queries[index]
    if (q?.isLoading) ready = false
    const book = q?.data
    if (!book) {
      byClass.set(classroom.id, 0)
      return
    }
    let count = 0
    for (const row of book.rows) {
      for (const cell of row.cells) {
        if (cell.status === 'SUBMITTED' || cell.status === 'LATE') count += 1
      }
    }
    byClass.set(classroom.id, count)
    total += count
  })

  return { byClass, total, ready: ready || teaching.length === 0 }
}
