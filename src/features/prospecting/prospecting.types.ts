import type { Option, Paginated } from '@/features/crm/crm.types'
import type { ActivityType } from '@/types/database/engagement'
import type {
  ProspectingItemStatus,
  ProspectingList,
  ProspectingListItem,
  ProspectingListStatus,
} from '@/types/database/prospecting'

export type ProspectingListInput = {
  name: string
  description: string
  ownerMemberId: string
}

export type ProspectingListFilters = {
  search: string
  status: string
  ownerId: string
}

export type ProspectingItemFilters = {
  page: number
  pageSize: number
  search: string
  status: string
  assigneeId: string
}

export type ProspectingListSummary = ProspectingList & {
  itemCount: number
  contactedCount: number
  qualifiedCount: number
}

export type ProspectingItemRow = ProspectingListItem & {
  entityKind: 'company' | 'lead'
  entityLabel: string
  entityDescription: string
  tagIds: string[]
}

export type ProspectingListDetails = {
  list: ProspectingList
  items: Paginated<ProspectingItemRow>
}

export type ProspectingCandidate = {
  id: string
  kind: 'company' | 'lead'
  label: string
  description: string
}

export type ProspectingLookups = {
  members: Option[]
  tags: Array<Option & { color: string | null }>
}

export type AddProspectingItemsInput = {
  candidates: ProspectingCandidate[]
  assignedMemberId: string
}

export type UpdateProspectingItemsInput = {
  itemIds: string[]
  status?: ProspectingItemStatus
  assignedMemberId?: string | null
}

export type RecordProspectingActivityInput = {
  itemIds: string[]
  actorMemberId: string
  type: ActivityType
  subject: string
  description: string
}

export type UpdateProspectingListInput = {
  status: ProspectingListStatus
}
