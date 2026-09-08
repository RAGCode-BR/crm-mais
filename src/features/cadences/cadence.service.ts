import { safeSearch } from '@/features/crm/crm.schemas'
import { supabase } from '@/lib/supabase/client'
import type {
  Cadence,
  CadenceEnrollment,
  CadenceEnrollmentStatus,
  CadenceStatus,
  CadenceStep,
} from '@/types/database/cadence'

import type {
  CadenceDetails,
  CadenceEnrollmentFilters,
  CadenceEnrollmentRow,
  CadenceFilters,
  CadenceInput,
  CadenceLookups,
  CadenceSummary,
  EnrollLeadsInput,
  SetEnrollmentStatusInput,
} from './cadence.types'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

const cadenceColumns = 'id,organization_id,name,description,status,created_at,updated_at,created_by'
const stepColumns =
  'id,organization_id,cadence_id,position,day_number,type,title,description,created_at,updated_at,created_by'
const enrollmentColumns =
  'id,organization_id,cadence_id,lead_id,assigned_member_id,status,started_at,current_step_position,next_step_due_at,paused_at,completed_at,removed_at,created_at,updated_at,created_by'

async function loadMembers(organizationId: string) {
  const db = client()
  const members = await db
    .from('organization_members')
    .select('id,profile_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
  if (members.error) throw members.error
  const profileIds = (members.data ?? []).map(({ profile_id }) => String(profile_id))
  const profiles = profileIds.length
    ? await db.from('profiles').select('id,full_name').in('id', profileIds)
    : { data: [], error: null }
  if (profiles.error) throw profiles.error
  const names = new Map(
    (profiles.data ?? []).map((profile) => [String(profile.id), String(profile.full_name)]),
  )
  return (members.data ?? []).map((member) => ({
    value: String(member.id),
    label: names.get(String(member.profile_id)) ?? 'Usuário',
  }))
}

export async function loadCadenceLookups(organizationId: string): Promise<CadenceLookups> {
  const [members, leads] = await Promise.all([
    loadMembers(organizationId),
    client()
      .from('leads')
      .select('id,name,email,phone')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('name')
      .limit(200),
  ])
  if (leads.error) throw leads.error
  return {
    members,
    leads: (leads.data ?? []).map((lead) => ({
      value: String(lead.id),
      label: String(lead.name),
      description: [lead.email, lead.phone].filter(Boolean).join(' · ') || 'Sem dados de contato',
    })),
  }
}

export async function listCadences(
  organizationId: string,
  filters: CadenceFilters,
): Promise<CadenceSummary[]> {
  let query = client()
    .from('cadences')
    .select(cadenceColumns)
    .eq('organization_id', organizationId)
    .neq('status', 'archived')
  const search = safeSearch(filters.search)
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  if (filters.status) query = query.eq('status', filters.status as CadenceStatus)
  const cadences = await query.order('updated_at', { ascending: false })
  if (cadences.error) throw cadences.error
  const rows = (cadences.data ?? []) as unknown as Cadence[]
  if (!rows.length) return []
  const ids = rows.map(({ id }) => id)
  const [steps, enrollments] = await Promise.all([
    client()
      .from('cadence_steps')
      .select('cadence_id')
      .eq('organization_id', organizationId)
      .in('cadence_id', ids),
    client()
      .from('cadence_enrollments')
      .select('cadence_id,status')
      .eq('organization_id', organizationId)
      .in('cadence_id', ids),
  ])
  if (steps.error) throw steps.error
  if (enrollments.error) throw enrollments.error
  return rows.map((cadence) => ({
    ...cadence,
    stepCount: (steps.data ?? []).filter(({ cadence_id }) => cadence_id === cadence.id).length,
    activeEnrollmentCount: (enrollments.data ?? []).filter(
      ({ cadence_id, status }) => cadence_id === cadence.id && status === 'active',
    ).length,
    completedEnrollmentCount: (enrollments.data ?? []).filter(
      ({ cadence_id, status }) => cadence_id === cadence.id && status === 'completed',
    ).length,
  }))
}

export async function getCadence(
  organizationId: string,
  cadenceId: string,
): Promise<{ cadence: Cadence; steps: CadenceStep[] }> {
  const [cadence, steps] = await Promise.all([
    client()
      .from('cadences')
      .select(cadenceColumns)
      .eq('organization_id', organizationId)
      .eq('id', cadenceId)
      .single(),
    client()
      .from('cadence_steps')
      .select(stepColumns)
      .eq('organization_id', organizationId)
      .eq('cadence_id', cadenceId)
      .order('position'),
  ])
  if (cadence.error) throw cadence.error
  if (steps.error) throw steps.error
  return {
    cadence: cadence.data as unknown as Cadence,
    steps: (steps.data ?? []) as unknown as CadenceStep[],
  }
}

export async function getCadenceDetails(
  organizationId: string,
  cadenceId: string,
  filters: CadenceEnrollmentFilters,
): Promise<CadenceDetails> {
  const db = client()
  const base = await getCadence(organizationId, cadenceId)
  let query = db
    .from('cadence_enrollments')
    .select(enrollmentColumns, { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('cadence_id', cadenceId)
  if (filters.status) query = query.eq('status', filters.status as CadenceEnrollmentStatus)
  const from = (filters.page - 1) * filters.pageSize
  const enrollments = await query
    .order('updated_at', { ascending: false })
    .range(from, from + filters.pageSize - 1)
  if (enrollments.error) throw enrollments.error
  const rows = (enrollments.data ?? []) as unknown as CadenceEnrollment[]
  const leadIds = [...new Set(rows.map(({ lead_id }) => lead_id))]
  const assigneeIds = [...new Set(rows.map(({ assigned_member_id }) => assigned_member_id))]
  const [leads, members] = await Promise.all([
    leadIds.length
      ? db
          .from('leads')
          .select('id,name,email,phone')
          .eq('organization_id', organizationId)
          .in('id', leadIds)
      : Promise.resolve({ data: [], error: null }),
    loadMembers(organizationId),
  ])
  if (leads.error) throw leads.error
  const leadMap = new Map((leads.data ?? []).map((lead) => [String(lead.id), lead]))
  const memberMap = new Map(
    members
      .filter(({ value }) => assigneeIds.includes(value))
      .map(({ value, label }) => [value, label]),
  )
  const enriched: CadenceEnrollmentRow[] = rows.map((row) => {
    const lead = leadMap.get(row.lead_id)
    return {
      ...row,
      leadName: lead ? String(lead.name) : 'Lead indisponível',
      leadDescription:
        [lead?.email, lead?.phone].filter(Boolean).join(' · ') || 'Sem dados de contato',
      assigneeName: memberMap.get(row.assigned_member_id) ?? 'Usuário',
    }
  })
  return {
    ...base,
    enrollments: { rows: enriched, count: enrollments.count ?? 0 },
  }
}

export async function saveCadence(organizationId: string, input: CadenceInput, cadenceId?: string) {
  const { data, error } = await client().rpc('save_cadence_configuration', {
    target_organization_id: organizationId,
    target_cadence_id: cadenceId ?? null,
    cadence_name: input.name.trim(),
    cadence_description: input.description.trim(),
    cadence_status: input.status,
    steps: input.steps.map((step) => ({
      dayNumber: step.dayNumber,
      type: step.type,
      title: step.title.trim(),
      description: step.description.trim(),
    })),
  })
  if (error) throw error
  return String(data)
}

export async function enrollLeads(
  organizationId: string,
  cadenceId: string,
  input: EnrollLeadsInput,
) {
  if (!input.leadIds.length) return 0
  const rows = input.leadIds.map((leadId) => ({
    organization_id: organizationId,
    cadence_id: cadenceId,
    lead_id: leadId,
    assigned_member_id: input.assignedMemberId,
  }))
  const { data, error } = await client().from('cadence_enrollments').insert(rows).select('id')
  if (error) throw error
  return data?.length ?? 0
}

export async function setCadenceEnrollmentStatus(input: SetEnrollmentStatusInput) {
  const { data, error } = await client().rpc('set_cadence_enrollment_status', {
    target_enrollment_id: input.enrollmentId,
    target_status: input.status,
  })
  if (error) throw error
  return data as unknown as CadenceEnrollment
}

export async function listActiveCadenceOptions(organizationId: string) {
  const { data, error } = await client()
    .from('cadences')
    .select('id,name')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('name')
  if (error) throw error
  return (data ?? []).map((cadence) => ({
    value: String(cadence.id),
    label: String(cadence.name),
  }))
}

export async function enrollProspectingItems(
  organizationId: string,
  cadenceId: string,
  prospectingListId: string,
  itemIds: string[],
  assignedMemberId: string,
) {
  if (!itemIds.length) return { enrolled: 0, skippedCompanies: 0 }
  const items = await client()
    .from('prospecting_list_items')
    .select('lead_id,company_id')
    .eq('organization_id', organizationId)
    .eq('list_id', prospectingListId)
    .in('id', itemIds)
  if (items.error) throw items.error
  const leadIds = (items.data ?? []).flatMap(({ lead_id }) => (lead_id ? [String(lead_id)] : []))
  const enrolled = await enrollLeads(organizationId, cadenceId, {
    leadIds,
    assignedMemberId,
  })
  return { enrolled, skippedCompanies: (items.data?.length ?? 0) - leadIds.length }
}
