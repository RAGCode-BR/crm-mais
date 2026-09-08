import { emptyToNull, safeSearch } from '@/features/crm/crm.schemas'
import { supabase } from '@/lib/supabase/client'
import type {
  ProspectingItemStatus,
  ProspectingList,
  ProspectingListItem,
  ProspectingListStatus,
} from '@/types/database/prospecting'

import type {
  AddProspectingItemsInput,
  ProspectingCandidate,
  ProspectingItemFilters,
  ProspectingItemRow,
  ProspectingListDetails,
  ProspectingListFilters,
  ProspectingListInput,
  ProspectingListSummary,
  ProspectingLookups,
  RecordProspectingActivityInput,
  UpdateProspectingItemsInput,
  UpdateProspectingListInput,
} from './prospecting.types'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

const listColumns =
  'id,organization_id,name,description,owner_member_id,status,created_at,updated_at,created_by'
const itemColumns =
  'id,organization_id,list_id,company_id,lead_id,assigned_member_id,status,last_action_at,created_at,updated_at,created_by'

async function memberOptions(organizationId: string) {
  const db = client()
  const membersResult = await db
    .from('organization_members')
    .select('id,profile_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
  if (membersResult.error) throw membersResult.error
  const profileIds = (membersResult.data ?? []).map((row) => String(row.profile_id))
  const profilesResult = profileIds.length
    ? await db.from('profiles').select('id,full_name').in('id', profileIds)
    : { data: [], error: null }
  if (profilesResult.error) throw profilesResult.error
  const names = new Map(
    (profilesResult.data ?? []).map((row) => [String(row.id), String(row.full_name)]),
  )
  return (membersResult.data ?? []).map((row) => ({
    value: String(row.id),
    label: names.get(String(row.profile_id)) ?? 'Usuário',
  }))
}

export async function loadProspectingLookups(organizationId: string): Promise<ProspectingLookups> {
  const [members, tagsResult] = await Promise.all([
    memberOptions(organizationId),
    client()
      .from('tags')
      .select('id,name,color')
      .eq('organization_id', organizationId)
      .order('name'),
  ])
  if (tagsResult.error) throw tagsResult.error
  return {
    members,
    tags: (tagsResult.data ?? []).map((row) => ({
      value: String(row.id),
      label: String(row.name),
      color: row.color ? String(row.color) : null,
    })),
  }
}

export async function listProspectingLists(
  organizationId: string,
  filters: ProspectingListFilters,
): Promise<ProspectingListSummary[]> {
  let query = client()
    .from('prospecting_lists')
    .select(listColumns)
    .eq('organization_id', organizationId)
    .neq('status', 'archived')
  const search = safeSearch(filters.search)
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  if (filters.status) query = query.eq('status', filters.status as ProspectingListStatus)
  if (filters.ownerId) query = query.eq('owner_member_id', filters.ownerId)
  const { data, error } = await query.order('updated_at', { ascending: false })
  if (error) throw error
  const lists = (data ?? []) as unknown as ProspectingList[]
  if (!lists.length) return []
  const itemsResult = await client()
    .from('prospecting_list_items')
    .select('list_id,status')
    .eq('organization_id', organizationId)
    .in(
      'list_id',
      lists.map(({ id }) => id),
    )
  if (itemsResult.error) throw itemsResult.error
  const counts = new Map<
    string,
    { itemCount: number; contactedCount: number; qualifiedCount: number }
  >()
  for (const item of itemsResult.data ?? []) {
    const listId = String(item.list_id)
    const current = counts.get(listId) ?? { itemCount: 0, contactedCount: 0, qualifiedCount: 0 }
    current.itemCount += 1
    if (item.status === 'contacted') current.contactedCount += 1
    if (item.status === 'qualified') current.qualifiedCount += 1
    counts.set(listId, current)
  }
  return lists.map((list) => ({
    ...list,
    ...(counts.get(list.id) ?? { itemCount: 0, contactedCount: 0, qualifiedCount: 0 }),
  }))
}

async function matchingEntityIds(organizationId: string, search: string) {
  const term = safeSearch(search)
  if (!term) return null
  const db = client()
  const [companies, leads] = await Promise.all([
    db
      .from('companies')
      .select('id')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .or(`trade_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(100),
    db
      .from('leads')
      .select('id')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(100),
  ])
  if (companies.error) throw companies.error
  if (leads.error) throw leads.error
  return {
    companyIds: (companies.data ?? []).map((row) => String(row.id)),
    leadIds: (leads.data ?? []).map((row) => String(row.id)),
  }
}

export async function getProspectingListDetails(
  organizationId: string,
  listId: string,
  filters: ProspectingItemFilters,
): Promise<ProspectingListDetails> {
  const db = client()
  const [listResult, matches] = await Promise.all([
    db
      .from('prospecting_lists')
      .select(listColumns)
      .eq('organization_id', organizationId)
      .eq('id', listId)
      .single(),
    matchingEntityIds(organizationId, filters.search),
  ])
  if (listResult.error) throw listResult.error
  let query = db
    .from('prospecting_list_items')
    .select(itemColumns, { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('list_id', listId)
  if (filters.status) query = query.eq('status', filters.status as ProspectingItemStatus)
  if (filters.assigneeId) query = query.eq('assigned_member_id', filters.assigneeId)
  if (matches) {
    const clauses: string[] = []
    if (matches.companyIds.length) clauses.push(`company_id.in.(${matches.companyIds.join(',')})`)
    if (matches.leadIds.length) clauses.push(`lead_id.in.(${matches.leadIds.join(',')})`)
    if (!clauses.length)
      return {
        list: listResult.data as unknown as ProspectingList,
        items: { rows: [], count: 0 },
      }
    query = query.or(clauses.join(','))
  }
  const from = (filters.page - 1) * filters.pageSize
  const itemsResult = await query
    .order('created_at', { ascending: false })
    .range(from, from + filters.pageSize - 1)
  if (itemsResult.error) throw itemsResult.error
  const items = (itemsResult.data ?? []) as unknown as ProspectingListItem[]
  const companyIds = items.flatMap((item) => (item.company_id ? [item.company_id] : []))
  const leadIds = items.flatMap((item) => (item.lead_id ? [item.lead_id] : []))
  const [companies, leads, entityTags] = await Promise.all([
    companyIds.length
      ? db
          .from('companies')
          .select('id,trade_name,email,city,state')
          .eq('organization_id', organizationId)
          .in('id', companyIds)
      : Promise.resolve({ data: [], error: null }),
    leadIds.length
      ? db
          .from('leads')
          .select('id,name,email,phone')
          .eq('organization_id', organizationId)
          .in('id', leadIds)
      : Promise.resolve({ data: [], error: null }),
    companyIds.length || leadIds.length
      ? db
          .from('entity_tags')
          .select('tag_id,company_id,lead_id')
          .eq('organization_id', organizationId)
          .or(
            [
              companyIds.length && `company_id.in.(${companyIds.join(',')})`,
              leadIds.length && `lead_id.in.(${leadIds.join(',')})`,
            ]
              .filter(Boolean)
              .join(','),
          )
      : Promise.resolve({ data: [], error: null }),
  ])
  for (const result of [companies, leads, entityTags]) if (result.error) throw result.error
  const companyMap = new Map((companies.data ?? []).map((row) => [String(row.id), row]))
  const leadMap = new Map((leads.data ?? []).map((row) => [String(row.id), row]))
  const tagsByEntity = new Map<string, string[]>()
  for (const row of entityTags.data ?? []) {
    const entityId = String(row.company_id ?? row.lead_id)
    tagsByEntity.set(entityId, [...(tagsByEntity.get(entityId) ?? []), String(row.tag_id)])
  }
  const rows: ProspectingItemRow[] = items.map((item) => {
    if (item.company_id) {
      const company = companyMap.get(item.company_id)
      return {
        ...item,
        entityKind: 'company',
        entityLabel: company ? String(company.trade_name) : 'Empresa indisponível',
        entityDescription:
          [company?.email, company?.city, company?.state].filter(Boolean).join(' · ') ||
          'Sem dados de contato',
        tagIds: tagsByEntity.get(item.company_id) ?? [],
      }
    }
    const lead = leadMap.get(item.lead_id ?? '')
    return {
      ...item,
      entityKind: 'lead',
      entityLabel: lead ? String(lead.name) : 'Lead indisponível',
      entityDescription:
        [lead?.email, lead?.phone].filter(Boolean).join(' · ') || 'Sem dados de contato',
      tagIds: tagsByEntity.get(item.lead_id ?? '') ?? [],
    }
  })
  return {
    list: listResult.data as unknown as ProspectingList,
    items: { rows, count: itemsResult.count ?? 0 },
  }
}

export async function createProspectingList(organizationId: string, input: ProspectingListInput) {
  const { data, error } = await client()
    .from('prospecting_lists')
    .insert({
      organization_id: organizationId,
      name: input.name.trim(),
      description: emptyToNull(input.description),
      owner_member_id: emptyToNull(input.ownerMemberId),
    })
    .select(listColumns)
    .single()
  if (error) throw error
  return data as unknown as ProspectingList
}

export async function searchProspectingCandidates(
  organizationId: string,
  listId: string,
  search: string,
): Promise<ProspectingCandidate[]> {
  const db = client()
  const term = safeSearch(search)
  const [companies, leads, existing] = await Promise.all([
    (() => {
      let query = db
        .from('companies')
        .select('id,trade_name,email,city,state')
        .eq('organization_id', organizationId)
        .is('archived_at', null)
      if (term) query = query.or(`trade_name.ilike.%${term}%,email.ilike.%${term}%`)
      return query.order('trade_name').limit(25)
    })(),
    (() => {
      let query = db
        .from('leads')
        .select('id,name,email,phone')
        .eq('organization_id', organizationId)
        .is('archived_at', null)
      if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`)
      return query.order('name').limit(25)
    })(),
    db
      .from('prospecting_list_items')
      .select('company_id,lead_id')
      .eq('organization_id', organizationId)
      .eq('list_id', listId),
  ])
  for (const result of [companies, leads, existing]) if (result.error) throw result.error
  const existingIds = new Set(
    (existing.data ?? []).flatMap((row) =>
      [row.company_id, row.lead_id].filter(Boolean).map(String),
    ),
  )
  return [
    ...(companies.data ?? []).map((row) => ({
      id: String(row.id),
      kind: 'company' as const,
      label: String(row.trade_name),
      description:
        [row.email, row.city, row.state].filter(Boolean).join(' · ') || 'Sem dados de contato',
    })),
    ...(leads.data ?? []).map((row) => ({
      id: String(row.id),
      kind: 'lead' as const,
      label: String(row.name),
      description: [row.email, row.phone].filter(Boolean).join(' · ') || 'Sem dados de contato',
    })),
  ].filter((candidate) => !existingIds.has(candidate.id))
}

