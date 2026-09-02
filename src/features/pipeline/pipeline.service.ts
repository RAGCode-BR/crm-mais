import { loadCrmLookups } from '@/features/crm/crm.service'
import { emptyToNull, safeSearch } from '@/features/crm/crm.schemas'
import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/types/database/common'
import type { Activity } from '@/types/database/engagement'
import type {
  Opportunity,
  OpportunityStatus,
  Pipeline,
  PipelineStage,
} from '@/types/database/pipeline'
import type {
  KanbanFilters,
  OpportunityInput,
  PipelineInput,
  PipelineWithStages,
} from './pipeline.types'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

const pipelineColumns =
  'id,organization_id,name,description,is_default,is_active,created_at,updated_at,created_by'
const stageColumns =
  'id,organization_id,pipeline_id,name,position,default_probability,is_closed,is_won,is_lost,created_at,updated_at,created_by'
const opportunityColumns =
  'id,organization_id,title,company_id,contact_id,lead_id,owner_member_id,pipeline_id,stage_id,lead_source_id,status,estimated_value,probability,expected_close_date,product_service,description,loss_reason,closed_at,created_at,updated_at,created_by'

export async function listPipelines(
  organizationId: string,
  includeInactive = true,
): Promise<PipelineWithStages[]> {
  let pipelinesQuery = client()
    .from('pipelines')
    .select(pipelineColumns)
    .eq('organization_id', organizationId)
    .order('is_default', { ascending: false })
    .order('name')
  if (!includeInactive) pipelinesQuery = pipelinesQuery.eq('is_active', true)
  const [pipelinesResult, stagesResult] = await Promise.all([
    pipelinesQuery,
    client()
      .from('pipeline_stages')
      .select(stageColumns)
      .eq('organization_id', organizationId)
      .order('position'),
  ])
  if (pipelinesResult.error) throw pipelinesResult.error
  if (stagesResult.error) throw stagesResult.error
  const stages = (stagesResult.data ?? []) as unknown as PipelineStage[]
  return ((pipelinesResult.data ?? []) as unknown as Pipeline[]).map((pipeline) => ({
    ...pipeline,
    stages: stages.filter((stage) => stage.pipeline_id === pipeline.id),
  }))
}

export async function getPipeline(organizationId: string, id: string): Promise<PipelineWithStages> {
  const pipelines = await listPipelines(organizationId)
  const pipeline = pipelines.find((item) => item.id === id)
  if (!pipeline) throw new Error('Pipeline não encontrado.')
  return pipeline
}

export async function savePipeline(organizationId: string, input: PipelineInput, id?: string) {
  const { data, error } = await client().rpc('save_pipeline_configuration', {
    target_organization_id: organizationId,
    target_pipeline_id: id ?? null,
    pipeline_name: input.name,
    pipeline_description: input.description,
    pipeline_is_default: input.isDefault,
    pipeline_is_active: input.isActive,
    stages: input.stages as unknown as Json,
  })
  if (error) throw error
  return data
}

export async function listKanbanOpportunities(
  organizationId: string,
  pipelineId: string,
  filters: KanbanFilters,
) {
  let query = client()
    .from('opportunities')
    .select(opportunityColumns)
    .eq('organization_id', organizationId)
    .eq('pipeline_id', pipelineId)
  const search = safeSearch(filters.search)
  if (search) query = query.or(`title.ilike.%${search}%,product_service.ilike.%${search}%`)
  if (filters.ownerId) query = query.eq('owner_member_id', filters.ownerId)
  if (filters.status) query = query.eq('status', filters.status as OpportunityStatus)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(500)
  if (error) throw error
  return (data ?? []) as unknown as Opportunity[]
}

export async function getOpportunity(organizationId: string, id: string) {
  const { data, error } = await client()
    .from('opportunities')
    .select(opportunityColumns)
    .eq('organization_id', organizationId)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as Opportunity
}

export async function getOpportunityHistory(organizationId: string, id: string) {
  const { data, error } = await client()
    .from('activities')
    .select(
      'id,organization_id,company_id,contact_id,lead_id,opportunity_id,actor_member_id,type,subject,description,occurred_at,metadata,created_at,updated_at,created_by',
    )
    .eq('organization_id', organizationId)
    .eq('opportunity_id', id)
    .eq('type', 'stage_change')
    .order('occurred_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Activity[]
}

function opportunityPayload(input: OpportunityInput) {
  const isClosed = input.status === 'won' || input.status === 'lost' || input.status === 'discarded'
  return {
    title: input.title.trim(),
    company_id: input.companyId,
    contact_id: emptyToNull(input.contactId),
    lead_id: emptyToNull(input.leadId),
    owner_member_id: emptyToNull(input.ownerMemberId),
    pipeline_id: input.pipelineId,
    stage_id: input.stageId,
    lead_source_id: emptyToNull(input.leadSourceId),
    status: input.status,
    estimated_value: input.estimatedValue,
    probability: input.probability,
    expected_close_date: emptyToNull(input.expectedCloseDate),
    product_service: emptyToNull(input.productService),
    description: emptyToNull(input.description),
    loss_reason: input.status === 'lost' ? emptyToNull(input.lossReason) : null,
    closed_at: isClosed
      ? input.closedAt
        ? new Date(input.closedAt).toISOString()
        : new Date().toISOString()
      : null,
  }
}

export async function saveOpportunity(
  organizationId: string,
  input: OpportunityInput,
  id?: string,
) {
  const payload = opportunityPayload(input)
  if (!id) {
    const { data, error } = await client()
      .from('opportunities')
      .insert({ ...payload, organization_id: organizationId })
      .select(opportunityColumns)
      .single()
    if (error) throw error
    return data as unknown as Opportunity
  }

  const current = await getOpportunity(organizationId, id)
  if (current.stage_id !== input.stageId || current.pipeline_id !== input.pipelineId) {
    await moveOpportunity(id, input.stageId, input.lossReason)
  }
  const { pipeline_id: _pipelineId, stage_id: _stageId, ...editablePayload } = payload
  void _pipelineId
  void _stageId
  const { data, error } = await client()
    .from('opportunities')
    .update(editablePayload)
    .eq('organization_id', organizationId)
    .eq('id', id)
    .select(opportunityColumns)
    .single()
  if (error) throw error
  return data as unknown as Opportunity
}

export async function moveOpportunity(
  opportunityId: string,
  targetStageId: string,
  lossReason?: string,
) {
  const { data, error } = await client().rpc('move_opportunity', {
    opportunity_id: opportunityId,
    target_stage_id: targetStageId,
    target_loss_reason: lossReason ?? null,
  })
  if (error) throw error
  return data
}

export async function loadPipelineLookups(organizationId: string) {
  const [crm, pipelines, leadsResult] = await Promise.all([
    loadCrmLookups(organizationId),
    listPipelines(organizationId),
    client()
      .from('leads')
      .select('id,name,company_id')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('name'),
  ])
  if (leadsResult.error) throw leadsResult.error
  return {
    ...crm,
    pipelines,
    leads: (leadsResult.data ?? []).map((lead) => ({
      value: String(lead.id),
      label: String(lead.name),
      companyId: lead.company_id ? String(lead.company_id) : '',
    })),
  }
}
