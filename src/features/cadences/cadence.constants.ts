import type { CadenceEnrollmentStatus, CadenceStatus } from '@/types/database/cadence'
import type { TaskType } from '@/types/database/engagement'

export const cadenceStatuses: Array<{ value: CadenceStatus; label: string }> = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'active', label: 'Ativa' },
  { value: 'paused', label: 'Pausada' },
  { value: 'archived', label: 'Arquivada' },
]

export const cadenceEnrollmentStatuses: Array<{
  value: CadenceEnrollmentStatus
  label: string
}> = [
  { value: 'active', label: 'Em andamento' },
  { value: 'paused', label: 'Pausada' },
  { value: 'completed', label: 'Concluída' },
  { value: 'removed', label: 'Removida' },
]

export const cadenceStepTypes: Array<{ value: TaskType; label: string }> = [
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call', label: 'Ligação' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'general', label: 'Tarefa geral' },
]

export const cadenceTaskTypes = cadenceStepTypes

export const cadenceCanManage = (role?: string) =>
  role === 'owner' || role === 'admin' || role === 'manager'

export const cadenceStatusLabel = (status: string) =>
  cadenceStatuses.find(({ value }) => value === status)?.label ?? status
export const cadenceEnrollmentStatusLabel = (status: string) =>
  cadenceEnrollmentStatuses.find(({ value }) => value === status)?.label ?? status
export const cadenceStepTypeLabel = (type: string) =>
  cadenceStepTypes.find(({ value }) => value === type)?.label ?? type
