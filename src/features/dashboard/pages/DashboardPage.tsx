import {
  BadgeDollarSign,
  CalendarCheck,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Handshake,
  ListTodo,
  Percent,
  Target,
  TrendingDown,
  UserRoundCheck,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { useOrganization } from '@/features/organizations/useOrganization'
import { BarChart } from '../components/BarChart'
import { DashboardFilterBar } from '../components/DashboardFilterBar'
import { MetricCard } from '../components/MetricCard'
import { TrendChart } from '../components/TrendChart'
import { dashboardMetrics } from '../dashboard.constants'
import { useDashboard, useDashboardLookups } from '../dashboard.hooks'
import { dashboardPeriodSchema } from '../dashboard.schemas'
import type { DashboardFilters, DashboardMetricKey } from '../dashboard.types'

function dateValue(date: Date) {
  const local = new Date(date)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 10)
}

function defaultPeriod() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return { from: dateValue(from), to: dateValue(to) }
}

const metricIcons = {
  newLeads: Target,
  qualifiedLeads: UserRoundCheck,
  meetings: CalendarCheck,
  proposals: FileText,
  negotiations: Handshake,
  won: ClipboardCheck,
  lost: TrendingDown,
  conversionRate: Percent,
  averageTicket: BadgeDollarSign,
  pipelineValue: CircleDollarSign,
  salesForecast: ChartNoAxesCombined,
  overdueTasks: ListTodo,
} satisfies Record<DashboardMetricKey, typeof Target>

export function DashboardPage() {
  const { activeOrganization } = useOrganization()
  const [params, setParams] = useSearchParams()
  const period = defaultPeriod()
  const filters: DashboardFilters = {
    from: params.get('inicio') ?? period.from,
    to: params.get('fim') ?? period.to,
    ownerId: params.get('responsavel') ?? '',
    teamId: params.get('equipe') ?? '',
    sourceId: params.get('origem') ?? '',
    industry: params.get('segmento') ?? '',
    product: params.get('produto') ?? '',
    pipelineId: params.get('pipeline') ?? '',
  }
  const periodResult = dashboardPeriodSchema.safeParse({ from: filters.from, to: filters.to })
  const periodError = periodResult.success
    ? undefined
    : (periodResult.error.issues[0]?.message ?? 'Período inválido.')
  const organizationId = activeOrganization?.organizationId
  const dashboard = useDashboard(organizationId, filters, periodResult.success)
  const lookups = useDashboardLookups(organizationId)
  const parameterNames: Record<keyof DashboardFilters, string> = {
    from: 'inicio',
    to: 'fim',
    ownerId: 'responsavel',
    teamId: 'equipe',
    sourceId: 'origem',
    industry: 'segmento',
    product: 'produto',
    pipelineId: 'pipeline',
  }
  const update = (key: keyof DashboardFilters, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        const name = parameterNames[key]
        if (value) next.set(name, value)
        else next.delete(name)
        return next
      },
      { replace: true },
    )

  return (
    <div className="space-y-6">
      <PageHeader
        description="Indicadores comerciais para orientar prioridades e decisões da equipe."
        title="Dashboard comercial"
      />
      {lookups.isLoading ? (
        <StatePanel kind="loading">Carregando filtros...</StatePanel>
      ) : lookups.error ? (
        <StatePanel kind="error">{lookups.error.message}</StatePanel>
      ) : (
        <DashboardFilterBar
          error={periodError}
          filters={filters}
          lookups={lookups.data!}
          onChange={update}
          onReset={() => setParams({}, { replace: true })}
        />
      )}
      {dashboard.isLoading ? (
        <StatePanel kind="loading">Calculando indicadores...</StatePanel>
      ) : dashboard.error ? (
        <StatePanel kind="error">{dashboard.error.message}</StatePanel>
      ) : !periodResult.success ? null : dashboard.data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {dashboardMetrics.map((metric) => (
              <MetricCard
                emphasis={metric.emphasis}
                format={metric.format}
                icon={metricIcons[metric.key]}
                key={metric.key}
                label={metric.label}
                value={dashboard.data.metrics[metric.key]}
              />
            ))}
          </section>
          <section className="grid gap-4 xl:grid-cols-2">
            <TrendChart
              data={dashboard.data.leadEvolution}
              description="Novos leads cadastrados por dia."
              title="Evolução dos leads"
            />
            <TrendChart
              data={dashboard.data.salesEvolution}
              description="Receita ganha ao longo do período."
              format="currency"
              title="Vendas por período"
            />
            <BarChart
              data={dashboard.data.opportunitiesByStage}
              description="Distribuição atual dos negócios em aberto."
              title="Oportunidades por etapa"
            />
            <BarChart
              data={dashboard.data.leadsBySource}
              description="Origens que mais trouxeram leads no período."
              title="Origem dos leads"
            />
            <div className="xl:col-span-2">
              <BarChart
                data={dashboard.data.lossReasons}
                description="Principais razões informadas nas oportunidades perdidas."
                title="Motivos de perda"
              />
            </div>
          </section>
        </>
      ) : (
        <StatePanel>Nenhum indicador disponível.</StatePanel>
      )}
    </div>
  )
}
