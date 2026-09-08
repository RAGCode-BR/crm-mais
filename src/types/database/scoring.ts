import type { ISODateTime, Json, MutableOrganizationRecord, UUID } from './common'

export type LeadScoringRuleType =
  | 'lead_status'
  | 'lead_temperature'
  | 'company_industry'
  | 'company_employee_min'
  | 'activity_type_exists'
  | 'inactivity_days_min'

export type LeadScoreClassification = 'cold' | 'warm' | 'hot' | 'very_hot'

export interface LeadScoringRule extends MutableOrganizationRecord {
  name: string
  description: string | null
  rule_type: LeadScoringRuleType
  condition_value: string
  points: number
  is_active: boolean
}

export interface LeadScoreResult extends MutableOrganizationRecord {
  lead_id: UUID
  score: number
  classification: LeadScoreClassification
  breakdown: Json
  calculated_at: ISODateTime
}
