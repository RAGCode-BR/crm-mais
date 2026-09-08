import type { ISODateTime, MutableOrganizationRecord, UUID } from './common'
import type { TaskType } from './engagement'

export type CadenceStatus = 'draft' | 'active' | 'paused' | 'archived'
export type CadenceEnrollmentStatus = 'active' | 'paused' | 'completed' | 'removed'

export interface Cadence extends MutableOrganizationRecord {
  name: string
  description: string | null
  status: CadenceStatus
}

export interface CadenceStep extends MutableOrganizationRecord {
  cadence_id: UUID
  position: number
  day_number: number
  type: TaskType
  title: string
  description: string | null
}

export interface CadenceEnrollment extends MutableOrganizationRecord {
  cadence_id: UUID
  lead_id: UUID
  assigned_member_id: UUID
  status: CadenceEnrollmentStatus
  started_at: ISODateTime
  current_step_position: number | null
  next_step_due_at: ISODateTime | null
  paused_at: ISODateTime | null
  completed_at: ISODateTime | null
  removed_at: ISODateTime | null
}
