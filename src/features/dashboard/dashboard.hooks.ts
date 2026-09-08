import { useQuery } from '@tanstack/react-query'
import { getDashboard, loadDashboardLookups } from './dashboard.service'
import type { DashboardFilters } from './dashboard.types'

export const dashboardKeys = {
  data: (organizationId: string, filters: DashboardFilters) =>
    ['dashboard', organizationId, 'data', filters] as const,
  lookups: (organizationId: string) => ['dashboard', organizationId, 'lookups'] as const,
}

export const useDashboard = (
  organizationId: string | undefined,
  filters: DashboardFilters,
  validPeriod: boolean,
) =>
  useQuery({
    queryKey: dashboardKeys.data(organizationId ?? '', filters),
    queryFn: () => getDashboard(organizationId!, filters),
    enabled: Boolean(organizationId && validPeriod),
    placeholderData: (previous) => previous,
  })

export const useDashboardLookups = (organizationId?: string) =>
  useQuery({
    queryKey: dashboardKeys.lookups(organizationId ?? ''),
    queryFn: () => loadDashboardLookups(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  })
