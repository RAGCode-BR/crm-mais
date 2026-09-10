import { useQuery } from '@tanstack/react-query'
import { listAuditActors, listAuditLogs } from './audit.service'
import type { AuditFilters } from './audit.types'

export const useAuditLogs = (organizationId: string | undefined, filters: AuditFilters) =>
  useQuery({
    queryKey: ['audit', organizationId ?? '', filters],
    queryFn: () => listAuditLogs(organizationId!, filters),
    enabled: Boolean(organizationId),
    placeholderData: (previous) => previous,
  })

export const useAuditActors = (organizationId?: string) =>
  useQuery({
    queryKey: ['audit', organizationId ?? '', 'actors'],
    queryFn: () => listAuditActors(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  })
