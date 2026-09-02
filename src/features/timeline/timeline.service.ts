import { emptyToNull, safeSearch } from '@/features/crm/crm.schemas'
import { loadPipelineLookups } from '@/features/pipeline/pipeline.service'
import { supabase } from '@/lib/supabase/client'
import type { Activity, ActivityType } from '@/types/database/engagement'
import type { Paginated } from '@/features/crm/crm.types'
import type { ActivityInput, TimelineFilters, TimelineOpportunityOption } from './timeline.types'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

const activityColumns =
  'id,organization_id,company_id,contact_id,lead_id,opportunity_id,actor_member_id,type,subject,description,occurred_at,metadata,created_at,updated_at,created_by'

export async function listTimeline(
  organizationId: string,
  filters: TimelineFilters,
): Promise<Paginated<Activity>> {
  let query = client()
    .from('activities')
    .select(activityColumns, { count: 'exact' })
    .eq('organization_id', organizationId)
  const search = safeSearch(filters.search)
  if (search) query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%`)
  if (filters.type) query = query.eq('type', filters.type as ActivityType)
  if (filters.companyId) query = query.eq('company_id', filters.companyId)
  if (filters.contactId) query = query.eq('contact_id', filters.contactId)
  if (filters.leadId) query = query.eq('lead_id', filters.leadId)
  if (filters.opportunityId) query = query.eq('opportunity_id', filters.opportunityId)
  if (filters.from)
    query = query.gte('occurred_at', new Date(`${filters.from}T00:00:00`).toISOString())
  if (filters.to)
    query = query.lte('occurred_at', new Date(`${filters.to}T23:59:59.999`).toISOString())
  const from = (filters.page - 1) * filters.pageSize
  const { data, error, count } = await query
    .order('occurred_at', { ascending: false })
    .range(from, from + filters.pageSize - 1)
  if (error) throw error
  return { rows: (data ?? []) as unknown as Activity[], count: count ?? 0 }
}

export async function createActivity(
  organizationId: string,
  actorMemberId: string,
  input: ActivityInput,
) {
  const { data, error } = await client()
    .from('activities')
    .insert({
      organization_id: organizationId,
      actor_member_id: actorMemberId,
      type: input.type,
      subject: input.subject.trim(),
      description: emptyToNull(input.description),
      occurred_at: new Date(input.occurredAt).toISOString(),
      company_id: emptyToNull(input.companyId),
      contact_id: emptyToNull(input.contactId),
      lead_id: emptyToNull(input.leadId),
      opportunity_id: emptyToNull(input.opportunityId),
      metadata: { automatic: false, source: 'manual' },
    })
    .select(activityColumns)
    .single()
  if (error) throw error
  return data as unknown as Activity
}

export async function loadTimelineLookups(organizationId: string) {
  const [base, opportunitiesResult] = await Promise.all([
    loadPipelineLookups(organizationId),
    client()
      .from('opportunities')
      .select('id,title,company_id,contact_id,lead_id')
      .eq('organization_id', organizationId)
      .order('title'),
  ])
  if (opportunitiesResult.error) throw opportunitiesResult.error
  return {
    ...base,
    opportunities: (opportunitiesResult.data ?? []).map((row) => ({
      value: String(row.id),
      label: String(row.title),
      companyId: String(row.company_id),
      contactId: row.contact_id ? String(row.contact_id) : '',
      leadId: row.lead_id ? String(row.lead_id) : '',
    })) as TimelineOpportunityOption[],
  }
}
