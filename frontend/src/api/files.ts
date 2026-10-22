import type { FileResponse } from '@/types'
import { api } from './client'

export const filesApi = {
  /** Uploads one or more files; progress is reported as a 0-100 percentage for the whole batch. */
  upload: (classroomId: number, files: File[], onProgress?: (percent: number) => void) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    return api
      .post<FileResponse[]>(`/classrooms/${classroomId}/files`, form, {
        // Let the browser set the multipart boundary.
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100))
        },
      })
      .then((r) => r.data)
  },

  /** Fetches the file as a blob using the authenticated client. */
  fetchBlob: (fileId: number) =>
    api.get<Blob>(`/files/${fileId}/download`, { responseType: 'blob' }).then((r) => r.data),
}

/** Downloads a file through the authenticated client and triggers a browser save. */
export async function downloadFile(file: Pick<FileResponse, 'id' | 'originalName'>): Promise<void> {
  const blob = await filesApi.fetchBlob(file.id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.originalName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
