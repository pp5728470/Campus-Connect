import axios from 'axios'
import type { ApiError } from '@/types'

/** Extracts a readable message from an API error response. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (error.response?.data?.message) return error.response.data.message
    if (!error.response) return 'Unable to reach the server. Check your connection.'
  }
  return fallback
}
