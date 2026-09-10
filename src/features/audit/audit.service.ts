import { supabase } from '@/lib/supabase/client'
import type { AuditLog } from '@/types/database/system'
import type { AuditActorOption, AuditFilters, AuditPage } from './audit.types'

const auditColumns =
  'id,organization_id,actor_member_id,entity_type,entity_id,action,previous_values,new_values,ip_address,user_agent,created_at,created_by'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

export async function listAuditActors(organizationId: string): Promise<AuditActorOption[]> {
  const db = client()
  const members = await db
    .from('organization_members')
    .select('id,profile_id')
    .eq('organization_id', organizationId)
  if (members.error) throw members.error
  const profileIds = members.data.map((member) => member.profile_id)
  if (!profileIds.length) return []
  const profiles = await db.from('profiles').select('id,full_name').in('id', profileIds)
  if (profiles.error) throw profiles.error
  const names = new Map(profiles.data.map((profile) => [profile.id, profile.full_name]))
  return members.data
    .map((member) => ({ value: member.id, label: names.get(member.profile_id) ?? 'Usuário' }))
    .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'))
}

export async function listAuditLogs(
  organizationId: string,
  filters: AuditFilters,
): Promise<AuditPage> {
  const db = client()
  let query = db
    .from('audit_logs')
    .select(auditColumns, { count: 'exact' })
    .eq('organization_id', organizationId)
  if (filters.action) query = query.eq('action', filters.action)
  if (filters.actorMemberId) query = query.eq('actor_member_id', filters.actorMemberId)
  if (filters.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters.from)
    query = query.gte('created_at', new Date(`${filters.from}T00:00:00`).toISOString())
  if (filters.to)
    query = query.lte('created_at', new Date(`${filters.to}T23:59:59.999`).toISOString())
  const result = await query
    .order('created_at', { ascending: false })
    .range((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize - 1)
  if (result.error) throw result.error
  const logs = (result.data ?? []) as unknown as AuditLog[]
  const actors = await listAuditActors(organizationId)
  const names = new Map(actors.map((actor) => [actor.value, actor.label]))
  return {
    count: result.count ?? 0,
    items: logs.map((log) => ({
      ...log,
      actorName: log.actor_member_id
        ? (names.get(log.actor_member_id) ?? 'Usuário removido')
        : 'Sistema',
    })),
  }
}
