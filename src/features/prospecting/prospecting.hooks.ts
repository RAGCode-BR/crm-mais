import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addProspectingItems,
  applyTagsToProspectingItems,
  createProspectingList,
  getProspectingListDetails,
  listProspectingLists,
  loadProspectingLookups,
  recordProspectingActivity,
  removeProspectingItems,
  searchProspectingCandidates,
  updateProspectingItems,
  updateProspectingList,
} from './prospecting.service'
import type {
  AddProspectingItemsInput,
  ProspectingItemFilters,
  ProspectingListFilters,
  ProspectingListInput,
  RecordProspectingActivityInput,
  UpdateProspectingItemsInput,
  UpdateProspectingListInput,
} from './prospecting.types'

export const prospectingKeys = {
  all: (organizationId: string) => ['prospecting', organizationId] as const,
  lists: (organizationId: string, filters: ProspectingListFilters) =>
    ['prospecting', organizationId, 'lists', filters] as const,
  detail: (organizationId: string, listId: string, filters: ProspectingItemFilters) =>
    ['prospecting', organizationId, 'detail', listId, filters] as const,
  lookups: (organizationId: string) => ['prospecting', organizationId, 'lookups'] as const,
  candidates: (organizationId: string, listId: string, search: string) =>
    ['prospecting', organizationId, 'candidates', listId, search] as const,
}

export const useProspectingLists = (
  organizationId: string | undefined,
  filters: ProspectingListFilters,
) =>
  useQuery({
    queryKey: prospectingKeys.lists(organizationId ?? '', filters),
    queryFn: () => listProspectingLists(organizationId!, filters),
    enabled: Boolean(organizationId),
  })

export const useProspectingList = (
  organizationId: string | undefined,
  listId: string | undefined,
  filters: ProspectingItemFilters,
) =>
  useQuery({
    queryKey: prospectingKeys.detail(organizationId ?? '', listId ?? '', filters),
    queryFn: () => getProspectingListDetails(organizationId!, listId!, filters),
    enabled: Boolean(organizationId && listId),
    placeholderData: (previous) => previous,
  })

export const useProspectingLookups = (organizationId?: string) =>
  useQuery({
    queryKey: prospectingKeys.lookups(organizationId ?? ''),
    queryFn: () => loadProspectingLookups(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  })

export const useProspectingCandidates = (
  organizationId: string | undefined,
  listId: string | undefined,
  search: string,
  enabled: boolean,
) =>
  useQuery({
    queryKey: prospectingKeys.candidates(organizationId ?? '', listId ?? '', search),
    queryFn: () => searchProspectingCandidates(organizationId!, listId!, search),
    enabled: Boolean(organizationId && listId && enabled),
  })

function useInvalidateProspecting(organizationId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: prospectingKeys.all(organizationId) })
}

export function useCreateProspectingList(organizationId: string) {
  const invalidate = useInvalidateProspecting(organizationId)
  return useMutation({
    mutationFn: (input: ProspectingListInput) => createProspectingList(organizationId, input),
    onSuccess: invalidate,
  })
}

export function useAddProspectingItems(organizationId: string, listId: string) {
  const invalidate = useInvalidateProspecting(organizationId)
  return useMutation({
    mutationFn: (input: AddProspectingItemsInput) =>
      addProspectingItems(organizationId, listId, input),
    onSuccess: invalidate,
  })
}

export function useRemoveProspectingItems(organizationId: string, listId: string) {
  const invalidate = useInvalidateProspecting(organizationId)
  return useMutation({
    mutationFn: (itemIds: string[]) => removeProspectingItems(organizationId, listId, itemIds),
    onSuccess: invalidate,
  })
}

export function useUpdateProspectingItems(organizationId: string, listId: string) {
  const invalidate = useInvalidateProspecting(organizationId)
  return useMutation({
    mutationFn: (input: UpdateProspectingItemsInput) =>
      updateProspectingItems(organizationId, listId, input),
    onSuccess: invalidate,
  })
}

export function useApplyProspectingTags(organizationId: string, listId: string) {
  const invalidate = useInvalidateProspecting(organizationId)
  return useMutation({
    mutationFn: ({ itemIds, tagIds }: { itemIds: string[]; tagIds: string[] }) =>
      applyTagsToProspectingItems(organizationId, listId, itemIds, tagIds),
    onSuccess: invalidate,
  })
}

export function useRecordProspectingActivity(organizationId: string, listId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RecordProspectingActivityInput) =>
      recordProspectingActivity(organizationId, listId, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: prospectingKeys.all(organizationId) }),
        queryClient.invalidateQueries({ queryKey: ['timeline', organizationId] }),
      ]),
  })
}

export function useUpdateProspectingList(organizationId: string, listId: string) {
  const invalidate = useInvalidateProspecting(organizationId)
  return useMutation({
    mutationFn: (input: UpdateProspectingListInput) =>
      updateProspectingList(organizationId, listId, input),
    onSuccess: invalidate,
  })
}
