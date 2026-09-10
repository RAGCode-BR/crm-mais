import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { globalSearchProvider } from './search.service'

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [delay, value])
  return debounced
}

export function useGlobalSearch(organizationId: string | undefined, query: string) {
  const debouncedQuery = useDebouncedValue(query.trim(), 250)
  return useQuery({
    queryKey: ['global-search', organizationId, debouncedQuery],
    queryFn: () =>
      globalSearchProvider.search({ organizationId: organizationId!, query: debouncedQuery }),
    enabled: Boolean(organizationId && debouncedQuery.length >= 2),
    staleTime: 30_000,
  })
}
