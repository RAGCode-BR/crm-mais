import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NotificationType } from '@/types/database/system'

import {
  loadNotificationPreferences,
  loadNotifications,
  loadUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  setNotificationPreference,
} from './notification.service'
import type { NotificationFilter } from './notification.types'

const keys = {
  all: (organizationId?: string) => ['notifications', organizationId] as const,
  list: (organizationId: string | undefined, filter: NotificationFilter, page: number) =>
    [...keys.all(organizationId), filter, page] as const,
  unread: (organizationId?: string) => [...keys.all(organizationId), 'unread-count'] as const,
  preferences: (organizationId?: string) => [...keys.all(organizationId), 'preferences'] as const,
}

export function useNotifications(
  organizationId: string | undefined,
  membershipId: string | undefined,
  filter: NotificationFilter,
  page: number,
) {
  return useQuery({
    queryKey: keys.list(organizationId, filter, page),
    queryFn: () => loadNotifications(organizationId!, membershipId!, filter, page),
    enabled: Boolean(organizationId && membershipId),
    refetchInterval: 60_000,
  })
}

export function useUnreadNotificationCount(
  organizationId: string | undefined,
  membershipId: string | undefined,
) {
  return useQuery({
    queryKey: keys.unread(organizationId),
    queryFn: () => loadUnreadCount(organizationId!, membershipId!),
    enabled: Boolean(organizationId && membershipId),
    refetchInterval: 60_000,
  })
}

export function useNotificationActions(organizationId?: string, membershipId?: string) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.all(organizationId) })
  const markRead = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => markNotificationRead(id, read),
    onSuccess: refresh,
  })
  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(organizationId!, membershipId!),
    onSuccess: refresh,
  })
  return { markRead, markAllRead }
}

export function useNotificationPreferences(organizationId?: string, membershipId?: string) {
  return useQuery({
    queryKey: keys.preferences(organizationId),
    queryFn: () => loadNotificationPreferences(organizationId!, membershipId!),
    enabled: Boolean(organizationId && membershipId),
  })
}

export function useSetNotificationPreference(organizationId?: string, membershipId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      enabled,
      id,
      type,
    }: {
      enabled: boolean
      id: string | null
      type: NotificationType
    }) => setNotificationPreference(organizationId!, membershipId!, type, enabled, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.preferences(organizationId) }),
  })
}
