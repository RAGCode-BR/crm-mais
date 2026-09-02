import type {
  ISODateTime,
  Json,
  MutableOrganizationRecord,
  OrganizationRecord,
  UUID,
} from './common'

export type ActivityType =
  | 'call'
  | 'whatsapp'
  | 'email'
  | 'meeting'
  | 'note'
  | 'stage_change'
  | 'assignment_change'
  | 'proposal'
  | 'task'
  | 'system'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskType = 'call' | 'whatsapp' | 'email' | 'meeting' | 'follow_up' | 'general'

export interface Activity extends MutableOrganizationRecord {
  company_id: UUID | null
  contact_id: UUID | null
  lead_id: UUID | null
  opportunity_id: UUID | null
  actor_member_id: UUID | null
  type: ActivityType
  subject: string
  description: string | null
  occurred_at: ISODateTime
  metadata: Json
}

export interface Task extends MutableOrganizationRecord {
  company_id: UUID | null
  contact_id: UUID | null
  lead_id: UUID | null
  opportunity_id: UUID | null
  assigned_member_id: UUID | null
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  type: TaskType
  due_at: ISODateTime | null
  completed_at: ISODateTime | null
}

export interface Note extends MutableOrganizationRecord {
  company_id: UUID | null
  contact_id: UUID | null
  lead_id: UUID | null
  opportunity_id: UUID | null
  author_member_id: UUID
  content: string
}

export interface Tag extends MutableOrganizationRecord {
  name: string
  color: string | null
}

export interface EntityTag extends OrganizationRecord {
  tag_id: UUID
  company_id: UUID | null
  contact_id: UUID | null
  lead_id: UUID | null
  opportunity_id: UUID | null
  activity_id: UUID | null
  task_id: UUID | null
}
