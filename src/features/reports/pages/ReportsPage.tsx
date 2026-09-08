import {
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  Handshake,
  Percent,
  ReceiptText,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { DashboardFilterBar } from '@/features/dashboard/components/DashboardFilterBar'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { dashboardPeriodSchema } from '@/features/dashboard/dashboard.schemas'
import { useOrganization } from '@/features/organizations/useOrganization'

import { ConversionFunnel } from '../components/ConversionFunnel'
import { StageTimeTable } from '../components/StageTimeTable'
import { useReportLookups, useSalesReport } from '../report.hooks'
import { useReportFilters } from '../useReportFilters'

export function ReportsPage() {
  const { activeOrganization } = useOrganization()
  const { filters, queryString, reset, update } = useReportFilters()
  const validPeriod = dashboardPeriodSchema.safeParse({ from: filters.from, to: filters.to })
  const report = useSalesReport(activeOrganization?.organizationId, filters, validPeriod.success)
  const lookups = useReportLookups(activeOrganization?.organizationId)
  const error = validPeriod.success ? undefined : validPeriod.error.issues[0]?.message
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium"
            to={`/relatorios/perdas?${queryString}`}
          >
            <ChartNoAxesCombined className="size-4" /> Análise de perdas
          </Link>
        }
        description="Conversões, ciclo de vendas, receita e saúde do pipeline."
        title="Relatórios comerciais"
      />
      {lookups.isLoading ? (
        <StatePanel kind="loading">Carregando filtros...</StatePanel>
      ) : lookups.error ? (
        <StatePanel kind="error">{lookups.error.message}</StatePanel>
      ) : (
        <DashboardFilterBar
          error={error}
          filters={filters}
          lookups={lookups.data!}
          onChange={update}
          onReset={reset}
        />
      )}
      {report.isLoading ? (
        <StatePanel kind="loading">Calculando relatório...</StatePanel>
      ) : report.error ? (
        <StatePanel kind="error">{report.error.message}</StatePanel>
      ) : report.data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              format="currency"
              icon={ReceiptText}
              label="Receita fechada"
              value={report.data.metrics.closedRevenue}
            />
            <MetricCard
              format="currency"
              icon={CircleDollarSign}
              label="Valor do pipeline"
              value={report.data.metrics.pipelineValue}
            />
            <MetricCard
              format="currency"
              icon={TrendingUp}
              label="Previsão de vendas"
              value={report.data.metrics.salesForecast}
            />
            <MetricCard
              format="currency"
              icon={Handshake}
              label="Ticket médio"
              value={report.data.metrics.averageTicket}
            />
            <MetricCard
              icon={Target}
              label="Oportunidades abertas"
              value={report.data.metrics.openOpportunities}
            />
            <MetricCard
              format="percent"
              icon={Percent}
              label="Conversão final"
              value={report.data.metrics.conversionRate}
            />
            <MetricCard
              icon={Clock3}
              label="Ciclo médio em dias"
              value={report.data.metrics.averageSalesCycleDays}
            />
            <MetricCard
              icon={ChartNoAxesCombined}
              label="Negócios ganhos"
              value={report.data.metrics.won}
            />
          </section>
          <section className="grid gap-4 xl:grid-cols-2">
            <ConversionFunnel steps={report.data.funnel} />
            <StageTimeTable rows={report.data.stageTimes} />
          </section>
        </>
      ) : null}
    </div>
  )
}
