import type { LeadScoreClassification, LeadScoringRuleType } from '@/types/database/scoring'

export const scoringRuleTypes: Array<{ value: LeadScoringRuleType; label: string; help: string }> =
  [
    {
      value: 'lead_status',
      label: 'Status do lead',
      help: 'Aplica quando o lead possui o status escolhido.',
    },
    {
      value: 'lead_temperature',
      label: 'Temperatura do lead',
      help: 'Aplica quando a temperatura manual corresponde.',
    },
    {
      value: 'company_industry',
      label: 'Segmento da empresa',
      help: 'Compara o segmento da empresa relacionada.',
    },
    {
      value: 'company_employee_min',
      label: 'Mínimo de funcionários',
      help: 'Aplica a partir da quantidade informada.',
    },
    {
      value: 'activity_type_exists',
      label: 'Atividade registrada',
      help: 'Aplica quando existe uma atividade do tipo escolhido.',
    },
    {
      value: 'inactivity_days_min',
      label: 'Dias sem atividade',
      help: 'Aplica após o período mínimo sem atividade.',
    },
  ]

export const leadStatusValues = [
  { value: 'new', label: 'Novo' },
  { value: 'researching', label: 'Em pesquisa' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'qualified', label: 'Qualificado' },
  { value: 'unqualified', label: 'Desqualificado' },
  { value: 'converted', label: 'Convertido' },
]
export const leadTemperatureValues = [
  { value: 'cold', label: 'Frio' },
  { value: 'warm', label: 'Morno' },
  { value: 'hot', label: 'Quente' },
]
export const activityTypeValues = [
  { value: 'call', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'note', label: 'Anotação' },
]

export const classificationLabel: Record<LeadScoreClassification, string> = {
  very_hot: 'Muito quente',
  hot: 'Quente',
  warm: 'Morno',
  cold: 'Frio',
}

export const scoringCanManage = (role?: string) =>
  role === 'owner' || role === 'admin' || role === 'manager'
