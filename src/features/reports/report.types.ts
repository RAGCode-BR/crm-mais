import type {
  DashboardFilters,
  DashboardLookups,
  DashboardPoint,
} from '@/features/dashboard/dashboard.types'

export type ReportFilters = DashboardFilters
export type ReportLookups = DashboardLookups

export type SalesReportMetrics = {
  newLeads: number
  qualifiedLeads: number
  meetings: number
  proposals: number
  negotiations: number
  won: number
  lost: number
  conversionRate: number
  averageTicket: number
  pipelineValue: number
  salesForecast: number
  overdueTasks: number
  openOpportunities: number
  closedRevenue: number
  averageSalesCycleDays: number
}

export type FunnelStep = { label: string; from: number; to: number; rate: number }
export type StageTime = { label: string; averageDays: number; opportunityCount: number }
export type SalesReportData = {
  metrics: SalesReportMetrics
  funnel: FunnelStep[]
  stageTimes: StageTime[]
}

export type ConversionPoint = { label: string; won: number; total: number; rate: number }
export type LossAnalysisData = {
  summary: { won: number; lost: number; lostValue: number; conversionRate: number }
  lossByReason: DashboardPoint[]
  lossByOwner: DashboardPoint[]
  lossByIndustry: DashboardPoint[]
  lossByProduct: DashboardPoint[]
  conversionByOwner: ConversionPoint[]
  conversionBySource: ConversionPoint[]
  conversionByIndustry: ConversionPoint[]
}