export async function addProspectingItems(
  organizationId: string,
  listId: string,
  input: AddProspectingItemsInput,
) {
  if (!input.candidates.length) return 0
  const rows = input.candidates.map((candidate) => ({
    organization_id: organizationId,
    list_id: listId,
    company_id: candidate.kind === 'company' ? candidate.id : null,
    lead_id: candidate.kind === 'lead' ? candidate.id : null,
    assigned_member_id: emptyToNull(input.assignedMemberId),
  }))
  const { data, error } = await client().from('prospecting_list_items').insert(rows).select('id')
  if (error) throw error
  return data?.length ?? 0
}

export async function removeProspectingItems(
  organizationId: string,
  listId: string,
  itemIds: string[],
) {
  if (!itemIds.length) return
  const { error } = await client()
    .from('prospecting_list_items')
    .delete()
    .eq('organization_id', organizationId)
    .eq('list_id', listId)
    .in('id', itemIds)
  if (error) throw error
}

export async function updateProspectingItems(
  organizationId: string,
  listId: string,
  input: UpdateProspectingItemsInput,
) {
  if (!input.itemIds.length) return
  const payload: Record<string, string | null> = {}
  if (input.status !== undefined) payload.status = input.status
  if (input.assignedMemberId !== undefined) payload.assigned_member_id = input.assignedMemberId
  if (!Object.keys(payload).length) return
  const { error } = await client()
    .from('prospecting_list_items')
    .update(payload)
    .eq('organization_id', organizationId)
    .eq('list_id', listId)
    .in('id', input.itemIds)
  if (error) throw error
}

