import { supabase } from '@/lib/supabase/client'
import type {
  Company,
  CompanyStatus,
  Contact,
  Lead,
  LeadStatus,
  LeadTemperature,
} from '@/types/database/crm'

import { emptyToNull, normalizeDigits, normalizeEmail, safeSearch } from './crm.schemas'
import type {
  CompanyInput,
  ContactInput,
  DuplicateMatch,
  LeadInput,
  ListFilters,
  Option,
  Paginated,
} from './crm.types'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

const companyColumns =
  'id,organization_id,trade_name,legal_name,tax_id,industry,company_size,employee_count,website,phone,email,city,state,country_code,notes,owner_member_id,lead_source_id,status,archived_at,created_at,updated_at,created_by'
const contactColumns =
  'id,organization_id,company_id,first_name,last_name,job_title,department,phone,whatsapp,email,linkedin_url,is_primary,notes,archived_at,created_at,updated_at,created_by'
const leadColumns =
  'id,organization_id,name,company_id,contact_id,owner_member_id,lead_source_id,email,phone,status,temperature,score,next_action,next_contact_at,notes,archived_at,created_at,updated_at,created_by'

export async function listCompanies(
  organizationId: string,
  filters: ListFilters,
): Promise<Paginated<Company>> {
  let query = client()
    .from('companies')
    .select(companyColumns, { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('archived_at', null)
  const search = safeSearch(filters.search)
  if (search)
    query = query.or(
      `trade_name.ilike.%${search}%,legal_name.ilike.%${search}%,tax_id.ilike.%${search}%,email.ilike.%${search}%`,
    )
  if (filters.status) query = query.eq('status', filters.status as CompanyStatus)
  if (filters.ownerId) query = query.eq('owner_member_id', filters.ownerId)
  if (filters.sourceId) query = query.eq('lead_source_id', filters.sourceId)
  const from = (filters.page - 1) * filters.pageSize
  const { data, error, count } = await query
    .order(filters.sort, { ascending: filters.direction === 'asc' })
    .range(from, from + filters.pageSize - 1)
  if (error) throw error
  return { rows: (data ?? []) as unknown as Company[], count: count ?? 0 }
}

export async function listContacts(
  organizationId: string,
  filters: ListFilters,
): Promise<Paginated<Contact>> {
  let query = client()
    .from('contacts')
    .select(contactColumns, { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('archived_at', null)
  const search = safeSearch(filters.search)
  if (search)
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,whatsapp.ilike.%${search}%`,
    )
  if (filters.companyId) query = query.eq('company_id', filters.companyId)
  const from = (filters.page - 1) * filters.pageSize
  const { data, error, count } = await query
    .order(filters.sort, { ascending: filters.direction === 'asc' })
    .range(from, from + filters.pageSize - 1)
  if (error) throw error
  return { rows: (data ?? []) as unknown as Contact[], count: count ?? 0 }
}

export async function listLeads(
  organizationId: string,
  filters: ListFilters,
): Promise<Paginated<Lead>> {
  let query = client()
    .from('leads')
    .select(leadColumns, { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('archived_at', null)
  const search = safeSearch(filters.search)
  if (search)
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,next_action.ilike.%${search}%`,
    )
  if (filters.status) query = query.eq('status', filters.status as LeadStatus)
  if (filters.companyId) query = query.eq('company_id', filters.companyId)
  if (filters.ownerId) query = query.eq('owner_member_id', filters.ownerId)
  if (filters.sourceId) query = query.eq('lead_source_id', filters.sourceId)
  if (filters.temperature) query = query.eq('temperature', filters.temperature as LeadTemperature)
  const from = (filters.page - 1) * filters.pageSize
  const { data, error, count } = await query
    .order(filters.sort, { ascending: filters.direction === 'asc' })
    .range(from, from + filters.pageSize - 1)
  if (error) throw error
  return { rows: (data ?? []) as unknown as Lead[], count: count ?? 0 }
}

async function getRecord<T>(
  table: 'companies' | 'contacts' | 'leads',
  columns: string,
  organizationId: string,
  id: string,
) {
  const { data, error } = await client()
    .from(table)
    .select(columns)
    .eq('organization_id', organizationId)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as T
}

export const getCompany = (organizationId: string, id: string) =>
  getRecord<Company>('companies', companyColumns, organizationId, id)
export const getContact = (organizationId: string, id: string) =>
  getRecord<Contact>('contacts', contactColumns, organizationId, id)
export const getLead = (organizationId: string, id: string) =>
  getRecord<Lead>('leads', leadColumns, organizationId, id)

const companyPayload = (input: CompanyInput) => ({
  trade_name: input.tradeName.trim(),
  legal_name: emptyToNull(input.legalName),
  tax_id: emptyToNull(normalizeDigits(input.taxId)),
  industry: emptyToNull(input.industry),
  company_size: emptyToNull(input.companySize),
  employee_count: input.employeeCount,
  website: emptyToNull(input.website),
  phone: emptyToNull(normalizeDigits(input.phone)),
  email: emptyToNull(normalizeEmail(input.email)),
  city: emptyToNull(input.city),
  state: emptyToNull(input.state),
  country_code: input.countryCode.trim().toUpperCase(),
  notes: emptyToNull(input.notes),
  owner_member_id: emptyToNull(input.ownerMemberId),
  lead_source_id: emptyToNull(input.leadSourceId),
  status: input.status,
})

const contactPayload = (input: ContactInput) => ({
  company_id: input.companyId,
  first_name: input.firstName.trim(),
  last_name: emptyToNull(input.lastName),
  job_title: emptyToNull(input.jobTitle),
  department: emptyToNull(input.department),
  phone: emptyToNull(normalizeDigits(input.phone)),
  whatsapp: emptyToNull(normalizeDigits(input.whatsapp)),
  email: emptyToNull(normalizeEmail(input.email)),
  linkedin_url: emptyToNull(input.linkedinUrl),
  is_primary: input.isPrimary,
  notes: emptyToNull(input.notes),
})

const leadPayload = (input: LeadInput) => ({
  name: input.name.trim(),
  company_id: emptyToNull(input.companyId),
  contact_id: emptyToNull(input.contactId),
  owner_member_id: emptyToNull(input.ownerMemberId),
  lead_source_id: emptyToNull(input.leadSourceId),
  email: emptyToNull(normalizeEmail(input.email)),
  phone: emptyToNull(normalizeDigits(input.phone)),
  status: input.status,
  temperature: input.temperature,
  score: input.score,
  next_action: emptyToNull(input.nextAction),
  next_contact_at: input.nextContactAt ? new Date(input.nextContactAt).toISOString() : null,
  notes: emptyToNull(input.notes),
})

async function save<T>(
  table: 'companies' | 'contacts' | 'leads',
  columns: string,
  organizationId: string,
  payload: Record<string, unknown>,
  id?: string,
) {
  const query = id
    ? client().from(table).update(payload).eq('organization_id', organizationId).eq('id', id)
    : client()
        .from(table)
        .insert({ ...payload, organization_id: organizationId } as never)
  const { data, error } = await query.select(columns).single()
  if (error) throw error
  return data as unknown as T
}

export const saveCompany = (organizationId: string, input: CompanyInput, id?: string) =>
  save<Company>('companies', companyColumns, organizationId, companyPayload(input), id)

export async function saveContact(organizationId: string, input: ContactInput, id?: string) {
  if (input.isPrimary) {
    let reset = client()
      .from('contacts')
      .update({ is_primary: false })
      .eq('organization_id', organizationId)
      .eq('company_id', input.companyId)
      .eq('is_primary', true)
    if (id) reset = reset.neq('id', id)
    const { error } = await reset
    if (error) throw error
  }
  return save<Contact>('contacts', contactColumns, organizationId, contactPayload(input), id)
}

export const saveLead = (organizationId: string, input: LeadInput, id?: string) =>
  save<Lead>('leads', leadColumns, organizationId, leadPayload(input), id)

export async function archiveRecord(
  table: 'companies' | 'contacts' | 'leads',
  organizationId: string,
  id: string,
) {
  const archived_at = new Date().toISOString()
  const payload = table === 'contacts' ? { archived_at } : { archived_at, status: 'archived' }
  const { error } = await client()
    .from(table)
    .update(payload)
    .eq('organization_id', organizationId)
    .eq('id', id)
  if (error) throw error
}

export async function findCompanyDuplicates(
  organizationId: string,
  input: CompanyInput,
  excludeId?: string,
): Promise<DuplicateMatch[]> {
  const filters: string[] = []
  const taxId = normalizeDigits(input.taxId)
  const email = normalizeEmail(input.email)
  const phone = normalizeDigits(input.phone)
  if (taxId) filters.push(`tax_id.eq.${taxId}`)
  if (email) filters.push(`email.eq.${email}`)
  if (phone) filters.push(`phone.eq.${phone}`)
  if (!filters.length) return []
  let query = client()
    .from('companies')
    .select('id,trade_name,tax_id,email,phone')
    .eq('organization_id', organizationId)
    .or(filters.join(','))
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query.limit(5)
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.trade_name),
    fields: [
      row.tax_id === taxId && 'CNPJ',
      row.email === email && 'e-mail',
      row.phone === phone && 'telefone',
    ].filter(Boolean) as string[],
  }))
}

