import type { Topic, TopicRequest } from '@/types'
import { api } from './client'

export const topicsApi = {
  list: (classroomId: number) => api.get<Topic[]>(`/classrooms/${classroomId}/topics`).then((r) => r.data),
  create: (classroomId: number, payload: TopicRequest) =>
    api.post<Topic>(`/classrooms/${classroomId}/topics`, payload).then((r) => r.data),
  update: (classroomId: number, topicId: number, payload: TopicRequest) =>
    api.put<Topic>(`/classrooms/${classroomId}/topics/${topicId}`, payload).then((r) => r.data),
  remove: (classroomId: number, topicId: number) =>
    api.delete<void>(`/classrooms/${classroomId}/topics/${topicId}`).then(() => undefined),
}
