import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { materialsApi } from '@/api/materials'
import type { MaterialRequest } from '@/types'

export const materialKeys = {
  list: (classId: number) => ['classrooms', classId, 'materials'] as const,
}

export function useMaterials(classId: number) {
  return useQuery({ queryKey: materialKeys.list(classId), queryFn: () => materialsApi.list(classId, 0, 100) })
}

export function useCreateMaterial(classId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MaterialRequest) => materialsApi.create(classId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materialKeys.list(classId) }),
  })
}

export function useDeleteMaterial(classId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => materialsApi.remove(classId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materialKeys.list(classId) }),
  })
}
