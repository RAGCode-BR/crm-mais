import { ArrowLeft, CircleDollarSign, Percent, ThumbsDown, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { BarChart } from '@/features/dashboard/components/BarChart'
import { DashboardFilterBar } from '@/features/dashboard/components/DashboardFilterBar'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { dashboardPeriodSchema } from '@/features/dashboard/dashboard.schemas'
import { useOrganization } from '@/features/organizations/useOrganization'

import { ConversionTable } from '../components/ConversionTable'
import { useLossAnalysis, useReportLookups } from '../report.hooks'
import { useReportFilters } from '../useReportFilters'

export function LossAnalysisPage() {
  const { activeOrganization } = useOrganization()
  const { filters, queryString, reset, update } = useReportFilters()
  const validPeriod = dashboardPeriodSchema.safeParse({ from: filters.from, to: filters.to })
  const analysis = useLossAnalysis(activeOrganization?.organizationId, filters, validPeriod.success)
  const lookups = useReportLookups(activeOrganization?.organizationId)
  const error = validPeriod.success ? undefined : validPeriod.error.issues[0]?.message
  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        to={`/relatorios?${queryString}`}
      >
        <ArrowLeft className="size-4" /> Voltar para relatórios
      </Link>
      <PageHeader
        description="Entenda por que negócios são perdidos e quais contextos convertem melhor."
        title="Análise de perdas"
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
      {analysis.isLoading ? (
        <StatePanel kind="loading">Analisando resultados...</StatePanel>
      ) : analysis.error ? (
        <StatePanel kind="error">{analysis.error.message}</StatePanel>
      ) : analysis.data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={Trophy} label="Ganhos" value={analysis.data.summary.won} />
            <MetricCard icon={ThumbsDown} label="Perdidos" value={analysis.data.summary.lost} />
            <MetricCard
              format="currency"
              icon={CircleDollarSign}
              label="Valor perdido"
              value={analysis.data.summary.lostValue}
            />
            <MetricCard
              format="percent"
              icon={Percent}
              label="Conversão dos encerrados"
              value={analysis.data.summary.conversionRate}
            />
          </section>
          <section className="grid gap-4 xl:grid-cols-2">
            <BarChart
              data={analysis.data.lossByReason}
              description="Motivos registrados ao encerrar oportunidades."
              title="Perdas por motivo"
            />
            <BarChart
              data={analysis.data.lossByOwner}
              description="Distribuição das perdas por responsável."
              title="Perdas por vendedor"
            />
            <BarChart
              data={analysis.data.lossByIndustry}
              description="Segmentos com maior quantidade de perdas."
              title="Perdas por segmento"
            />
            <BarChart
              data={analysis.data.lossByProduct}
              description="Produtos e serviços associados às perdas."
              title="Perdas por produto"
            />
            <ConversionTable
              description="Taxa entre oportunidades ganhas e encerradas."
              rows={analysis.data.conversionByOwner}
              title="Conversão por responsável"
            />
            <ConversionTable
              description="Origens com melhor conversão em negócios encerrados."
              rows={analysis.data.conversionBySource}
              title="Conversão por origem"
            />
            <div className="xl:col-span-2">
              <ConversionTable
                description="Comparação da conversão entre segmentos."
                rows={analysis.data.conversionByIndustry}
                title="Conversão por segmento"
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
