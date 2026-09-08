import { supabase } from '@/lib/supabase/client'
import type { DashboardData, DashboardFilters, DashboardLookups } from './dashboard.types'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

function startOfLocalDay(value: string) {
  return new Date(`${value}T00:00:00`).toISOString()
}

function endOfLocalDay(value: string) {
  return new Date(`${value}T23:59:59.999`).toISOString()
}

export async function getDashboard(
  organizationId: string,
  filters: DashboardFilters,
): Promise<DashboardData> {
  const { data, error } = await client().rpc('get_commercial_dashboard', {
    target_organization_id: organizationId,
    period_start: startOfLocalDay(filters.from),
    period_end: endOfLocalDay(filters.to),
    target_owner_member_id: filters.ownerId || null,
    target_team_id: filters.teamId || null,
    target_lead_source_id: filters.sourceId || null,
    target_industry: filters.industry || null,
    target_product_service: filters.product || null,
    target_pipeline_id: filters.pipelineId || null,
  })
  if (error) throw error
  if (!data) throw new Error('O dashboard não retornou dados para o período selecionado.')
  return data as unknown as DashboardData
}

export async function loadDashboardLookups(organizationId: string): Promise<DashboardLookups> {
  const db = client()
  const [members, teams, sources, pipelines, companies, opportunities] = await Promise.all([
    db
      .from('organization_members')
      .select('id,profile_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
    db
      .from('teams')
      .select('id,name')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name'),
    db
      .from('lead_sources')
      .select('id,name')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name'),
    db
      .from('pipelines')
      .select('id,name')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name'),
    db
      .from('companies')
      .select('industry')
      .eq('organization_id', organizationId)
      .not('industry', 'is', null)
      .limit(1000),
    db
      .from('opportunities')
      .select('product_service')
      .eq('organization_id', organizationId)
      .not('product_service', 'is', null)
      .limit(1000),
  ])
  for (const result of [members, teams, sources, pipelines, companies, opportunities]) {
    if (result.error) throw result.error
  }

  const profileIds = (members.data ?? []).map((member) => String(member.profile_id))
  const profiles = profileIds.length
    ? await db.from('profiles').select('id,full_name').in('id', profileIds)
    : { data: [], error: null }
  if (profiles.error) throw profiles.error
  const profileNames = new Map(
    (profiles.data ?? []).map((profile) => [String(profile.id), String(profile.full_name)]),
  )
  const distinctOptions = (values: Array<string | null | undefined>) =>
    [
      ...new Set(
        values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)),
      ),
    ]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((value) => ({ value, label: value }))

  return {
    members: (members.data ?? []).map((member) => ({
      value: String(member.id),
      label: profileNames.get(String(member.profile_id)) ?? 'Usuário',
    })),
    teams: (teams.data ?? []).map((team) => ({ value: String(team.id), label: String(team.name) })),
    sources: (sources.data ?? []).map((source) => ({
      value: String(source.id),
      label: String(source.name),
    })),
    pipelines: (pipelines.data ?? []).map((pipeline) => ({
      value: String(pipeline.id),
      label: String(pipeline.name),
    })),
    industries: distinctOptions((companies.data ?? []).map((company) => company.industry)),
    products: distinctOptions(
      (opportunities.data ?? []).map((opportunity) => opportunity.product_service),
    ),
  }
}
