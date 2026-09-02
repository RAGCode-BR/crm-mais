import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveRecord,
  getCompany,
  getContact,
  getLead,
  listCompanies,
  listContacts,
  listLeads,
  loadCrmLookups,
  saveCompany,
  saveContact,
  saveLead,
} from './crm.service'
import type {
  CompanyInput,
  ContactInput,
  CrmRecord,
  EntityKind,
  LeadInput,
  ListFilters,
  Paginated,
} from './crm.types'

export const crmKeys = {
  all: (organizationId: string) => ['crm', organizationId] as const,
  list: (organizationId: string, entity: EntityKind, filters: ListFilters) =>
    ['crm', organizationId, entity, 'list', filters] as const,
  detail: (organizationId: string, entity: EntityKind, id: string) =>
    ['crm', organizationId, entity, id] as const,
  lookups: (organizationId: string) => ['crm', organizationId, 'lookups'] as const,
}

export function useCrmLookups(organizationId?: string) {
  return useQuery({
    queryKey: crmKeys.lookups(organizationId ?? ''),
    queryFn: () => loadCrmLookups(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  })
}

export function useCrmList(
  entity: EntityKind,
  organizationId: string | undefined,
  filters: ListFilters,
) {
  return useQuery<Paginated<CrmRecord>>({
    queryKey: crmKeys.list(organizationId ?? '', entity, filters),
    queryFn: async () => {
      const result =
        entity === 'companies'
          ? await listCompanies(organizationId!, filters)
          : entity === 'contacts'
            ? await listContacts(organizationId!, filters)
            : await listLeads(organizationId!, filters)
      return result as Paginated<CrmRecord>
    },
    enabled: Boolean(organizationId),
    placeholderData: (previous: Paginated<CrmRecord> | undefined) => previous,
  })
}

export function useCrmRecord(entity: EntityKind, organizationId?: string, id?: string) {
  return useQuery<CrmRecord>({
    queryKey: crmKeys.detail(organizationId ?? '', entity, id ?? ''),
    queryFn: async () =>
      (entity === 'companies'
        ? await getCompany(organizationId!, id!)
        : entity === 'contacts'
          ? await getContact(organizationId!, id!)
          : await getLead(organizationId!, id!)) as CrmRecord,
    enabled: Boolean(organizationId && id),
  })
}

export function useSaveCompany(organizationId: string, id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CompanyInput) => saveCompany(organizationId, input, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crmKeys.all(organizationId) }),
  })
}

export function useSaveContact(organizationId: string, id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ContactInput) => saveContact(organizationId, input, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crmKeys.all(organizationId) }),
  })
}

export function useSaveLead(organizationId: string, id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LeadInput) => saveLead(organizationId, input, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crmKeys.all(organizationId) }),
  })
}

export function useArchiveRecord(entity: EntityKind, organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveRecord(entity, organizationId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crmKeys.all(organizationId) }),
  })
}
