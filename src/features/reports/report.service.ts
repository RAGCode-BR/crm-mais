import { loadDashboardLookups } from '@/features/dashboard/dashboard.service'
import { supabase } from '@/lib/supabase/client'

import type { LossAnalysisData, ReportFilters, SalesReportData } from './report.types'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

function startOfLocalDay(value: string) {
  return new Date(`${value}T00:00:00`).toISOString()
}

function endOfLocalDay(value: string) {
  return new Date(`${value}T23:59:59.999`).toISOString()
}

function reportArguments(organizationId: string, filters: ReportFilters) {
  return {
    target_organization_id: organizationId,
    period_start: startOfLocalDay(filters.from),
    period_end: endOfLocalDay(filters.to),
    target_owner_member_id: filters.ownerId || null,
    target_team_id: filters.teamId || null,
    target_lead_source_id: filters.sourceId || null,
    target_industry: filters.industry || null,
    target_product_service: filters.product || null,
    target_pipeline_id: filters.pipelineId || null,
  }
}

export async function getSalesReport(organizationId: string, filters: ReportFilters) {
  const { data, error } = await client().rpc(
    'get_sales_report',
    reportArguments(organizationId, filters),
  )
  if (error) throw error
  if (!data) throw new Error('O relatório não retornou dados para o período selecionado.')
  return data as unknown as SalesReportData
}

export async function getLossAnalysis(organizationId: string, filters: ReportFilters) {
  const { data, error } = await client().rpc(
    'get_loss_analysis',
    reportArguments(organizationId, filters),
  )
  if (error) throw error
  if (!data) throw new Error('A análise de perdas não retornou dados para o período selecionado.')
  return data as unknown as LossAnalysisData
}

export const loadReportLookups = loadDashboardLookups
