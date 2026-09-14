import type { DashboardMetricKey } from './dashboard.types'

export const dashboardMetrics: Array<{
  key: DashboardMetricKey
  label: string
  format?: 'currency' | 'percent'
  emphasis?: 'success' | 'warning'
  tone?: 'blue' | 'cyan' | 'violet' | 'green' | 'amber' | 'rose'
}> = [
  { key: 'newLeads', label: 'Leads novos', tone: 'blue' },
  { key: 'qualifiedLeads', label: 'Leads qualificados', tone: 'cyan' },
  { key: 'meetings', label: 'Reuniões', tone: 'violet' },
  { key: 'proposals', label: 'Propostas', tone: 'violet' },
  { key: 'negotiations', label: 'Negociações', tone: 'blue' },
  { key: 'won', label: 'Ganhos', emphasis: 'success', tone: 'green' },
  { key: 'lost', label: 'Perdidos', emphasis: 'warning', tone: 'rose' },
  { key: 'conversionRate', label: 'Taxa de conversão', format: 'percent', tone: 'cyan' },
  { key: 'averageTicket', label: 'Ticket médio', format: 'currency', tone: 'violet' },
  { key: 'pipelineValue', label: 'Valor do pipeline', format: 'currency', tone: 'blue' },
  { key: 'salesForecast', label: 'Previsão de vendas', format: 'currency', tone: 'green' },
  { key: 'overdueTasks', label: 'Tarefas atrasadas', emphasis: 'warning', tone: 'amber' },
]
