import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi } from '@/api/assignments'
import type { AssignmentRequest, GradeRequest, SubmitRequest } from '@/types'

export const assignmentKeys = {
  list: (classId: number) => ['classrooms', classId, 'assignments'] as const,
  detail: (classId: number, id: number) => ['classrooms', classId, 'assignments', id] as const,
  submissions: (classId: number, id: number) => ['classrooms', classId, 'assignments', id, 'submissions'] as const,
  mine: (classId: number, id: number) => ['classrooms', classId, 'assignments', id, 'mine'] as const,
  todo: ['todo'] as const,
}

export function useAssignments(classId: number) {
  return useQuery({ queryKey: assignmentKeys.list(classId), queryFn: () => assignmentsApi.list(classId) })
}

export function useAssignment(classId: number, id: number) {
  return useQuery({
    queryKey: assignmentKeys.detail(classId, id),
    queryFn: () => assignmentsApi.get(classId, id),
    enabled: Number.isFinite(classId) && Number.isFinite(id),
  })
}

export function useSubmissions(classId: number, id: number, enabled: boolean) {
  return useQuery({
    queryKey: assignmentKeys.submissions(classId, id),
    queryFn: () => assignmentsApi.submissions(classId, id),
    enabled,
  })
}

export function useMySubmission(classId: number, id: number, enabled: boolean) {
  return useQuery({
    queryKey: assignmentKeys.mine(classId, id),
    queryFn: () => assignmentsApi.mySubmission(classId, id),
    enabled,
  })
}

export function useSaveAssignment(classId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: AssignmentRequest }) =>
      id === undefined ? assignmentsApi.create(classId, payload) : assignmentsApi.update(classId, id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.list(classId) })
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.todo })
    },
  })
}

export function useDeleteAssignment(classId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => assignmentsApi.remove(classId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.list(classId) })
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.todo })
    },
  })
}

/** Refreshes everything that depends on one assignment's submissions. */
function useRefreshAssignment(classId: number, id: number) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: assignmentKeys.detail(classId, id) })
    void queryClient.invalidateQueries({ queryKey: assignmentKeys.list(classId) })
    void queryClient.invalidateQueries({ queryKey: assignmentKeys.todo })
  }
}

export function useSubmitWork(classId: number, id: number) {
  const refresh = useRefreshAssignment(classId, id)
  return useMutation({
    mutationFn: (payload: SubmitRequest) => assignmentsApi.submit(classId, id, payload),
    onSuccess: refresh,
  })
}

export function useUnsubmitWork(classId: number, id: number) {
  const refresh = useRefreshAssignment(classId, id)
  return useMutation({
    mutationFn: () => assignmentsApi.unsubmit(classId, id),
    onSuccess: refresh,
  })
}

export function useGradeSubmission(classId: number, id: number) {
  const refresh = useRefreshAssignment(classId, id)
  return useMutation({
    mutationFn: ({ studentId, payload }: { studentId: number; payload: GradeRequest }) =>
      assignmentsApi.grade(classId, id, studentId, payload),
    onSuccess: refresh,
  })
}

/** Upcoming and missing work across all classes for the signed-in student. */
export function useTodo(enabled: boolean) {
  return useQuery({ queryKey: assignmentKeys.todo, queryFn: assignmentsApi.todo, enabled })
}
