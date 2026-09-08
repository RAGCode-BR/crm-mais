import type { DashboardMetricKey } from './dashboard.types'

export const dashboardMetrics: Array<{
  key: DashboardMetricKey
  label: string
  format?: 'currency' | 'percent'
  emphasis?: 'success' | 'warning'
}> = [
  { key: 'newLeads', label: 'Leads novos' },
  { key: 'qualifiedLeads', label: 'Leads qualificados' },
  { key: 'meetings', label: 'Reuniões' },
  { key: 'proposals', label: 'Propostas' },
  { key: 'negotiations', label: 'Negociações' },
  { key: 'won', label: 'Ganhos', emphasis: 'success' },
  { key: 'lost', label: 'Perdidos', emphasis: 'warning' },
  { key: 'conversionRate', label: 'Taxa de conversão', format: 'percent' },
  { key: 'averageTicket', label: 'Ticket médio', format: 'currency' },
  { key: 'pipelineValue', label: 'Valor do pipeline', format: 'currency' },
  { key: 'salesForecast', label: 'Previsão de vendas', format: 'currency' },
  { key: 'overdueTasks', label: 'Tarefas atrasadas', emphasis: 'warning' },
]
