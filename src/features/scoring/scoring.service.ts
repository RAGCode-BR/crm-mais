import { supabase } from '@/lib/supabase/client'
import type { LeadScoreClassification, LeadScoringRule } from '@/types/database/scoring'

import type { ScoredLead, ScoringInsights, ScoringRuleInput } from './scoring.types'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

const ruleColumns =
  'id,organization_id,name,description,rule_type,condition_value,points,is_active,created_at,updated_at,created_by'

export async function listScoringRules(organizationId: string) {
  const { data, error } = await client()
    .from('lead_scoring_rules')
    .select(ruleColumns)
    .eq('organization_id', organizationId)
    .order('is_active', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as LeadScoringRule[]
}

export async function getScoringRule(organizationId: string, ruleId: string) {
  const { data, error } = await client()
    .from('lead_scoring_rules')
    .select(ruleColumns)
    .eq('organization_id', organizationId)
    .eq('id', ruleId)
    .single()
  if (error) throw error
  return data as unknown as LeadScoringRule
}

export async function saveScoringRule(
  organizationId: string,
  input: ScoringRuleInput,
  ruleId?: string,
) {
  const payload = {
    organization_id: organizationId,
    name: input.name.trim(),
    description: input.description.trim() || null,
    rule_type: input.ruleType,
    condition_value: input.conditionValue.trim(),
    points: input.points,
    is_active: input.isActive,
  }
  const request = ruleId
    ? client()
        .from('lead_scoring_rules')
        .update(payload)
        .eq('organization_id', organizationId)
        .eq('id', ruleId)
    : client().from('lead_scoring_rules').insert(payload)
  const { data, error } = await request.select(ruleColumns).single()
  if (error) throw error
  return data as unknown as LeadScoringRule
}

export async function deleteScoringRule(organizationId: string, ruleId: string) {
  const { error } = await client()
    .from('lead_scoring_rules')
    .delete()
    .eq('organization_id', organizationId)
    .eq('id', ruleId)
  if (error) throw error
}

export async function recalculateLeadScores(organizationId: string) {
  const { data, error } = await client().rpc('recalculate_organization_lead_scores', {
    target_organization_id: organizationId,
  })
  if (error) throw error
  return Number(data)
}

export async function loadScoringInsights(organizationId: string): Promise<ScoringInsights> {
  const { data, error } = await client().rpc('get_lead_scoring_overview', {
    target_organization_id: organizationId,
  })
  if (error) throw error
  const leads: ScoredLead[] = (data ?? []).map((row) => ({
    id: String(row.lead_id),
    name: String(row.lead_name),
    companyName: String(row.company_name),
    ownerName: String(row.owner_name),
    score: Number(row.score),
    classification: row.classification as LeadScoreClassification,
    breakdown: row.breakdown,
    calculatedAt: row.calculated_at,
    lastActivityAt: row.last_activity_at,
    nextContactAt: row.next_contact_at,
    hasOpenFollowUp: Boolean(row.has_open_follow_up),
  }))
  const now = Date.now()
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  return {
    leads,
    priorityToday: leads.filter(
      (lead) =>
        lead.score >= 60 &&
        Boolean(
          lead.nextContactAt && new Date(lead.nextContactAt).getTime() <= endOfToday.getTime(),
        ),
    ),
    warming: leads.filter((lead) => lead.score >= 40 && lead.score < 60),
    inactive: leads.filter(
      (lead) => !lead.lastActivityAt || new Date(lead.lastActivityAt).getTime() <= thirtyDaysAgo,
    ),
    highWithoutFollowUp: leads.filter((lead) => lead.score >= 60 && !lead.hasOpenFollowUp),
  }
}
