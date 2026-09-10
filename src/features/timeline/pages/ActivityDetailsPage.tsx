import { Link, Navigate, useParams } from 'react-router-dom'
import { AttachmentPanel } from '@/features/attachments/components/AttachmentPanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { useOrganization } from '@/features/organizations/useOrganization'
import { activityTypeLabel } from '../timeline.constants'
import { useActivity, useTimelineLookups } from '../timeline.hooks'

const show = (value?: string | null) => value || '—'

export function ActivityDetailsPage() {
  const { activityId } = useParams()
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId
  const query = useActivity(organizationId, activityId)
  const lookups = useTimelineLookups(organizationId)
  if (!activityId) return <Navigate replace to="/timeline" />
  if (query.isLoading || lookups.isLoading)
    return <StatePanel kind="loading">Carregando atividade...</StatePanel>
  if (query.error || !query.data)
    return (
      <StatePanel kind="error">{query.error?.message ?? 'Atividade não encontrada.'}</StatePanel>
    )

  const activity = query.data
  const data = lookups.data
  const maps = {
    companies: new Map(data?.companies.map((item) => [item.value, item.label])),
    contacts: new Map(data?.contacts.map((item) => [item.value, item.label])),
    leads: new Map(data?.leads.map((item) => [item.value, item.label])),
    opportunities: new Map(data?.opportunities.map((item) => [item.value, item.label])),
    members: new Map(data?.members.map((item) => [item.value, item.label])),
  }
  const fields = [
    ['Tipo', activityTypeLabel(activity.type)],
    ['Data', new Date(activity.occurred_at).toLocaleString('pt-BR')],
    ['Responsável', maps.members.get(activity.actor_member_id ?? '')],
    ['Empresa', maps.companies.get(activity.company_id ?? '')],
    ['Contato', maps.contacts.get(activity.contact_id ?? '')],
    ['Lead', maps.leads.get(activity.lead_id ?? '')],
    ['Oportunidade', maps.opportunities.get(activity.opportunity_id ?? '')],
    ['Descrição', activity.description],
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link
            className="inline-flex h-10 items-center rounded-md border border-border bg-card px-4 text-sm font-medium"
            to="/timeline"
          >
            Voltar à timeline
          </Link>
        }
        description="Detalhes da interação e documentos relacionados."
        title={activity.subject}
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
      <AttachmentPanel
        membershipId={activeOrganization?.membershipId ?? ''}
        role={activeOrganization?.role}
        target={{
          entityId: activity.id,
          entityType: 'activity',
          organizationId: organizationId ?? '',
        }}
      />
    </div>
  )
}
