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
  Sparkles,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
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
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50/70 px-5 py-6 sm:px-7 sm:py-7 dark:border-blue-950 dark:from-blue-950/30 dark:via-card dark:to-cyan-950/20">
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-blue-200/35 blur-3xl dark:bg-blue-700/15" />
        <div className="relative flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
              Visão geral
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Dashboard comercial
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Indicadores comerciais para orientar prioridades e decisões da equipe.
            </p>
          </div>
        </div>
      </section>
      {dashboard.isLoading ? (
        <StatePanel kind="loading">Calculando indicadores...</StatePanel>
      ) : dashboard.error ? (
        <StatePanel kind="error">{dashboard.error.message}</StatePanel>
      ) : !periodResult.success ? (
        <>
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
          <StatePanel kind="error">Ajuste o período para exibir os indicadores.</StatePanel>
        </>
      ) : dashboard.data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {dashboardMetrics.map((metric) => (
              <MetricCard
                emphasis={metric.emphasis}
                format={metric.format}
                icon={metricIcons[metric.key]}
                key={metric.key}
                label={metric.label}
                tone={metric.tone}
                value={dashboard.data.metrics[metric.key]}
              />
            ))}
          </section>
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
              tone="green"
              title="Vendas por período"
            />
            <BarChart
              data={dashboard.data.opportunitiesByStage}
              description="Distribuição atual dos negócios em aberto."
              title="Oportunidades por etapa"
              tone="violet"
            />
            <BarChart
              data={dashboard.data.leadsBySource}
              description="Origens que mais trouxeram leads no período."
              title="Origem dos leads"
              tone="cyan"
            />
            <div className="xl:col-span-2">
              <BarChart
                data={dashboard.data.lossReasons}
                description="Principais razões informadas nas oportunidades perdidas."
                title="Motivos de perda"
                tone="amber"
              />
            </div>
          </section>
        </>
      ) : (
        <>
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
          <StatePanel>Nenhum indicador disponível.</StatePanel>
        </>
      )}
    </div>
  )
}
