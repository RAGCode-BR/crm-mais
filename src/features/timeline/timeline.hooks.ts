import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createActivity, getActivity, listTimeline, loadTimelineLookups } from './timeline.service'
import type { ActivityInput, TimelineFilters } from './timeline.types'

export const timelineKeys = {
  all: (organizationId: string) => ['timeline', organizationId] as const,
  list: (organizationId: string, filters: TimelineFilters) =>
    ['timeline', organizationId, 'list', filters] as const,
  lookups: (organizationId: string) => ['timeline', organizationId, 'lookups'] as const,
  detail: (organizationId: string, activityId: string) =>
    ['timeline', organizationId, 'detail', activityId] as const,
}

export const useActivity = (organizationId?: string, activityId?: string) =>
  useQuery({
    queryKey: timelineKeys.detail(organizationId ?? '', activityId ?? ''),
    queryFn: () => getActivity(organizationId!, activityId!),
    enabled: Boolean(organizationId && activityId),
  })

export const useTimeline = (organizationId: string | undefined, filters: TimelineFilters) =>
  useQuery({
    queryKey: timelineKeys.list(organizationId ?? '', filters),
    queryFn: () => listTimeline(organizationId!, filters),
    enabled: Boolean(organizationId),
    placeholderData: (previous) => previous,
  })

export const useTimelineLookups = (organizationId?: string) =>
  useQuery({
    queryKey: timelineKeys.lookups(organizationId ?? ''),
    queryFn: () => loadTimelineLookups(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  })

export function useCreateActivity(organizationId: string, actorMemberId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActivityInput) => createActivity(organizationId, actorMemberId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timelineKeys.all(organizationId) }),
  })
}
