import { useQuery } from '@tanstack/react-query'

import { getLossAnalysis, getSalesReport, loadReportLookups } from './report.service'
import type { ReportFilters } from './report.types'

export const reportKeys = {
  all: (organizationId: string) => ['reports', organizationId] as const,
  sales: (organizationId: string, filters: ReportFilters) =>
    ['reports', organizationId, 'sales', filters] as const,
  losses: (organizationId: string, filters: ReportFilters) =>
    ['reports', organizationId, 'losses', filters] as const,
  lookups: (organizationId: string) => ['reports', organizationId, 'lookups'] as const,
}

export const useSalesReport = (
  organizationId: string | undefined,
  filters: ReportFilters,
  enabled: boolean,
) =>
  useQuery({
    queryKey: reportKeys.sales(organizationId ?? '', filters),
    queryFn: () => getSalesReport(organizationId!, filters),
    enabled: Boolean(organizationId && enabled),
  })
export const useLossAnalysis = (
  organizationId: string | undefined,
  filters: ReportFilters,
  enabled: boolean,
) =>
  useQuery({
    queryKey: reportKeys.losses(organizationId ?? '', filters),
    queryFn: () => getLossAnalysis(organizationId!, filters),
    enabled: Boolean(organizationId && enabled),
  })
export const useReportLookups = (organizationId?: string) =>
  useQuery({
    queryKey: reportKeys.lookups(organizationId ?? ''),
    queryFn: () => loadReportLookups(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  })