async function findPersonDuplicates(
  table: 'contacts' | 'leads',
  organizationId: string,
  emailValue: string,
  phoneValue: string,
  excludeId?: string,
): Promise<DuplicateMatch[]> {
  const email = normalizeEmail(emailValue)
  const phone = normalizeDigits(phoneValue)
  const filters = [email && `email.eq.${email}`, phone && `phone.eq.${phone}`].filter(
    Boolean,
  ) as string[]
  if (!filters.length) return []
  const columns =
    table === 'contacts' ? 'id,first_name,last_name,email,phone' : 'id,name,email,phone'
  let query = client()
    .from(table)
    .select(columns)
    .eq('organization_id', organizationId)
    .or(filters.join(','))
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query.limit(5)
  if (error) throw error
  return (data ?? []).map((row) => {
    const record = row as unknown as Record<string, unknown>
    return {
      id: String(record.id),
      label:
        table === 'contacts'
          ? `${String(record.first_name)} ${String(record.last_name ?? '')}`.trim()
          : String(record.name),
      fields: [record.email === email && 'e-mail', record.phone === phone && 'telefone'].filter(
        Boolean,
      ) as string[],
    }
  })
}

export const findContactDuplicates = (
  organizationId: string,
  input: ContactInput,
  excludeId?: string,
) => findPersonDuplicates('contacts', organizationId, input.email, input.phone, excludeId)
export const findLeadDuplicates = (organizationId: string, input: LeadInput, excludeId?: string) =>
  findPersonDuplicates('leads', organizationId, input.email, input.phone, excludeId)

