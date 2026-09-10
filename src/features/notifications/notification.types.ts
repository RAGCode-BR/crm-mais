import type { Notification, NotificationPreference } from '@/types/database/system'

export type NotificationFilter = 'all' | 'unread'
export type NotificationPage = { items: Notification[]; count: number }
export type NotificationPreferenceItem =
  | NotificationPreference
  | {
      id: null
      organization_id: string
      member_id: string
      type: NotificationPreference['type']
      in_app_enabled: true
      created_at: null
      updated_at: null
      created_by: null
    }
