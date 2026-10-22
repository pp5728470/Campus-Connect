import axios from 'axios'
import type { ApiError, FileResponse } from '@/types'
import { api } from './client'

/** Turns axios blob/JSON download failures into a plain Error with a clear message. */
async function toDownloadError(error: unknown): Promise<Error> {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error('Could not download the file.')
  }

  const status = error.response?.status
  const data = error.response?.data
  let message = 'Could not download the file.'

  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as ApiError
      if (parsed?.message) message = parsed.message
    } catch {
      // Non-JSON error body
    }
  } else if (data && typeof data === 'object' && 'message' in data && typeof (data as ApiError).message === 'string') {
    message = (data as ApiError).message
  } else if (!error.response) {
    message = 'Unable to reach the server. Check your connection.'
  }

  if (status === 404) {
    const missingOnDisk =
      /not found on disk/i.test(message) || /file not found/i.test(message) || message === 'Could not download the file.'
    if (missingOnDisk) {
      message =
        'This file is missing on the server. Re-run the Phase 2 seed SQL and start the backend with the dev profile.'
    }
  }

  return new Error(message)
}

export const filesApi = {
  /** Uploads one or more files; progress is reported as a 0-100 percentage for the whole batch. */
  upload: (classroomId: number, files: File[], onProgress?: (percent: number) => void) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    return api
      .post<FileResponse[]>(`/classrooms/${classroomId}/files`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100))
        },
      })
      .then((r) => r.data)
  },

  /** Fetches the file as a blob using the authenticated client. */
  fetchBlob: async (fileId: number) => {
    try {
      const response = await api.get<Blob>(`/files/${fileId}/download`, { responseType: 'blob' })
      // Spring may still return JSON with a 4xx that axios treats as success when validateStatus is loose;
      // also some proxies return application/json error bodies with 200 — guard by content type.
      const contentType = response.headers['content-type'] as string | undefined
      if (contentType?.includes('application/json')) {
        const text = await response.data.text()
        try {
          const parsed = JSON.parse(text) as ApiError
          throw new Error(parsed.message || 'Could not download the file.')
        } catch (inner) {
          if (inner instanceof Error && !(inner instanceof SyntaxError)) throw inner
          throw new Error('Could not download the file.')
        }
      }
      return response.data
    } catch (error) {
      throw await toDownloadError(error)
    }
  },
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
