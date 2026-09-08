import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  enrollLeads,
  enrollProspectingItems,
  getCadence,
  getCadenceDetails,
  listActiveCadenceOptions,
  listCadences,
  loadCadenceLookups,
  saveCadence,
  setCadenceEnrollmentStatus,
} from './cadence.service'
import type {
  CadenceEnrollmentFilters,
  CadenceFilters,
  CadenceInput,
  EnrollLeadsInput,
  SetEnrollmentStatusInput,
} from './cadence.types'

export const cadenceKeys = {
  all: (organizationId: string) => ['cadences', organizationId] as const,
  list: (organizationId: string, filters: CadenceFilters) =>
    ['cadences', organizationId, 'list', filters] as const,
  detail: (organizationId: string, cadenceId: string, filters?: CadenceEnrollmentFilters) =>
    ['cadences', organizationId, 'detail', cadenceId, filters] as const,
  lookups: (organizationId: string) => ['cadences', organizationId, 'lookups'] as const,
  active: (organizationId: string) => ['cadences', organizationId, 'active'] as const,
}

export const useCadences = (organizationId: string | undefined, filters: CadenceFilters) =>
  useQuery({
    queryKey: cadenceKeys.list(organizationId ?? '', filters),
    queryFn: () => listCadences(organizationId!, filters),
    enabled: Boolean(organizationId),
  })

export const useCadence = (organizationId?: string, cadenceId?: string) =>
  useQuery({
    queryKey: cadenceKeys.detail(organizationId ?? '', cadenceId ?? ''),
    queryFn: () => getCadence(organizationId!, cadenceId!),
    enabled: Boolean(organizationId && cadenceId),
  })

export const useCadenceDetails = (
  organizationId: string | undefined,
  cadenceId: string | undefined,
  filters: CadenceEnrollmentFilters,
) =>
  useQuery({
    queryKey: cadenceKeys.detail(organizationId ?? '', cadenceId ?? '', filters),
    queryFn: () => getCadenceDetails(organizationId!, cadenceId!, filters),
    enabled: Boolean(organizationId && cadenceId),
    placeholderData: (previous) => previous,
  })

export const useCadenceLookups = (organizationId?: string) =>
  useQuery({
    queryKey: cadenceKeys.lookups(organizationId ?? ''),
    queryFn: () => loadCadenceLookups(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  })

export const useActiveCadenceOptions = (organizationId?: string) =>
  useQuery({
    queryKey: cadenceKeys.active(organizationId ?? ''),
    queryFn: () => listActiveCadenceOptions(organizationId!),
    enabled: Boolean(organizationId),
  })

function useInvalidateCadences(organizationId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: cadenceKeys.all(organizationId) }),
      queryClient.invalidateQueries({ queryKey: ['tasks', organizationId] }),
      queryClient.invalidateQueries({ queryKey: ['timeline', organizationId] }),
    ])
}

export function useSaveCadence(organizationId: string, cadenceId?: string) {
  const invalidate = useInvalidateCadences(organizationId)
  return useMutation({
    mutationFn: (input: CadenceInput) => saveCadence(organizationId, input, cadenceId),
    onSuccess: invalidate,
  })
}

export function useEnrollLeads(organizationId: string, cadenceId: string) {
  const invalidate = useInvalidateCadences(organizationId)
  return useMutation({
    mutationFn: (input: EnrollLeadsInput) => enrollLeads(organizationId, cadenceId, input),
    onSuccess: invalidate,
  })
}

export function useSetCadenceEnrollmentStatus(organizationId: string) {
  const invalidate = useInvalidateCadences(organizationId)
  return useMutation({
    mutationFn: (input: SetEnrollmentStatusInput) => setCadenceEnrollmentStatus(input),
    onSuccess: invalidate,
  })
}

export function useEnrollProspectingItems(organizationId: string, listId: string) {
  const invalidate = useInvalidateCadences(organizationId)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignedMemberId,
      cadenceId,
      itemIds,
    }: {
      assignedMemberId: string
      cadenceId: string
      itemIds: string[]
    }) => enrollProspectingItems(organizationId, cadenceId, listId, itemIds, assignedMemberId),
    onSuccess: async () => {
      await invalidate()
      await queryClient.invalidateQueries({ queryKey: ['prospecting', organizationId] })
    },
  })
}