export async function applyTagsToProspectingItems(
  organizationId: string,
  listId: string,
  itemIds: string[],
  tagIds: string[],
) {
  if (!itemIds.length || !tagIds.length) return 0
  const db = client()
  const items = await db
    .from('prospecting_list_items')
    .select('company_id,lead_id')
    .eq('organization_id', organizationId)
    .eq('list_id', listId)
    .in('id', itemIds)
  if (items.error) throw items.error
  const entityIds = (items.data ?? []).flatMap((row) =>
    [row.company_id, row.lead_id].filter(Boolean).map(String),
  )
  const existing = entityIds.length
    ? await db
        .from('entity_tags')
        .select('tag_id,company_id,lead_id')
        .eq('organization_id', organizationId)
        .in('tag_id', tagIds)
        .or(`company_id.in.(${entityIds.join(',')}),lead_id.in.(${entityIds.join(',')})`)
    : { data: [], error: null }
  if (existing.error) throw existing.error
  const existingKeys = new Set(
    (existing.data ?? []).map(
      (row) => `${String(row.company_id ?? row.lead_id)}:${String(row.tag_id)}`,
    ),
  )
  const rows = (items.data ?? []).flatMap((item) =>
    tagIds
      .filter((tagId) => !existingKeys.has(`${String(item.company_id ?? item.lead_id)}:${tagId}`))
      .map((tagId) => ({
        organization_id: organizationId,
        tag_id: tagId,
        company_id: item.company_id,
        lead_id: item.lead_id,
      })),
  )
  if (!rows.length) return 0
  const result = await db.from('entity_tags').insert(rows).select('id')
  if (result.error) throw result.error
  return result.data?.length ?? 0
}

