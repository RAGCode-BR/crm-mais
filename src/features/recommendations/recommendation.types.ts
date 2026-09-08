import type {
  RecommendationPriority,
  RecommendationRuleCode,
} from '@/types/database/recommendation'

export type RecommendationCategory = 'lead' | 'task' | 'opportunity'

export type CommercialRecommendation = {
  id: string
  ruleCode: RecommendationRuleCode
  category: RecommendationCategory
  priority: RecommendationPriority
  title: string
  reason: string
  actionLabel: string
  actionPath: string
  entityType: RecommendationCategory
  entityId: string
  ownerMemberId: string | null
  ownerName: string
  score: number | null
  referenceAt: string | null
}

export type RecommendationFilters = { priority: string; category: string; ownerId: string }
export type RecommendationData = {
  recommendations: CommercialRecommendation[]
  members: Array<{ value: string; label: string }>
}