export async function loadCrmLookups(organizationId: string) {
  const db = client()
  const [companiesResult, contactsResult, sourcesResult, membersResult] = await Promise.all([
    db
      .from('companies')
      .select('id,trade_name')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('trade_name'),
    db
      .from('contacts')
      .select('id,company_id,first_name,last_name')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('first_name'),
    db
      .from('lead_sources')
      .select('id,name')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name'),
    db
      .from('organization_members')
      .select('id,profile_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
  ])
  for (const result of [companiesResult, contactsResult, sourcesResult, membersResult])
    if (result.error) throw result.error
  const profileIds = (membersResult.data ?? []).map((member) => String(member.profile_id))
  const profilesResult = profileIds.length
    ? await db.from('profiles').select('id,full_name').in('id', profileIds)
    : { data: [], error: null }
  if (profilesResult.error) throw profilesResult.error
  const profileNames = new Map(
    (profilesResult.data ?? []).map((profile) => [String(profile.id), String(profile.full_name)]),
  )
  return {
    companies: (companiesResult.data ?? []).map((row) => ({
      value: String(row.id),
      label: String(row.trade_name),
    })) as Option[],
    contacts: (contactsResult.data ?? []).map((row) => ({
      value: String(row.id),
      label: `${String(row.first_name)} ${String(row.last_name ?? '')}`.trim(),
      companyId: String(row.company_id),
    })),
    sources: (sourcesResult.data ?? []).map((row) => ({
      value: String(row.id),
      label: String(row.name),
    })) as Option[],
    members: (membersResult.data ?? []).map((row) => ({
      value: String(row.id),
      label: profileNames.get(String(row.profile_id)) ?? 'Usuário',
    })) as Option[],
  }
}
