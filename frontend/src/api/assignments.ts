import type {
  Assignment,
  AssignmentRequest,
  GradeRequest,
  PageResponse,
  Submission,
  SubmissionSummary,
  SubmitRequest,
  TodoItem,
} from '@/types'
import { api } from './client'

const base = (classroomId: number) => `/classrooms/${classroomId}/assignments`

export const assignmentsApi = {
  list: (classroomId: number, page = 0, size = 100) =>
    api.get<PageResponse<Assignment>>(base(classroomId), { params: { page, size } }).then((r) => r.data),
  get: (classroomId: number, id: number) => api.get<Assignment>(`${base(classroomId)}/${id}`).then((r) => r.data),
  create: (classroomId: number, payload: AssignmentRequest) =>
    api.post<Assignment>(base(classroomId), payload).then((r) => r.data),
  update: (classroomId: number, id: number, payload: AssignmentRequest) =>
    api.put<Assignment>(`${base(classroomId)}/${id}`, payload).then((r) => r.data),
  remove: (classroomId: number, id: number) => api.delete<void>(`${base(classroomId)}/${id}`).then(() => undefined),

  submissions: (classroomId: number, id: number) =>
    api.get<SubmissionSummary>(`${base(classroomId)}/${id}/submissions`).then((r) => r.data),
  mySubmission: (classroomId: number, id: number) =>
    api.get<Submission>(`${base(classroomId)}/${id}/my-submission`).then((r) => r.data),
  submit: (classroomId: number, id: number, payload: SubmitRequest) =>
    api.post<Submission>(`${base(classroomId)}/${id}/submit`, payload).then((r) => r.data),
  unsubmit: (classroomId: number, id: number) =>
    api.post<Submission>(`${base(classroomId)}/${id}/unsubmit`).then((r) => r.data),
  grade: (classroomId: number, id: number, studentId: number, payload: GradeRequest) =>
    api.post<Submission>(`${base(classroomId)}/${id}/submissions/${studentId}/grade`, payload).then((r) => r.data),

  todo: () => api.get<TodoItem[]>('/me/todo').then((r) => r.data),
}
