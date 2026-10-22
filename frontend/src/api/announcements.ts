import type { Announcement, AnnouncementRequest, Comment, PageResponse } from '@/types'
import { api } from './client'

const base = (classroomId: number) => `/classrooms/${classroomId}/announcements`

export const announcementsApi = {
  list: (classroomId: number, page = 0, size = 10) =>
    api.get<PageResponse<Announcement>>(base(classroomId), { params: { page, size } }).then((r) => r.data),
  create: (classroomId: number, payload: AnnouncementRequest) =>
    api.post<Announcement>(base(classroomId), payload).then((r) => r.data),
  pin: (classroomId: number, id: number) => api.post<Announcement>(`${base(classroomId)}/${id}/pin`).then((r) => r.data),
  unpin: (classroomId: number, id: number) =>
    api.post<Announcement>(`${base(classroomId)}/${id}/unpin`).then((r) => r.data),
  remove: (classroomId: number, id: number) => api.delete<void>(`${base(classroomId)}/${id}`).then(() => undefined),
  addComment: (classroomId: number, id: number, body: string) =>
    api.post<Comment>(`${base(classroomId)}/${id}/comments`, { body }).then((r) => r.data),
  removeComment: (classroomId: number, id: number, commentId: number) =>
    api.delete<void>(`${base(classroomId)}/${id}/comments/${commentId}`).then(() => undefined),
}
