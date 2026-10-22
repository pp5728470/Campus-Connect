import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchApi } from '@/api/search'

export const MIN_SEARCH_LENGTH = 2

export function useSearch(query: string) {
  const term = query.trim()
  return useQuery({
    queryKey: ['search', term],
    queryFn: () => searchApi.search(term),
    enabled: term.length >= MIN_SEARCH_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}
