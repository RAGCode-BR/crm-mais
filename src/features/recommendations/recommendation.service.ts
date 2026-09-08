import { supabase } from '@/lib/supabase/client'
import type {
  RecommendationPriority,
  RecommendationRuleCode,
} from '@/types/database/recommendation'

import type {
  CommercialRecommendation,
  RecommendationCategory,
  RecommendationData,
} from './recommendation.types'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

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

export async function loadCommercialRecommendations(
  organizationId: string,
): Promise<RecommendationData> {
  const [result, members] = await Promise.all([
    client().rpc('get_commercial_recommendations', { target_organization_id: organizationId }),
    loadMembers(organizationId),
  ])
  if (result.error) throw result.error
  const memberNames = new Map(members.map(({ value, label }) => [value, label]))
  const recommendations: CommercialRecommendation[] = (result.data ?? []).map((row) => ({
    id: String(row.recommendation_id),
    ruleCode: row.rule_code as RecommendationRuleCode,
    category: row.category as RecommendationCategory,
    priority: row.priority as RecommendationPriority,
    title: String(row.title),
    reason: String(row.reason),
    actionLabel: String(row.action_label),
    actionPath: String(row.action_path),
    entityType: row.entity_type as RecommendationCategory,
    entityId: String(row.entity_id),
    ownerMemberId: row.owner_member_id,
    ownerName: row.owner_member_id
      ? (memberNames.get(row.owner_member_id) ?? 'Usuário')
      : 'Sem responsável',
    score: row.score,
    referenceAt: row.reference_at,
  }))
  return { recommendations, members }
}
