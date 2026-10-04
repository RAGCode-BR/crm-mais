import { Archive, History, ListTodo, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { AttachmentPanel } from '@/features/attachments/components/AttachmentPanel'
import { useOrganization } from '@/features/organizations/useOrganization'
import type { EntityKind } from '../crm.types'
import { roleCanManage, roleCanWrite, statusLabel, temperatureLabel } from '../crm.constants'
import { useArchiveRecord, useCrmLookups, useCrmRecord, useDeleteRecord } from '../crm.hooks'

const meta = {
  companies: { title: 'Empresa', path: '/empresas', edit: 'Editar empresa' },
  contacts: { title: 'Contato', path: '/contatos', edit: 'Editar contato' },
  leads: { title: 'Lead', path: '/leads', edit: 'Editar lead' },
} as const
function display(value: unknown) {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

export function EntityDetails({ entity, id }: { entity: EntityKind; id: string }) {
  const { activeOrganization } = useOrganization()
  const [confirming, setConfirming] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const navigate = useNavigate()
  const organizationId = activeOrganization?.organizationId ?? ''
  const query = useCrmRecord(entity, organizationId, id)
  const lookups = useCrmLookups(organizationId)
  const archive = useArchiveRecord(entity, organizationId)
  const removeLead = useDeleteRecord('leads', organizationId)
  const current = meta[entity]
  if (query.isLoading || lookups.isLoading)
    return <StatePanel kind="loading">Carregando detalhes...</StatePanel>
  if (query.error || !query.data)
    return (
      <StatePanel kind="error">{query.error?.message ?? 'Registro não encontrado.'}</StatePanel>
    )
  const row = query.data as unknown as Record<string, unknown>
  const companies = new Map((lookups.data?.companies ?? []).map((o) => [o.value, o.label]))
  const contacts = new Map((lookups.data?.contacts ?? []).map((o) => [o.value, o.label]))
  const members = new Map((lookups.data?.members ?? []).map((o) => [o.value, o.label]))
  const sources = new Map((lookups.data?.sources ?? []).map((o) => [o.value, o.label]))
  const title =
    entity === 'companies'
      ? display(row.trade_name)
      : entity === 'contacts'
        ? `${display(row.first_name)} ${row.last_name ?? ''}`.trim()
        : display(row.name)
  const fields: Array<[string, unknown]> =
    entity === 'companies'
      ? [
          ['Razão social', row.legal_name],
          ['CNPJ', row.tax_id],
          ['Segmento', row.industry],
          ['Porte', row.company_size],
          ['Funcionários', row.employee_count],
          ['Site', row.website],
          ['Telefone', row.phone],
          ['E-mail', row.email],
          ['Cidade', row.city],
          ['Estado', row.state],
          ['País', row.country_code],
          ['Responsável', members.get(String(row.owner_member_id))],
          ['Origem', sources.get(String(row.lead_source_id))],
          ['Status', statusLabel(String(row.status))],
          ['Observações', row.notes],
        ]
      : entity === 'contacts'
        ? [
            ['Empresa', companies.get(String(row.company_id))],
            ['Cargo', row.job_title],
            ['Departamento', row.department],
            ['Telefone', row.phone],
            ['WhatsApp', row.whatsapp],
            ['E-mail', row.email],
            ['LinkedIn', row.linkedin_url],
            ['Contato principal', row.is_primary ? 'Sim' : 'Não'],
            ['Observações', row.notes],
          ]
        : [
            ['Empresa', companies.get(String(row.company_id))],
            ['Contato', contacts.get(String(row.contact_id))],
            ['Responsável', members.get(String(row.owner_member_id))],
            ['Origem', sources.get(String(row.lead_source_id))],
            ['E-mail', row.email],
            ['Telefone', row.phone],
            ['Status', statusLabel(String(row.status))],
            ['Temperatura', temperatureLabel(String(row.temperature))],
            ['Score', row.score],
            ['Próxima ação', row.next_action],
            [
              'Próximo contato',
              row.next_contact_at
                ? new Date(String(row.next_contact_at)).toLocaleString('pt-BR')
                : null,
            ],
            ['Observações', row.notes],
          ]
  const canWrite = roleCanWrite(activeOrganization?.role)
  const canDelete = entity === 'leads' && roleCanManage(activeOrganization?.role)
  const taskContext = new URLSearchParams()
  taskContext.set(
    entity === 'companies' ? 'empresa' : entity === 'contacts' ? 'contato' : 'lead',
    id,
  )
  if (entity !== 'companies' && row.company_id) taskContext.set('empresa', String(row.company_id))
  if (entity === 'leads' && row.contact_id) taskContext.set('contato', String(row.contact_id))
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium"
              to={current.path}
            >
              Voltar
            </Link>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium"
              to={`/timeline?${entity === 'companies' ? 'empresa' : entity === 'contacts' ? 'contato' : 'lead'}=${id}`}
            >
              <History className="size-4" />
              Timeline
            </Link>
            {canWrite ? (
              <>
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium"
                  to={`/tarefas/nova?${taskContext.toString()}`}
                >
                  <ListTodo className="size-4" />
                  Criar tarefa
                </Link>
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                  to={`${current.path}/${id}/editar`}
                >
                  <Pencil className="size-4" />
                  {current.edit}
                </Link>
              </>
            ) : null}
          </>
        }
        description={`Detalhes e informações do cadastro de ${current.title.toLowerCase()}.`}
        title={title}
      />
      <section className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(([label, value]) => (
          <div className="min-h-24 bg-card p-5" key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-2 whitespace-pre-wrap break-words text-sm">{display(value)}</dd>
          </div>
        ))}
      </section>
      {entity === 'companies' || entity === 'leads' ? (
        <AttachmentPanel
          membershipId={activeOrganization?.membershipId ?? ''}
          role={activeOrganization?.role}
          target={{
            entityId: id,
            entityType: entity === 'companies' ? 'company' : 'lead',
            organizationId,
          }}
        />
      ) : null}
      {canWrite ? (
        <section className="rounded-xl border border-red-200 bg-card p-5 dark:border-red-900">
          <h2 className="font-medium">Arquivar registro</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O registro sairá das listagens ativas, mas continuará preservado no banco.
          </p>
          {confirming ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-red-700 dark:text-red-300">
                Confirma o arquivamento?
              </span>
              <Button
                disabled={archive.isPending}
                onClick={() => void archive.mutateAsync(id).then(() => navigate(current.path))}
              >
                Sim, arquivar
              </Button>
              <Button onClick={() => setConfirming(false)} variant="ghost">
                Cancelar
              </Button>
            </div>
          ) : (
            <Button className="mt-4" onClick={() => setConfirming(true)} variant="outline">
              <Archive className="size-4" />
              Arquivar
            </Button>
          )}
          {archive.error ? (
            <p className="mt-3 text-sm text-red-600">{archive.error.message}</p>
          ) : null}
          {canDelete ? (
            <div className="mt-5 border-t border-red-200 pt-5 dark:border-red-900">
              <h2 className="font-medium">Excluir lead</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Remove o lead de vez, junto com oportunidades, atividades, tarefas, notas, tags e
                anexos ligados a ele. A empresa e o contato não são afetados.
              </p>
              <Button
                className="mt-4 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                onClick={() => setConfirmingDelete(true)}
                variant="outline"
              >
                <Trash2 className="size-4" />
                Excluir lead
              </Button>
              {removeLead.error ? (
                <p className="mt-3 text-sm text-red-600" role="alert">
                  {removeLead.error.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
      <ConfirmDialog
        confirmLabel="Excluir lead"
        description={`"${title}" e tudo o que está ligado a ele serão apagados. Essa ação não pode ser desfeita.`}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() =>
          void removeLead
            .mutateAsync(id)
            .then(() => navigate(current.path))
            .catch(() => setConfirmingDelete(false))
        }
        open={confirmingDelete}
        pending={removeLead.isPending}
        title="Excluir lead permanentemente?"
      />
    </div>
  )
}
