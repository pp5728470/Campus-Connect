import { useQuery } from '@tanstack/react-query'
import { gradesApi } from '@/api/grades'

export const gradeKeys = {
  gradebook: (classId: number) => ['classrooms', classId, 'grades', 'gradebook'] as const,
  mine: (classId: number) => ['classrooms', classId, 'grades', 'mine'] as const,
  analytics: (classId: number) => ['classrooms', classId, 'grades', 'analytics'] as const,
  all: (classId: number) => ['classrooms', classId, 'grades'] as const,
}

export function useGradebook(classId: number) {
  return useQuery({ queryKey: gradeKeys.gradebook(classId), queryFn: () => gradesApi.gradebook(classId) })
}

export function useMyGrades(classId: number) {
  return useQuery({ queryKey: gradeKeys.mine(classId), queryFn: () => gradesApi.mine(classId) })
}

export function useClassAnalytics(classId: number) {
  return useQuery({ queryKey: gradeKeys.analytics(classId), queryFn: () => gradesApi.analytics(classId) })
}
