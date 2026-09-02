import type { ActivityType } from '@/types/database/engagement'
import type { ManualActivityType } from './timeline.types'

export const activityTypeOptions: Array<{ value: ActivityType; label: string }> = [
  { value: 'call', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'note', label: 'Anotação' },
  { value: 'stage_change', label: 'Mudança de etapa' },
  { value: 'assignment_change', label: 'Mudança de responsável' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'task', label: 'Tarefa' },
  { value: 'system', label: 'Sistema' },
]

export const manualActivityOptions = activityTypeOptions.filter(
  (option): option is { value: ManualActivityType; label: string } =>
    ['call', 'whatsapp', 'email', 'meeting', 'note', 'proposal'].includes(option.value),
)

export const activityTypeLabel = (type: string) =>
  activityTypeOptions.find((option) => option.value === type)?.label ?? type

export const defaultActivitySubject: Record<ManualActivityType, string> = {
  call: 'Ligação realizada',
  whatsapp: 'Contato realizado via WhatsApp',
  email: 'E-mail enviado',
  meeting: 'Reunião agendada',
  note: 'Anotação adicionada',
  proposal: 'Proposta enviada',
}
