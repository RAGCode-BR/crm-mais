import type { OpportunityStatus, Pipeline, PipelineStage } from '@/types/database/pipeline'

export type StageInput = {
  id?: string
  name: string
  probability: number
  isWon: boolean
  isLost: boolean
}

export type PipelineInput = {
  name: string
  description: string
  isDefault: boolean
  isActive: boolean
  stages: StageInput[]
}

export type OpportunityInput = {
  title: string
  companyId: string
  contactId: string
  leadId: string
  ownerMemberId: string
  pipelineId: string
  stageId: string
  leadSourceId: string
  status: OpportunityStatus
  estimatedValue: number
  probability: number
  expectedCloseDate: string
  productService: string
  description: string
  lossReason: string
  closedAt: string
}

export type PipelineWithStages = Pipeline & { stages: PipelineStage[] }

export type KanbanFilters = {
  search: string
  ownerId: string
  status: string
}
