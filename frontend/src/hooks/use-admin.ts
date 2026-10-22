import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi, type AdminUserQuery } from '@/api/admin'
import type { Role } from '@/types'

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  users: ['admin', 'users'] as const,
  classrooms: ['admin', 'classrooms'] as const,
}

export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: adminApi.stats })
}

export function useAdminUsers(query: AdminUserQuery) {
  return useQuery({
    queryKey: [...adminKeys.users, query],
    queryFn: () => adminApi.users(query),
    placeholderData: keepPreviousData,
  })
}

export function useAdminClassrooms(q: string, page: number, size: number) {
  return useQuery({
    queryKey: [...adminKeys.classrooms, q, page, size],
    queryFn: () => adminApi.classrooms(q, page, size),
    placeholderData: keepPreviousData,
  })
}

/** Activates or deactivates an account. */
export function useSetUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? adminApi.activate(id) : adminApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useChangeUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => adminApi.changeRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })
}
