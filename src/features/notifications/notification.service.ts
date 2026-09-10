import { notificationTypes } from './notification.constants'
import type {
  NotificationFilter,
  NotificationPage,
  NotificationPreferenceItem,
} from './notification.types'
import { supabase } from '@/lib/supabase/client'
import type { NotificationType } from '@/types/database/system'

const pageSize = 20
const refreshes = new Map<string, { expiresAt: number; promise: Promise<void> }>()

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

function refreshNotifications(organizationId: string) {
  const current = refreshes.get(organizationId)
  if (current && current.expiresAt > Date.now()) return current.promise

  const promise = Promise.resolve(
    client().rpc('refresh_my_notifications', { target_organization_id: organizationId }),
  ).then(({ error }) => {
    if (error) throw error
  })
  refreshes.set(organizationId, { expiresAt: Date.now() + 10_000, promise })
  void promise.catch(() => refreshes.delete(organizationId))
  return promise
}

export async function loadNotifications(
  organizationId: string,
  membershipId: string,
  filter: NotificationFilter,
  page: number,
): Promise<NotificationPage> {
  const db = client()
  await refreshNotifications(organizationId)
  let query = db
    .from('notifications')
    .select(
      'id,organization_id,recipient_member_id,type,title,body,related_entity_type,related_entity_id,read_at,dedupe_key,created_at,updated_at,created_by',
      { count: 'exact' },
    )
    .eq('organization_id', organizationId)
    .eq('recipient_member_id', membershipId)
  if (filter === 'unread') query = query.is('read_at', null)
  const result = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)
  if (result.error) throw result.error
  return { items: result.data ?? [], count: result.count ?? 0 }
}

export async function loadUnreadCount(organizationId: string, membershipId: string) {
  const db = client()
  await refreshNotifications(organizationId)
  const result = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('recipient_member_id', membershipId)
    .is('read_at', null)
  if (result.error) throw result.error
  return result.count ?? 0
}

export async function markNotificationRead(id: string, read: boolean) {
  const result = await client()
    .from('notifications')
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq('id', id)
  if (result.error) throw result.error
}

export async function markAllNotificationsRead(organizationId: string, membershipId: string) {
  const result = await client()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('recipient_member_id', membershipId)
    .is('read_at', null)
  if (result.error) throw result.error
}

export async function loadNotificationPreferences(
  organizationId: string,
  membershipId: string,
): Promise<NotificationPreferenceItem[]> {
  const result = await client()
    .from('notification_preferences')
    .select('id,organization_id,member_id,type,in_app_enabled,created_at,updated_at,created_by')
    .eq('organization_id', organizationId)
    .eq('member_id', membershipId)
  if (result.error) throw result.error
  const saved = new Map((result.data ?? []).map((item) => [item.type, item]))
  return notificationTypes.map(
    (type) =>
      saved.get(type) ?? {
        id: null,
        organization_id: organizationId,
        member_id: membershipId,
        type,
        in_app_enabled: true,
        created_at: null,
        updated_at: null,
        created_by: null,
      },
  )
}

export async function setNotificationPreference(
  organizationId: string,
  membershipId: string,
  type: NotificationType,
  enabled: boolean,
  preferenceId: string | null,
) {
  const db = client()
  const result = preferenceId
    ? await db
        .from('notification_preferences')
        .update({ in_app_enabled: enabled })
        .eq('id', preferenceId)
    : await db.from('notification_preferences').insert({
        organization_id: organizationId,
        member_id: membershipId,
        type,
        in_app_enabled: enabled,
      })
  if (result.error) throw result.error
}

export { pageSize as notificationPageSize }
