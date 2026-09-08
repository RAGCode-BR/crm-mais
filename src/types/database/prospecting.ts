import type { ISODateTime, MutableOrganizationRecord, UUID } from './common'

export type ProspectingListStatus = 'active' | 'paused' | 'completed' | 'archived'
export type ProspectingItemStatus =
  'pending' | 'in_progress' | 'contacted' | 'qualified' | 'discarded'

export interface ProspectingList extends MutableOrganizationRecord {
  name: string
  description: string | null
  owner_member_id: UUID | null
  status: ProspectingListStatus
}

export interface ProspectingListItem extends MutableOrganizationRecord {
  list_id: UUID
  company_id: UUID | null
  lead_id: UUID | null
  assigned_member_id: UUID | null
  status: ProspectingItemStatus
  last_action_at: ISODateTime | null
}
