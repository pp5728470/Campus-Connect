import type { SearchResponse } from '@/types'
import { api } from './client'

export const searchApi = {
  search: (q: string) => api.get<SearchResponse>('/search', { params: { q } }).then((r) => r.data),
}
