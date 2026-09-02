import { FilterX, Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'
import { TimelineItem } from '../components/TimelineItem'
import { activityTypeOptions } from '../timeline.constants'
import { useTimeline, useTimelineLookups } from '../timeline.hooks'
import type { TimelineFilters } from '../timeline.types'

const PAGE_SIZE = 20

export function TimelinePage() {
  const { activeOrganization } = useOrganization()
  const [params, setParams] = useSearchParams()
  const filters: TimelineFilters = {
    page: Math.max(1, Number(params.get('pagina')) || 1),
    pageSize: PAGE_SIZE,
    search: params.get('busca') ?? '',
    type: params.get('tipo') ?? '',
    companyId: params.get('empresa') ?? '',
    contactId: params.get('contato') ?? '',
    leadId: params.get('lead') ?? '',
    opportunityId: params.get('oportunidade') ?? '',
    from: params.get('inicio') ?? '',
    to: params.get('fim') ?? '',
  }
  const organizationId = activeOrganization?.organizationId
  const query = useTimeline(organizationId, filters)
  const lookups = useTimelineLookups(organizationId)
  const update = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'pagina') next.delete('pagina')
        return next
      },
      { replace: true },
    )
  const hasEntityFilter = Boolean(
    filters.companyId || filters.contactId || filters.leadId || filters.opportunityId,
  )
  const activityContext = new URLSearchParams()
  if (filters.companyId) activityContext.set('empresa', filters.companyId)
  if (filters.contactId) activityContext.set('contato', filters.contactId)
  if (filters.leadId) activityContext.set('lead', filters.leadId)
  if (filters.opportunityId) activityContext.set('oportunidade', filters.opportunityId)
  const newActivityPath = `/timeline/nova${activityContext.size ? `?${activityContext.toString()}` : ''}`
  const maps = {
    companies: new Map(lookups.data?.companies.map((item) => [item.value, item.label])),
    contacts: new Map(lookups.data?.contacts.map((item) => [item.value, item.label])),
    leads: new Map(lookups.data?.leads.map((item) => [item.value, item.label])),
    opportunities: new Map(lookups.data?.opportunities.map((item) => [item.value, item.label])),
    members: new Map(lookups.data?.members.map((item) => [item.value, item.label])),
  }
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          roleCanWrite(activeOrganization?.role) ? (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              to={newActivityPath}
            >
              <Plus className="size-4" />
              Registrar atividade
            </Link>
          ) : undefined
        }
        description="Histórico cronológico de ações manuais e eventos automáticos da organização."
        title="Timeline"
      />
      <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
        <Input
          aria-label="Buscar na timeline"
          onChange={(event) => update('busca', event.target.value)}
          placeholder="Buscar atividade..."
          value={filters.search}
        />
        <Select
          aria-label="Tipo de atividade"
          onChange={(event) => update('tipo', event.target.value)}
          value={filters.type}
        >
          <option value="">Todos os tipos</option>
          {activityTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          aria-label="Data inicial"
          onChange={(event) => update('inicio', event.target.value)}
          type="date"
          value={filters.from}
        />
        <Input
          aria-label="Data final"
          onChange={(event) => update('fim', event.target.value)}
          type="date"
          value={filters.to}
        />
        {hasEntityFilter ? (
          <Button
            onClick={() =>
              setParams(
                (current) => {
                  const next = new URLSearchParams(current)
                  for (const key of ['empresa', 'contato', 'lead', 'oportunidade', 'pagina'])
                    next.delete(key)
                  return next
                },
                { replace: true },
              )
            }
            variant="outline"
          >
            <FilterX className="size-4" />
            Remover vínculo
          </Button>
        ) : (
          <div className="hidden xl:block" />
        )}
      </section>
      {query.isLoading || lookups.isLoading ? (
        <StatePanel kind="loading">Carregando histórico...</StatePanel>
      ) : query.error || lookups.error ? (
        <StatePanel kind="error">{query.error?.message ?? lookups.error?.message}</StatePanel>
      ) : query.data?.rows.length ? (
        <section className="relative">
          <div className="absolute bottom-5 left-5 top-5 w-px bg-border" />
          <ol>
            {query.data.rows.map((activity) => (
              <TimelineItem activity={activity} key={activity.id} maps={maps} />
            ))}
          </ol>
          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            <Pagination
              count={query.data.count}
              onChange={(page) => update('pagina', String(page))}
              page={filters.page}
              pageSize={filters.pageSize}
            />
          </div>
        </section>
      ) : (
        <StatePanel>Nenhuma atividade encontrada para os filtros selecionados.</StatePanel>
      )}
    </div>
  )
}
