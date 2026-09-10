import type { AuditLog } from '@/types/database/system'

export type AuditAction = 'insert' | 'update' | 'delete'

export type AuditFilters = {
  action: string
  actorMemberId: string
  entityType: string
  from: string
  page: number
  pageSize: number
  to: string
}

export type AuditLogItem = AuditLog & { actorName: string }

export type AuditPage = {
  count: number
  items: AuditLogItem[]
}

export type AuditActorOption = { label: string; value: string }
