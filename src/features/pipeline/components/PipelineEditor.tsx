import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { useOrganization } from '@/features/organizations/useOrganization'
import { pipelineCanManage } from '../pipeline.constants'
import { usePipeline, useSavePipeline } from '../pipeline.hooks'
import type { PipelineInput } from '../pipeline.types'
import { PipelineForm } from './PipelineForm'

const defaultValues: PipelineInput = {
  name: '',
  description: '',
  isDefault: false,
  isActive: true,
  stages: [
    { name: 'Novo', probability: 10, isWon: false, isLost: false },
    { name: 'Qualificação', probability: 50, isWon: false, isLost: false },
    { name: 'Ganho', probability: 100, isWon: true, isLost: false },
  ],
}

export function PipelineEditor({ id }: { id?: string }) {
  const { activeOrganization } = useOrganization()
  const navigate = useNavigate()
  const organizationId = activeOrganization?.organizationId ?? ''
  const query = usePipeline(organizationId, id)
  const mutation = useSavePipeline(organizationId, id)
  if (!activeOrganization) return <StatePanel>Selecione uma organização.</StatePanel>
  if (!pipelineCanManage(activeOrganization.role))
    return <StatePanel kind="error">Somente gestores podem configurar pipelines.</StatePanel>
  if (id && query.isLoading) return <StatePanel kind="loading">Carregando pipeline...</StatePanel>
  if (query.error) return <StatePanel kind="error">{query.error.message}</StatePanel>
  const values = query.data
    ? {
        name: query.data.name,
        description: query.data.description ?? '',
        isDefault: query.data.is_default,
        isActive: query.data.is_active,
        stages: query.data.stages.map((stage) => ({
          id: stage.id,
          name: stage.name,
          probability: stage.default_probability,
          isWon: stage.is_won,
          isLost: stage.is_lost,
        })),
      }
    : defaultValues
  return (
    <div className="space-y-6">
      <PageHeader
        description="Defina etapas, ordem e probabilidades do fluxo comercial."
        title={id ? 'Editar pipeline' : 'Novo pipeline'}
      />
      <PipelineForm
        backTo="/pipelines"
        defaultValues={values}
        isSaving={mutation.isPending}
        onSave={async (input) => {
          await mutation.mutateAsync(input)
          navigate('/pipelines')
        }}
      />
      {mutation.error ? <StatePanel kind="error">{mutation.error.message}</StatePanel> : null}
    </div>
  )
}
