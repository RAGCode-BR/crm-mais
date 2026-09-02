import type { ActivityType } from '@/types/database/engagement'

export type ManualActivityType = Extract<
  ActivityType,
  'call' | 'whatsapp' | 'email' | 'meeting' | 'note' | 'proposal'
>

export type ActivityInput = {
  type: ManualActivityType
  subject: string
  description: string
  occurredAt: string
  companyId: string
  contactId: string
  leadId: string
  opportunityId: string
}

export type TimelineFilters = {
  page: number
  pageSize: number
  search: string
  type: string
  companyId: string
  contactId: string
  leadId: string
  opportunityId: string
  from: string
  to: string
}

export type TimelineOpportunityOption = {
  value: string
  label: string
  companyId: string
  contactId: string
  leadId: string
}
