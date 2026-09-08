import type { ActivityType } from '@/types/database/engagement'
import type { ProspectingItemStatus, ProspectingListStatus } from '@/types/database/prospecting'

export const prospectingListStatuses: Array<{ value: ProspectingListStatus; label: string }> = [
  { value: 'active', label: 'Ativa' },
  { value: 'paused', label: 'Pausada' },
  { value: 'completed', label: 'Concluída' },
  { value: 'archived', label: 'Arquivada' },
]

export const prospectingItemStatuses: Array<{ value: ProspectingItemStatus; label: string }> = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'qualified', label: 'Qualificado' },
  { value: 'discarded', label: 'Descartado' },
]

export const prospectingActivityTypes: Array<{ value: ActivityType; label: string }> = [
  { value: 'call', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'note', label: 'Anotação' },
]

export const prospectingItemStatusLabel = (value: string) =>
  prospectingItemStatuses.find((option) => option.value === value)?.label ?? value

export const prospectingListStatusLabel = (value: string) =>
  prospectingListStatuses.find((option) => option.value === value)?.label ?? value
