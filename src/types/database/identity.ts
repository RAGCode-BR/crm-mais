import type { ISODateTime, MutableOrganizationRecord, MutableRecord, UUID } from './common'

export type OrganizationStatus = 'active' | 'inactive'
export type OrganizationRole = 'owner' | 'admin' | 'manager' | 'sales' | 'viewer'
export type MembershipStatus = 'invited' | 'active' | 'suspended'

export interface Profile {
  id: UUID
  full_name: string
  avatar_url: string | null
  phone: string | null
  timezone: string
  locale: string
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Organization extends MutableRecord {
  name: string
  slug: string
  status: OrganizationStatus
}

export interface Team extends MutableOrganizationRecord {
  name: string
  description: string | null
  is_active: boolean
}

export interface OrganizationMember extends MutableOrganizationRecord {
  profile_id: UUID
  team_id: UUID | null
  role: OrganizationRole
  status: MembershipStatus
  joined_at: ISODateTime | null
}
