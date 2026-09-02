import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'
import { TaskForm } from '../components/TaskForm'
import { toDateTimeLocal } from '../task-date'
import { useSaveTask, useTaskLookups } from '../task.hooks'
import type { TaskInput } from '../task.types'

export function NewTaskPage() {
  const { activeOrganization } = useOrganization()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const organizationId = activeOrganization?.organizationId ?? ''
  const lookups = useTaskLookups(organizationId)
  const mutation = useSaveTask(organizationId)
  const defaultValues: TaskInput = {
    title: '',
    description: '',
    assignedMemberId: activeOrganization?.membershipId ?? '',
    priority: 'medium',
    status: 'pending',
    type: 'follow_up',
    dueAt: toDateTimeLocal(),
    companyId: params.get('empresa') ?? '',
    contactId: params.get('contato') ?? '',
    leadId: params.get('lead') ?? '',
    opportunityId: params.get('oportunidade') ?? '',
  }

  if (!activeOrganization) return <StatePanel>Selecione uma organização.</StatePanel>
  if (!roleCanWrite(activeOrganization.role))
    return <StatePanel kind="error">Seu perfil possui acesso somente para leitura.</StatePanel>
  if (lookups.isLoading) return <StatePanel kind="loading">Carregando vínculos...</StatePanel>
  if (lookups.error) return <StatePanel kind="error">{lookups.error.message}</StatePanel>

  return (
    <div className="space-y-6">
      <PageHeader
        description="Planeje um contato, reunião ou próximo passo comercial."
        title="Nova tarefa"
      />
      <TaskForm
        backTo="/tarefas"
        defaultValues={defaultValues}
        isSaving={mutation.isPending}
        lookups={lookups.data!}
        onSave={async (input) => {
          const task = await mutation.mutateAsync(input)
          navigate(`/tarefas/${task.id}`)
        }}
      />
      {mutation.error ? <StatePanel kind="error">{mutation.error.message}</StatePanel> : null}
    </div>
  )
}
