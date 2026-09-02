import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'
import type { Opportunity } from '@/types/database/pipeline'
import { useOpportunity, usePipelineLookups, useSaveOpportunity } from '../pipeline.hooks'
import type { OpportunityInput } from '../pipeline.types'
import { OpportunityForm } from './OpportunityForm'

function fromOpportunity(row: Opportunity): OpportunityInput {
  return {
    title: row.title,
    companyId: row.company_id,
    contactId: row.contact_id ?? '',
    leadId: row.lead_id ?? '',
    ownerMemberId: row.owner_member_id ?? '',
    pipelineId: row.pipeline_id,
    stageId: row.stage_id,
    leadSourceId: row.lead_source_id ?? '',
    status: row.status,
    estimatedValue: Number(row.estimated_value),
    probability: row.probability,
    expectedCloseDate: row.expected_close_date ?? '',
    productService: row.product_service ?? '',
    description: row.description ?? '',
    lossReason: row.loss_reason ?? '',
    closedAt: row.closed_at ? new Date(row.closed_at).toISOString().slice(0, 16) : '',
  }
}

export function OpportunityEditor({ id }: { id?: string }) {
  const { activeOrganization } = useOrganization()
  const navigate = useNavigate()
  const organizationId = activeOrganization?.organizationId ?? ''
  const lookups = usePipelineLookups(organizationId)
  const record = useOpportunity(organizationId, id)
  const mutation = useSaveOpportunity(organizationId, id)
  if (!activeOrganization) return <StatePanel>Selecione uma organização.</StatePanel>
  if (!roleCanWrite(activeOrganization.role))
    return <StatePanel kind="error">Seu perfil possui acesso somente para leitura.</StatePanel>
  if (lookups.isLoading || (id && record.isLoading))
    return <StatePanel kind="loading">Carregando dados...</StatePanel>
  if (lookups.error || record.error)
    return <StatePanel kind="error">{lookups.error?.message ?? record.error?.message}</StatePanel>
  const data = lookups.data
  if (!data?.pipelines.length)
    return (
      <StatePanel kind="error">Crie um pipeline ativo antes de cadastrar oportunidades.</StatePanel>
    )
  const availablePipelines = id ? data.pipelines : data.pipelines.filter((item) => item.is_active)
  const pipeline = availablePipelines.find((item) => item.is_default) ?? availablePipelines[0]
  if (!pipeline)
    return <StatePanel kind="error">Ative um pipeline antes de cadastrar oportunidades.</StatePanel>
  const firstStage = pipeline?.stages[0]
  const defaults: OpportunityInput = record.data
    ? fromOpportunity(record.data)
    : {
        title: '',
        companyId: '',
        contactId: '',
        leadId: '',
        ownerMemberId: '',
        pipelineId: pipeline?.id ?? '',
        stageId: firstStage?.id ?? '',
        leadSourceId: '',
        status: firstStage?.is_won ? 'won' : firstStage?.is_lost ? 'lost' : 'open',
        estimatedValue: 0,
        probability: firstStage?.default_probability ?? 0,
        expectedCloseDate: '',
        productService: '',
        description: '',
        lossReason: '',
        closedAt: '',
      }
  return (
    <div className="space-y-6">
      <PageHeader
        description="Registre os dados comerciais e posicione a oportunidade no pipeline."
        title={id ? 'Editar oportunidade' : 'Nova oportunidade'}
      />
      <OpportunityForm
        backTo={id ? `/oportunidades/${id}` : '/oportunidades'}
        companies={data.companies}
        contacts={data.contacts}
        defaultValues={defaults}
        isSaving={mutation.isPending}
        leads={data.leads}
        members={data.members}
        onSave={async (input) => {
          const saved = await mutation.mutateAsync(input)
          navigate(`/oportunidades/${saved.id}`, { replace: true })
        }}
        pipelines={availablePipelines}
        sources={data.sources}
      />
      {mutation.error ? <StatePanel kind="error">{mutation.error.message}</StatePanel> : null}
    </div>
  )
}
