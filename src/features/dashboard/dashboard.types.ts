export type DashboardFilters = {
  from: string
  to: string
  ownerId: string
  teamId: string
  sourceId: string
  industry: string
  product: string
  pipelineId: string
}

export type DashboardMetricKey =
  | 'newLeads'
  | 'qualifiedLeads'
  | 'meetings'
  | 'proposals'
  | 'negotiations'
  | 'won'
  | 'lost'
  | 'conversionRate'
  | 'averageTicket'
  | 'pipelineValue'
  | 'salesForecast'
  | 'overdueTasks'

export type DashboardMetrics = Record<DashboardMetricKey, number>

export type DashboardPoint = {
  label: string
  value: number
}

export type DashboardData = {
  metrics: DashboardMetrics
  leadEvolution: DashboardPoint[]
  opportunitiesByStage: DashboardPoint[]
  salesEvolution: DashboardPoint[]
  leadsBySource: DashboardPoint[]
  lossReasons: DashboardPoint[]
}

export type DashboardOption = { value: string; label: string }

export type DashboardLookups = {
  members: DashboardOption[]
  teams: DashboardOption[]
  sources: DashboardOption[]
  pipelines: DashboardOption[]
  industries: DashboardOption[]
  products: DashboardOption[]
}
