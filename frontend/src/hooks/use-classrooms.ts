import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { classroomsApi } from '@/api/classrooms'
import type { CreateClassroomRequest } from '@/types'

export const classroomKeys = {
  all: ['classrooms'] as const,
  detail: (id: number) => ['classrooms', id] as const,
  people: (id: number) => ['classrooms', id, 'people'] as const,
  peoplePage: (id: number, page: number) => ['classrooms', id, 'people', page] as const,
}

/** Classes the current user teaches or is enrolled in. */
export function useClassrooms() {
  return useQuery({ queryKey: classroomKeys.all, queryFn: () => classroomsApi.list(0, 50) })
}

export function useClassroom(id: number) {
  return useQuery({
    queryKey: classroomKeys.detail(id),
    queryFn: () => classroomsApi.get(id),
    enabled: Number.isFinite(id),
  })
}

export const PEOPLE_PAGE_SIZE = 25

export function useClassPeople(id: number, page: number) {
  return useQuery({
    queryKey: classroomKeys.peoplePage(id, page),
    queryFn: () => classroomsApi.people(id, page, PEOPLE_PAGE_SIZE),
    placeholderData: keepPreviousData,
    enabled: Number.isFinite(id),
  })
}

export function useCreateClassroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateClassroomRequest) => classroomsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classroomKeys.all }),
  })
}

export function useJoinClassroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (classCode: string) => classroomsApi.join(classCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classroomKeys.all }),
  })
}

export function useRemoveMember(classId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => classroomsApi.removeMember(classId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classroomKeys.people(classId) }),
  })
}

