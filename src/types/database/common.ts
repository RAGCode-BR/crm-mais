export type UUID = string
export type ISODate = string
export type ISODateTime = string

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface CreatedRecord {
  id: UUID
  created_at: ISODateTime
  created_by: UUID | null
}

export interface MutableRecord extends CreatedRecord {
  updated_at: ISODateTime
}

export interface OrganizationRecord extends CreatedRecord {
  organization_id: UUID
}

export interface MutableOrganizationRecord extends MutableRecord {
  organization_id: UUID
}
