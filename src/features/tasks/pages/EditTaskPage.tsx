import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'
import { TaskForm } from '../components/TaskForm'
import { toDateTimeLocal } from '../task-date'
import { useSaveTask, useTask, useTaskLookups } from '../task.hooks'
import type { TaskInput } from '../task.types'

export function EditTaskPage() {
  const { taskId } = useParams()
  const { activeOrganization } = useOrganization()
  const navigate = useNavigate()
  const organizationId = activeOrganization?.organizationId ?? ''
  const task = useTask(organizationId, taskId)
  const lookups = useTaskLookups(organizationId)
  const mutation = useSaveTask(organizationId, taskId)

  if (!activeOrganization) return <StatePanel>Selecione uma organização.</StatePanel>
  if (!roleCanWrite(activeOrganization.role))
    return <StatePanel kind="error">Seu perfil possui acesso somente para leitura.</StatePanel>
  if (task.isLoading || lookups.isLoading)
    return <StatePanel kind="loading">Carregando tarefa...</StatePanel>
  if (task.error || lookups.error)
    return <StatePanel kind="error">{task.error?.message ?? lookups.error?.message}</StatePanel>
  if (!task.data || !lookups.data) return <StatePanel>Tarefa não encontrada.</StatePanel>

  const defaultValues: TaskInput = {
    title: task.data.title,
    description: task.data.description ?? '',
    assignedMemberId: task.data.assigned_member_id ?? '',
    priority: task.data.priority,
    status: task.data.status,
    type: task.data.type,
    dueAt: toDateTimeLocal(task.data.due_at),
    companyId: task.data.company_id ?? '',
    contactId: task.data.contact_id ?? '',
    leadId: task.data.lead_id ?? '',
    opportunityId: task.data.opportunity_id ?? '',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Atualize os dados e o andamento da atividade."
        title="Editar tarefa"
      />
      <TaskForm
        backTo={`/tarefas/${task.data.id}`}
        defaultValues={defaultValues}
        isSaving={mutation.isPending}
        lookups={lookups.data}
        onSave={async (input) => {
          await mutation.mutateAsync(input)
          navigate(`/tarefas/${task.data.id}`)
        }}
      />
      {mutation.error ? <StatePanel kind="error">{mutation.error.message}</StatePanel> : null}
    </div>
  )
}
