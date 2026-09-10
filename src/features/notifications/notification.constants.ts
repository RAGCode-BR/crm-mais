import type { NotificationType } from '@/types/database/system'

export const notificationTypes: NotificationType[] = [
  'task_due',
  'task_overdue',
  'lead_assigned',
  'opportunity_changed',
  'opportunity_stalled',
  'meeting',
  'hot_lead',
  'mention',
  'system',
]

export const notificationTypeLabels: Record<NotificationType, string> = {
  task_due: 'Tarefa próxima',
  task_overdue: 'Tarefa atrasada',
  lead_assigned: 'Lead atribuído',
  opportunity_changed: 'Oportunidade alterada',
  opportunity_stalled: 'Oportunidade parada',
  meeting: 'Reunião',
  hot_lead: 'Lead quente',
  mention: 'Menção',
  system: 'Sistema',
}

const entityPaths: Record<string, string> = {
  company: '/empresas',
  contact: '/contatos',
  lead: '/leads',
  opportunity: '/oportunidades',
  task: '/tarefas',
}

export function notificationPath(entityType: string | null, entityId: string | null) {
  if (!entityType || !entityId || !entityPaths[entityType]) return null
  return `${entityPaths[entityType]}/${entityId}`
}
