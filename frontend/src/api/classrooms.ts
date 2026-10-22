import type {
  Classroom,
  ClassroomMember,
  CreateClassroomRequest,
  PageResponse,
  UpdateClassroomRequest,
} from '@/types'
import { api } from './client'

export const classroomsApi = {
  list: (page = 0, size = 50) =>
    api.get<PageResponse<Classroom>>('/classrooms', { params: { page, size } }).then((r) => r.data),
  get: (id: number) => api.get<Classroom>(`/classrooms/${id}`).then((r) => r.data),
  create: (payload: CreateClassroomRequest) => api.post<Classroom>('/classrooms', payload).then((r) => r.data),
  update: (id: number, payload: UpdateClassroomRequest) =>
    api.put<Classroom>(`/classrooms/${id}`, payload).then((r) => r.data),
  archive: (id: number) => api.post<Classroom>(`/classrooms/${id}/archive`).then((r) => r.data),
  regenerateCode: (id: number) => api.post<Classroom>(`/classrooms/${id}/regenerate-code`).then((r) => r.data),
  join: (classCode: string) => api.post<Classroom>('/classrooms/join', { classCode }).then((r) => r.data),
  people: (id: number, page = 0, size = 100) =>
    api
      .get<PageResponse<ClassroomMember>>(`/classrooms/${id}/people`, { params: { page, size } })
      .then((r) => r.data),
  removeMember: (id: number, userId: number) => api.delete<void>(`/classrooms/${id}/people/${userId}`).then(() => undefined),
}
