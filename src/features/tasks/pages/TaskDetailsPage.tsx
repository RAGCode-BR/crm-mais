import { Check, Pencil, RotateCcw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'
import { isTaskOverdue } from '../task-date'
import { taskPriorityLabel, taskStatusLabel, taskTypeLabel } from '../task.constants'
import { useSetTaskStatus, useTask, useTaskLookups } from '../task.hooks'

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' })

export function TaskDetailsPage() {
  const { taskId } = useParams()
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId ?? ''
  const task = useTask(organizationId, taskId)
  const lookups = useTaskLookups(organizationId)
  const statusMutation = useSetTaskStatus(organizationId)

  if (task.isLoading || lookups.isLoading)
    return <StatePanel kind="loading">Carregando tarefa...</StatePanel>
  if (task.error || lookups.error)
    return <StatePanel kind="error">{task.error?.message ?? lookups.error?.message}</StatePanel>
  if (!task.data || !lookups.data) return <StatePanel>Tarefa não encontrada.</StatePanel>

  const item = task.data
  const canWrite = roleCanWrite(activeOrganization?.role)
  const overdue = isTaskOverdue(item.due_at, item.status)
  const relations = [
    item.company_id
      ? {
          label: 'Empresa',
          value:
            lookups.data.companies.find((option) => option.value === item.company_id)?.label ??
            'Empresa',
          to: `/empresas/${item.company_id}`,
        }
      : null,
    item.contact_id
      ? {
          label: 'Contato',
          value:
            lookups.data.contacts.find((option) => option.value === item.contact_id)?.label ??
            'Contato',
          to: `/contatos/${item.contact_id}`,
        }
      : null,
    item.lead_id
      ? {
          label: 'Lead',
          value:
            lookups.data.leads.find((option) => option.value === item.lead_id)?.label ?? 'Lead',
          to: `/leads/${item.lead_id}`,
        }
      : null,
    item.opportunity_id
      ? {
          label: 'Oportunidade',
          value:
            lookups.data.opportunities.find((option) => option.value === item.opportunity_id)
              ?.label ?? 'Oportunidade',
          to: `/oportunidades/${item.opportunity_id}`,
        }
      : null,
  ].filter((relation) => relation !== null)
  const owner = lookups.data.members.find(
    (option) => option.value === item.assigned_member_id,
  )?.label

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          canWrite ? (
            <>
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium"
                to={`/tarefas/${item.id}/editar`}
              >
                <Pencil className="size-4" />
                Editar
              </Link>
              {item.status === 'completed' ? (
                <Button
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: item.id, status: 'pending' })}
                  variant="outline"
                >
                  <RotateCcw className="size-4" />
                  Reabrir
                </Button>
              ) : item.status !== 'cancelled' ? (
                <Button
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: item.id, status: 'completed' })}
                >
                  <Check className="size-4" />
                  Concluir
                </Button>
              ) : null}
            </>
          ) : undefined
        }
        description="Consulte o contexto, o responsável e o prazo desta atividade."
        title={item.title}
      />
      <section className="grid gap-6 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo</p>
          <p className="mt-1 text-sm">{taskTypeLabel(item.type)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Prioridade
          </p>
          <p className="mt-1 text-sm">{taskPriorityLabel(item.priority)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <p className="mt-1 text-sm">{taskStatusLabel(item.status)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Responsável
          </p>
          <p className="mt-1 text-sm">{owner ?? 'Sem responsável'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Vencimento
          </p>
          <p
            className={
              overdue
                ? 'mt-1 text-sm font-medium text-amber-800 dark:text-amber-300'
                : 'mt-1 text-sm'
            }
          >
            {item.due_at ? dateTime.format(new Date(item.due_at)) : 'Sem vencimento'}
            {overdue ? ' · atrasada' : ''}
          </p>
        </div>
        {item.completed_at ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Concluída em
            </p>
            <p className="mt-1 text-sm">{dateTime.format(new Date(item.completed_at))}</p>
          </div>
        ) : null}
        {relations.map((relation) => (
          <div key={relation.to}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {relation.label}
            </p>
            <Link
              className="mt-1 inline-block text-sm text-primary hover:underline"
              to={relation.to}
            >
              {relation.value}
            </Link>
          </div>
        ))}
        <div className="md:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Descrição
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {item.description || 'Nenhuma descrição informada.'}
          </p>
        </div>
      </section>
      <Link className="inline-flex text-sm font-medium text-primary hover:underline" to="/tarefas">
        Voltar para minhas tarefas
      </Link>
      {statusMutation.error ? (
        <StatePanel kind="error">{statusMutation.error.message}</StatePanel>
      ) : null}
    </div>
  )
}
