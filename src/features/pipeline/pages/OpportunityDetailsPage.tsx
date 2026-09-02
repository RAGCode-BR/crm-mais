import { ArrowRight, History, ListTodo, Pencil } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'
import { opportunityStatusLabel } from '../pipeline.constants'
import { useOpportunity, useOpportunityHistory, usePipelineLookups } from '../pipeline.hooks'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const show = (value: unknown) =>
  value === null || value === undefined || value === '' ? '—' : String(value)

export function OpportunityDetailsPage() {
  const { opportunityId } = useParams()
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId ?? ''
  const query = useOpportunity(organizationId, opportunityId)
  const history = useOpportunityHistory(organizationId, opportunityId)
  const lookups = usePipelineLookups(organizationId)
  if (!opportunityId) return <Navigate replace to="/oportunidades" />
  if (query.isLoading || lookups.isLoading)
    return <StatePanel kind="loading">Carregando oportunidade...</StatePanel>
  if (query.error || !query.data)
    return (
      <StatePanel kind="error">{query.error?.message ?? 'Oportunidade não encontrada.'}</StatePanel>
    )
  const row = query.data
  const data = lookups.data
  const pipeline = data?.pipelines.find((item) => item.id === row.pipeline_id)
  const stage = pipeline?.stages.find((item) => item.id === row.stage_id)
  const maps = {
    companies: new Map(data?.companies.map((item) => [item.value, item.label])),
    contacts: new Map(data?.contacts.map((item) => [item.value, item.label])),
    leads: new Map(data?.leads.map((item) => [item.value, item.label])),
    members: new Map(data?.members.map((item) => [item.value, item.label])),
    sources: new Map(data?.sources.map((item) => [item.value, item.label])),
  }
  const fields: Array<[string, unknown]> = [
    ['Empresa', maps.companies.get(row.company_id)],
    ['Contato', maps.contacts.get(row.contact_id ?? '')],
    ['Lead', maps.leads.get(row.lead_id ?? '')],
    ['Responsável', maps.members.get(row.owner_member_id ?? '')],
    ['Pipeline', pipeline?.name],
    ['Etapa', stage?.name],
    ['Estado', opportunityStatusLabel(row.status)],
    ['Valor estimado', currency.format(Number(row.estimated_value))],
    ['Probabilidade', `${row.probability}%`],
    [
      'Previsão de fechamento',
      row.expected_close_date
        ? new Date(`${row.expected_close_date}T12:00:00`).toLocaleDateString('pt-BR')
        : null,
    ],
    ['Produto/serviço', row.product_service],
    ['Origem', maps.sources.get(row.lead_source_id ?? '')],
    ['Motivo de perda', row.loss_reason],
    ['Data de fechamento', row.closed_at ? new Date(row.closed_at).toLocaleString('pt-BR') : null],
    ['Descrição', row.description],
  ]
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex h-10 items-center rounded-md border border-border bg-card px-4 text-sm font-medium"
              to={`/oportunidades?pipeline=${row.pipeline_id}`}
            >
              Voltar ao Kanban
            </Link>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium"
              to={`/timeline?oportunidade=${row.id}`}
            >
              <History className="size-4" />
              Timeline completa
            </Link>
            {roleCanWrite(activeOrganization?.role) ? (
              <>
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium"
                  to={`/tarefas/nova?oportunidade=${row.id}&empresa=${row.company_id}${row.contact_id ? `&contato=${row.contact_id}` : ''}${row.lead_id ? `&lead=${row.lead_id}` : ''}`}
                >
                  <ListTodo className="size-4" />
                  Criar tarefa
                </Link>
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                  to={`/oportunidades/${row.id}/editar`}
                >
                  <Pencil className="size-4" />
                  Editar
                </Link>
              </>
            ) : null}
          </>
        }
        description="Dados comerciais e histórico de movimentações."
        title={row.title}
      />
      <section className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(([label, value]) => (
          <div className="min-h-24 bg-card p-5" key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-2 whitespace-pre-wrap break-words text-sm">{show(value)}</dd>
          </div>
        ))}
      </section>
      <section className="rounded-xl border border-border bg-card">
        <header className="border-b border-border p-5">
          <h2 className="font-semibold">Histórico de etapas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Movimentações registradas automaticamente pelo banco.
          </p>
        </header>
        {history.isLoading ? (
          <div className="p-5">
            <StatePanel kind="loading">Carregando histórico...</StatePanel>
          </div>
        ) : history.error ? (
          <div className="p-5">
            <StatePanel kind="error">{history.error.message}</StatePanel>
          </div>
        ) : history.data?.length ? (
          <ol className="divide-y divide-border">
            {history.data.map((activity) => (
              <li className="flex gap-3 p-5" key={activity.id}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted">
                  <ArrowRight className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{activity.subject}</p>
                  <time className="mt-1 block text-xs text-muted-foreground">
                    {new Date(activity.occurred_at).toLocaleString('pt-BR')}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="p-5">
            <StatePanel>Nenhuma movimentação registrada.</StatePanel>
          </div>
        )}
      </section>
    </div>
  )
}
