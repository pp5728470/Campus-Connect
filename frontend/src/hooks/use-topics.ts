import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { topicsApi } from '@/api/topics'
import type { TopicRequest } from '@/types'

export const topicKeys = {
  list: (classId: number) => ['classrooms', classId, 'topics'] as const,
}

export function useTopics(classId: number) {
  return useQuery({ queryKey: topicKeys.list(classId), queryFn: () => topicsApi.list(classId) })
}

export function useCreateTopic(classId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TopicRequest) => topicsApi.create(classId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicKeys.list(classId) }),
  })
}

export function useUpdateTopic(classId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TopicRequest }) => topicsApi.update(classId, id, payload),
    // Renamed topics also show up on assignments and materials.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classrooms', classId] }),
  })
}

export function useDeleteTopic(classId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => topicsApi.remove(classId, id),
    // Items under the topic fall back to "No topic", so their lists change too.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classrooms', classId] }),
  })
}