export async function recordProspectingActivity(
  organizationId: string,
  listId: string,
  input: RecordProspectingActivityInput,
) {
  if (!input.itemIds.length) return 0
  const db = client()
  const items = await db
    .from('prospecting_list_items')
    .select('id,company_id,lead_id')
    .eq('organization_id', organizationId)
    .eq('list_id', listId)
    .in('id', input.itemIds)
  if (items.error) throw items.error
  const now = new Date().toISOString()
  const activities = (items.data ?? []).map((item) => ({
    organization_id: organizationId,
    company_id: item.company_id,
    lead_id: item.lead_id,
    actor_member_id: input.actorMemberId,
    type: input.type,
    subject: input.subject.trim(),
    description: emptyToNull(input.description),
    occurred_at: now,
    metadata: { automatic: false, source: 'prospecting', prospecting_list_id: listId },
  }))
  const activityResult = await db.from('activities').insert(activities).select('id')
  if (activityResult.error) throw activityResult.error
  const updateResult = await db
    .from('prospecting_list_items')
    .update({ last_action_at: now })
    .eq('organization_id', organizationId)
    .eq('list_id', listId)
    .in(
      'id',
      (items.data ?? []).map((item) => String(item.id)),
    )
  if (updateResult.error) throw updateResult.error
  return activityResult.data?.length ?? 0
}

export async function updateProspectingList(
  organizationId: string,
  listId: string,
  input: UpdateProspectingListInput,
) {
  const { error } = await client()
    .from('prospecting_lists')
    .update({ status: input.status })
    .eq('organization_id', organizationId)
    .eq('id', listId)
  if (error) throw error
}
