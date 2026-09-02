import type {
  Company,
  CompanyStatus,
  Contact,
  Lead,
  LeadStatus,
  LeadTemperature,
} from '@/types/database/crm'

export type EntityKind = 'companies' | 'contacts' | 'leads'
export type SortDirection = 'asc' | 'desc'

export type ListFilters = {
  page: number
  pageSize: number
  search: string
  status?: string
  companyId?: string
  ownerId?: string
  sourceId?: string
  temperature?: string
  sort: string
  direction: SortDirection
}

export type Paginated<T> = { rows: T[]; count: number }
export type Option = { value: string; label: string }
export type DuplicateMatch = { id: string; label: string; fields: string[] }

export type CompanyInput = {
  tradeName: string
  legalName: string
  taxId: string
  industry: string
  companySize: string
  employeeCount: number | null
  website: string
  phone: string
  email: string
  city: string
  state: string
  countryCode: string
  notes: string
  ownerMemberId: string
  leadSourceId: string
  status: CompanyStatus
}

export type ContactInput = {
  companyId: string
  firstName: string
  lastName: string
  jobTitle: string
  department: string
  phone: string
  whatsapp: string
  email: string
  linkedinUrl: string
  isPrimary: boolean
  notes: string
}

export type LeadInput = {
  name: string
  companyId: string
  contactId: string
  ownerMemberId: string
  leadSourceId: string
  email: string
  phone: string
  status: LeadStatus
  temperature: LeadTemperature
  score: number
  nextAction: string
  nextContactAt: string
  notes: string
}

export type CrmRecord = Company | Contact | Lead
