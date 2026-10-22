import type { Material, MaterialRequest, PageResponse } from '@/types'
import { api } from './client'

const base = (classroomId: number) => `/classrooms/${classroomId}/materials`

export const materialsApi = {
  list: (classroomId: number, page = 0, size = 50) =>
    api.get<PageResponse<Material>>(base(classroomId), { params: { page, size } }).then((r) => r.data),
  get: (classroomId: number, id: number) => api.get<Material>(`${base(classroomId)}/${id}`).then((r) => r.data),
  create: (classroomId: number, payload: MaterialRequest) =>
    api.post<Material>(base(classroomId), payload).then((r) => r.data),
  update: (classroomId: number, id: number, payload: MaterialRequest) =>
    api.put<Material>(`${base(classroomId)}/${id}`, payload).then((r) => r.data),
  remove: (classroomId: number, id: number) => api.delete<void>(`${base(classroomId)}/${id}`).then(() => undefined),
}
