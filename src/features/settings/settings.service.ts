import { supabase } from '@/lib/supabase/client'
import type { Organization } from '@/types/database/identity'

import type {
  CatalogKind,
  CatalogRow,
  MemberUpdate,
  MemberView,
  ProfileInput,
} from './settings.types'
import {
  catalogItemSchema,
  inviteMemberSchema,
  organizationSettingsSchema,
  profileSettingsSchema,
} from './settings.schemas'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

export async function getOrganization(organizationId: string) {
  const { data, error } = await client()
    .from('organizations')
    .select('id,name,slug,status,created_at,updated_at,created_by')
    .eq('id', organizationId)
    .single()
  if (error) throw error
  return data as unknown as Organization
}

export async function updateOrganization(
  organizationId: string,
  input: Pick<Organization, 'name' | 'slug'>,
) {
  const parsed = organizationSettingsSchema.parse(input)
  const { error } = await client().from('organizations').update(parsed).eq('id', organizationId)
  if (error) throw error
}

export async function listCatalog(kind: CatalogKind, organizationId: string) {
  const columns = {
    teams: 'id,organization_id,name,description,is_active,created_at,updated_at,created_by',
    lead_sources: 'id,organization_id,name,description,is_active,created_at,updated_at,created_by',
    tags: 'id,organization_id,name,color,created_at,updated_at,created_by',
    loss_reasons: 'id,organization_id,name,description,is_active,created_at,updated_at,created_by',
  }[kind]
  const { data, error } = await client()
    .from(kind)
    .select(columns)
    .eq('organization_id', organizationId)
    .order('name')
  if (error) throw error
  return (data ?? []) as unknown as CatalogRow[]
}

export async function createCatalogItem(
  kind: CatalogKind,
  organizationId: string,
  input: { name: string; description: string; color: string },
) {
  const parsed = catalogItemSchema.parse(input)
  const payload =
    kind === 'tags'
      ? { organization_id: organizationId, name: parsed.name, color: parsed.color }
      : {
          organization_id: organizationId,
          name: parsed.name,
          description: parsed.description || null,
          is_active: true,
        }
  const { error } = await client()
    .from(kind)
    .insert(payload as never)
  if (error) throw error
}

export async function updateCatalogItem(
  kind: CatalogKind,
  organizationId: string,
  id: string,
  input: { name: string; description: string; color: string; isActive: boolean },
) {
  const parsed = catalogItemSchema.parse(input)
  const payload =
    kind === 'tags'
      ? { name: parsed.name, color: parsed.color }
      : {
          name: parsed.name,
          description: parsed.description || null,
          is_active: input.isActive,
        }
  const { error } = await client()
    .from(kind)
    .update(payload as never)
    .eq('organization_id', organizationId)
    .eq('id', id)
  if (error) throw error
}

export async function deleteCatalogItem(kind: CatalogKind, organizationId: string, id: string) {
  const { error } = await client()
    .from(kind)
    .delete()
    .eq('organization_id', organizationId)
    .eq('id', id)
  if (error) throw error
}

export async function listMembers(organizationId: string): Promise<MemberView[]> {
  const { data, error } = await client()
    .from('organization_members')
    .select(
      'id,organization_id,profile_id,team_id,role,status,joined_at,created_at,updated_at,created_by,profile:profiles!organization_members_profile_id_fkey(id,full_name,avatar_url,phone,timezone,locale,created_at,updated_at)',
    )
    .eq('organization_id', organizationId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as unknown as MemberView[]
}

export async function updateMember(organizationId: string, id: string, input: MemberUpdate) {
  const { error } = await client()
    .from('organization_members')
    .update({ role: input.role, status: input.status, team_id: input.teamId || null })
    .eq('organization_id', organizationId)
    .eq('id', id)
  if (error) throw error
}

export async function inviteMember(
  organizationId: string,
  input: { email: string; role: string; teamId: string },
) {
  const parsed = inviteMemberSchema.parse(input)
  const { data, error } = await client().functions.invoke('invite-member', {
    body: {
      organizationId,
      email: parsed.email,
      role: parsed.role,
      teamId: parsed.teamId || null,
    },
  })
  if (error) throw error
  if (data?.error) throw new Error(String(data.error))
}

export async function getProfile(userId: string) {
  const { data, error } = await client()
    .from('profiles')
    .select('id,full_name,avatar_url,phone,timezone,locale,created_at,updated_at')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, input: ProfileInput) {
  const parsed = profileSettingsSchema.parse(input)
  const { error } = await client()
    .from('profiles')
    .update({
      full_name: parsed.full_name,
      phone: parsed.phone || null,
      timezone: parsed.timezone,
      locale: parsed.locale,
    })
    .eq('id', userId)
  if (error) throw error
}
