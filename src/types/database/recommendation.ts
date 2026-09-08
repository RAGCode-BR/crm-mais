import type { MutableOrganizationRecord } from './common'

export type RecommendationRuleCode =
  | 'follow_up_due'
  | 'forgotten_lead'
  | 'reactivate_lead'
  | 'high_score_no_task'
  | 'stalled_opportunity'
  | 'closing_soon'
  | 'overdue_follow_up'

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface CommercialRecommendationRule extends MutableOrganizationRecord {
  code: RecommendationRuleCode
  name: string
  description: string | null
  threshold_days: number | null
  minimum_score: number | null
  priority: RecommendationPriority
  is_active: boolean
}
