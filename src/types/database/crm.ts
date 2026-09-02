import type { ISODateTime, MutableOrganizationRecord, UUID } from './common'

export type CompanyStatus = 'prospect' | 'active' | 'inactive' | 'archived'
export type LeadStatus =
  'new' | 'researching' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'archived'
export type LeadTemperature = 'cold' | 'warm' | 'hot'

export interface LeadSource extends MutableOrganizationRecord {
  name: string
  description: string | null
  is_active: boolean
}

export interface Company extends MutableOrganizationRecord {
  trade_name: string
  legal_name: string | null
  tax_id: string | null
  industry: string | null
  company_size: string | null
  employee_count: number | null
  website: string | null
  phone: string | null
  email: string | null
  city: string | null
  state: string | null
  country_code: string
  notes: string | null
  owner_member_id: UUID | null
  lead_source_id: UUID | null
  status: CompanyStatus
  archived_at: ISODateTime | null
}

export interface Contact extends MutableOrganizationRecord {
  company_id: UUID
  first_name: string
  last_name: string | null
  job_title: string | null
  department: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  linkedin_url: string | null
  is_primary: boolean
  notes: string | null
  archived_at: ISODateTime | null
}

export interface Lead extends MutableOrganizationRecord {
  name: string
  company_id: UUID | null
  contact_id: UUID | null
  owner_member_id: UUID | null
  lead_source_id: UUID | null
  email: string | null
  phone: string | null
  status: LeadStatus
  temperature: LeadTemperature
  score: number
  next_action: string | null
  next_contact_at: ISODateTime | null
  notes: string | null
  archived_at: ISODateTime | null
}
