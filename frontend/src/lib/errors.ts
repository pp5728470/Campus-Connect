import axios from 'axios'
import type { ApiError } from '@/types'

/** Extracts a readable message from an API error response. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && !(data instanceof Blob) && 'message' in data && data.message) {
      return String(data.message)
    }
    if (!error.response) return 'Unable to reach the server. Check your connection.'
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
