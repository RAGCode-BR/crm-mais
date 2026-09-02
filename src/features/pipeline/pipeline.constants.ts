import type { OpportunityStatus } from '@/types/database/pipeline'

export const opportunityStatusOptions: Array<{ value: OpportunityStatus; label: string }> = [
  { value: 'open', label: 'Em aberto' },
  { value: 'no_response', label: 'Sem resposta' },
  { value: 'discarded', label: 'Descartado' },
  { value: 'lost', label: 'Perdido' },
  { value: 'reactivate_later', label: 'Reativar futuramente' },
  { value: 'won', label: 'Ganho' },
]

export function opportunityStatusLabel(status: string) {
  return opportunityStatusOptions.find((option) => option.value === status)?.label ?? status
}

export const pipelineCanManage = (role?: string) =>
  role === 'owner' || role === 'admin' || role === 'manager'
