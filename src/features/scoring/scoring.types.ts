import type {
  LeadScoringRuleType,
  LeadScoreClassification,
  LeadScoringRule,
} from '@/types/database/scoring'
import type { Json } from '@/types/database/common'

export type ScoringRuleInput = {
  name: string
  description: string
  ruleType: LeadScoringRuleType
  conditionValue: string
  points: number
  isActive: boolean
}

export type ScoredLead = {
  id: string
  name: string
  companyName: string
  ownerName: string
  score: number
  classification: LeadScoreClassification
  breakdown: Json
  calculatedAt: string | null
  lastActivityAt: string | null
  nextContactAt: string | null
  hasOpenFollowUp: boolean
}

export type ScoringInsights = {
  leads: ScoredLead[]
  priorityToday: ScoredLead[]
  warming: ScoredLead[]
  inactive: ScoredLead[]
  highWithoutFollowUp: ScoredLead[]
}

export type ScoringRuleWithUsage = LeadScoringRule
