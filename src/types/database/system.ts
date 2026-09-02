import type {
  ISODateTime,
  Json,
  MutableOrganizationRecord,
  OrganizationRecord,
  UUID,
} from './common'

export type NotificationType =
  | 'task_due'
  | 'task_overdue'
  | 'lead_assigned'
  | 'opportunity_changed'
  | 'opportunity_stalled'
  | 'meeting'
  | 'hot_lead'
  | 'mention'
  | 'system'

export interface Attachment extends MutableOrganizationRecord {
  company_id: UUID | null
  lead_id: UUID | null
  opportunity_id: UUID | null
  activity_id: UUID | null
  uploaded_by_member_id: UUID
  storage_bucket: string
  storage_path: string
  file_name: string
  mime_type: string | null
  size_bytes: number
}

export interface Notification extends MutableOrganizationRecord {
  recipient_member_id: UUID
  type: NotificationType
  title: string
  body: string | null
  related_entity_type: string | null
  related_entity_id: UUID | null
  read_at: ISODateTime | null
}

export interface AuditLog extends OrganizationRecord {
  actor_member_id: UUID | null
  entity_type: string
  entity_id: UUID | null
  action: string
  previous_values: Json | null
  new_values: Json | null
  ip_address: string | null
  user_agent: string | null
}
