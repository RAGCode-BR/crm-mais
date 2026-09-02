import type { ISODate, ISODateTime, MutableOrganizationRecord, UUID } from './common'

export type OpportunityStatus = 'open' | 'won' | 'lost'

export interface Pipeline extends MutableOrganizationRecord {
  name: string
  description: string | null
  is_default: boolean
  is_active: boolean
}

export interface PipelineStage extends MutableOrganizationRecord {
  pipeline_id: UUID
  name: string
  position: number
  default_probability: number
  is_closed: boolean
  is_won: boolean
  is_lost: boolean
}

export interface Opportunity extends MutableOrganizationRecord {
  title: string
  company_id: UUID
  contact_id: UUID | null
  lead_id: UUID | null
  owner_member_id: UUID | null
  pipeline_id: UUID
  stage_id: UUID
  lead_source_id: UUID | null
  status: OpportunityStatus
  estimated_value: number
  probability: number
  expected_close_date: ISODate | null
  product_service: string | null
  description: string | null
  loss_reason: string | null
  closed_at: ISODateTime | null
}
