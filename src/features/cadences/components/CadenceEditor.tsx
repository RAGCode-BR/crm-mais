import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { useOrganization } from '@/features/organizations/useOrganization'

import { cadenceCanManage } from '../cadence.constants'
import { useCadence, useSaveCadence } from '../cadence.hooks'
import type { CadenceInput } from '../cadence.types'
import { CadenceForm } from './CadenceForm'

const defaults: CadenceInput = {
  name: 'Novos clientes',
  description: '',
  status: 'draft',
  steps: [
    { dayNumber: 1, type: 'email', title: 'E-mail inicial', description: '' },
    { dayNumber: 3, type: 'call', title: 'Ligação de acompanhamento', description: '' },
    { dayNumber: 7, type: 'whatsapp', title: 'Contato pelo WhatsApp', description: '' },
  ],
}

export function CadenceEditor({ id }: { id?: string }) {
  const navigate = useNavigate()
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId ?? ''
  const query = useCadence(organizationId, id)
  const mutation = useSaveCadence(organizationId, id)
  if (!activeOrganization) return <StatePanel>Selecione uma organização.</StatePanel>
  if (!cadenceCanManage(activeOrganization.role))
    return <StatePanel kind="error">Somente gestores podem configurar cadências.</StatePanel>
  if (id && query.isLoading) return <StatePanel kind="loading">Carregando cadência...</StatePanel>
  if (query.error) return <StatePanel kind="error">{query.error.message}</StatePanel>
  const values: CadenceInput = query.data
    ? {
        name: query.data.cadence.name,
        description: query.data.cadence.description ?? '',
        status: query.data.cadence.status,
        steps: query.data.steps.map((step) => ({
          dayNumber: step.day_number,
          type: step.type,
          title: step.title,
          description: step.description ?? '',
        })),
      }
    : defaults
  return (
    <div className="space-y-6">
      <PageHeader
        description="Configure uma sequência segura de tarefas internas para o time comercial."
        title={id ? 'Editar cadência' : 'Nova cadência'}
      />
      <CadenceForm
        backTo={id ? `/cadencias/${id}` : '/cadencias'}
        defaultValues={values}
        isSaving={mutation.isPending}
        onSave={async (input) => {
          const savedId = await mutation.mutateAsync(input)
          navigate(`/cadencias/${savedId}`)
        }}
      />
      {mutation.error ? <StatePanel kind="error">{mutation.error.message}</StatePanel> : null}
    </div>
  )
}
