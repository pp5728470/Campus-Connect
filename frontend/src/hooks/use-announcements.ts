import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { announcementsApi } from '@/api/announcements'
import type { AnnouncementRequest } from '@/types'

export const announcementKeys = {
  list: (classId: number) => ['classrooms', classId, 'announcements'] as const,
}

const PAGE_SIZE = 10

export function useAnnouncements(classId: number) {
  return useInfiniteQuery({
    queryKey: announcementKeys.list(classId),
    queryFn: ({ pageParam }) => announcementsApi.list(classId, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
  })
}

/** Builds a mutation that refreshes the announcement feed once it succeeds. */
function useFeedMutation<TVars>(classId: number, fn: (vars: TVars) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: announcementKeys.list(classId) }),
  })
}

export function useCreateAnnouncement(classId: number) {
  return useFeedMutation(classId, (payload: AnnouncementRequest) => announcementsApi.create(classId, payload))
}

export function useSetPinned(classId: number) {
  return useFeedMutation(classId, ({ id, pinned }: { id: number; pinned: boolean }) =>
    pinned ? announcementsApi.pin(classId, id) : announcementsApi.unpin(classId, id),
  )
}

export function useDeleteAnnouncement(classId: number) {
  return useFeedMutation(classId, (id: number) => announcementsApi.remove(classId, id))
}

export function useAddComment(classId: number) {
  return useFeedMutation(classId, ({ id, body }: { id: number; body: string }) =>
    announcementsApi.addComment(classId, id, body),
  )
}

export function useDeleteComment(classId: number) {
  return useFeedMutation(classId, ({ id, commentId }: { id: number; commentId: number }) =>
    announcementsApi.removeComment(classId, id, commentId),
  )
}
