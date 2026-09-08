import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteScoringRule,
  getScoringRule,
  listScoringRules,
  loadScoringInsights,
  recalculateLeadScores,
  saveScoringRule,
} from './scoring.service'
import type { ScoringRuleInput } from './scoring.types'

export const scoringKeys = {
  all: (organizationId: string) => ['scoring', organizationId] as const,
  insights: (organizationId: string) => ['scoring', organizationId, 'insights'] as const,
  rules: (organizationId: string) => ['scoring', organizationId, 'rules'] as const,
  rule: (organizationId: string, ruleId: string) =>
    ['scoring', organizationId, 'rules', ruleId] as const,
}

export const useScoringInsights = (organizationId?: string) =>
  useQuery({
    queryKey: scoringKeys.insights(organizationId ?? ''),
    queryFn: () => loadScoringInsights(organizationId!),
    enabled: Boolean(organizationId),
  })

export const useScoringRules = (organizationId?: string) =>
  useQuery({
    queryKey: scoringKeys.rules(organizationId ?? ''),
    queryFn: () => listScoringRules(organizationId!),
    enabled: Boolean(organizationId),
  })

export const useScoringRule = (organizationId?: string, ruleId?: string) =>
  useQuery({
    queryKey: scoringKeys.rule(organizationId ?? '', ruleId ?? ''),
    queryFn: () => getScoringRule(organizationId!, ruleId!),
    enabled: Boolean(organizationId && ruleId),
  })

function useScoringInvalidation(organizationId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: scoringKeys.all(organizationId) }),
      queryClient.invalidateQueries({ queryKey: ['crm', organizationId] }),
    ])
}

export function useSaveScoringRule(organizationId: string, ruleId?: string) {
  const invalidate = useScoringInvalidation(organizationId)
  return useMutation({
    mutationFn: (input: ScoringRuleInput) => saveScoringRule(organizationId, input, ruleId),
    onSuccess: invalidate,
  })
}

export function useDeleteScoringRule(organizationId: string) {
  const invalidate = useScoringInvalidation(organizationId)
  return useMutation({
    mutationFn: (ruleId: string) => deleteScoringRule(organizationId, ruleId),
    onSuccess: invalidate,
  })
}

export function useRecalculateLeadScores(organizationId: string) {
  const invalidate = useScoringInvalidation(organizationId)
  return useMutation({
    mutationFn: () => recalculateLeadScores(organizationId),
    onSuccess: invalidate,
  })
}
