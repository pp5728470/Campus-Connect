import type { ClassAnalytics, Gradebook, StudentGrades } from '@/types'
import { api } from './client'

const base = (classroomId: number) => `/classrooms/${classroomId}/grades`

export type ExportFormat = 'csv' | 'xlsx'

export const gradesApi = {
  gradebook: (classroomId: number) => api.get<Gradebook>(base(classroomId)).then((r) => r.data),
  mine: (classroomId: number) => api.get<StudentGrades>(`${base(classroomId)}/me`).then((r) => r.data),
  analytics: (classroomId: number) => api.get<ClassAnalytics>(`${base(classroomId)}/analytics`).then((r) => r.data),

  /** Downloads the gradebook and triggers a browser save. */
  async export(classroomId: number, format: ExportFormat, fallbackName: string) {
    const response = await api.get<Blob>(`${base(classroomId)}/export/${format}`, { responseType: 'blob' })
    const disposition = String(response.headers['content-disposition'] ?? '')
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
    const filename = match?.[1] ? decodeURIComponent(match[1]) : `${fallbackName}.${format}`

    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
