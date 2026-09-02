import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Opportunity } from '@/types/database/pipeline'
import {
  getOpportunity,
  getOpportunityHistory,
  getPipeline,
  listKanbanOpportunities,
  listPipelines,
  loadPipelineLookups,
  moveOpportunity,
  saveOpportunity,
  savePipeline,
} from './pipeline.service'
import type { KanbanFilters, OpportunityInput, PipelineInput } from './pipeline.types'

export const pipelineKeys = {
  all: (organizationId: string) => ['pipeline', organizationId] as const,
  pipelines: (organizationId: string) => ['pipeline', organizationId, 'pipelines'] as const,
  pipeline: (organizationId: string, id: string) =>
    ['pipeline', organizationId, 'pipelines', id] as const,
  kanban: (organizationId: string, id: string, filters: KanbanFilters) =>
    ['pipeline', organizationId, 'kanban', id, filters] as const,
  opportunity: (organizationId: string, id: string) =>
    ['pipeline', organizationId, 'opportunity', id] as const,
  history: (organizationId: string, id: string) =>
    ['pipeline', organizationId, 'opportunity', id, 'history'] as const,
  lookups: (organizationId: string) => ['pipeline', organizationId, 'lookups'] as const,
}

export const usePipelines = (organizationId?: string) =>
  useQuery({
    queryKey: pipelineKeys.pipelines(organizationId ?? ''),
    queryFn: () => listPipelines(organizationId!),
    enabled: Boolean(organizationId),
  })
export const usePipeline = (organizationId?: string, id?: string) =>
  useQuery({
    queryKey: pipelineKeys.pipeline(organizationId ?? '', id ?? ''),
    queryFn: () => getPipeline(organizationId!, id!),
    enabled: Boolean(organizationId && id),
  })
export const usePipelineLookups = (organizationId?: string) =>
  useQuery({
    queryKey: pipelineKeys.lookups(organizationId ?? ''),
    queryFn: () => loadPipelineLookups(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  })
export const useKanbanOpportunities = (
  organizationId: string | undefined,
  pipelineId: string,
  filters: KanbanFilters,
) =>
  useQuery({
    queryKey: pipelineKeys.kanban(organizationId ?? '', pipelineId, filters),
    queryFn: () => listKanbanOpportunities(organizationId!, pipelineId, filters),
    enabled: Boolean(organizationId && pipelineId),
  })
export const useOpportunity = (organizationId?: string, id?: string) =>
  useQuery({
    queryKey: pipelineKeys.opportunity(organizationId ?? '', id ?? ''),
    queryFn: () => getOpportunity(organizationId!, id!),
    enabled: Boolean(organizationId && id),
  })
export const useOpportunityHistory = (organizationId?: string, id?: string) =>
  useQuery({
    queryKey: pipelineKeys.history(organizationId ?? '', id ?? ''),
    queryFn: () => getOpportunityHistory(organizationId!, id!),
    enabled: Boolean(organizationId && id),
  })

export function useSavePipeline(organizationId: string, id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PipelineInput) => savePipeline(organizationId, input, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKeys.all(organizationId) }),
  })
}

export function useSaveOpportunity(organizationId: string, id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: OpportunityInput) => saveOpportunity(organizationId, input, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKeys.all(organizationId) }),
  })
}

export function useMoveOpportunity(
  organizationId: string,
  pipelineId: string,
  filters: KanbanFilters,
) {
  const queryClient = useQueryClient()
  const key = pipelineKeys.kanban(organizationId, pipelineId, filters)
  return useMutation({
    mutationFn: ({
      opportunityId,
      stageId,
      lossReason,
    }: {
      opportunityId: string
      stageId: string
      lossReason?: string
    }) => moveOpportunity(opportunityId, stageId, lossReason),
    onMutate: async ({ opportunityId, stageId }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Opportunity[]>(key)
      queryClient.setQueryData<Opportunity[]>(key, (current) =>
        current?.map((opportunity) =>
          opportunity.id === opportunityId ? { ...opportunity, stage_id: stageId } : opportunity,
        ),
      )
      return { previous }
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: pipelineKeys.all(organizationId) }),
  })
}
