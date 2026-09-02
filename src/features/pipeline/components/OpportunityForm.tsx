import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { Option } from '@/features/crm/crm.types'
import { opportunityStatusOptions } from '../pipeline.constants'
import { opportunitySchema } from '../pipeline.schemas'
import type { OpportunityInput, PipelineWithStages } from '../pipeline.types'

type RelatedOption = Option & { companyId: string }

export function OpportunityForm({
  backTo,
  companies,
  contacts,
  defaultValues,
  isSaving,
  leads,
  members,
  onSave,
  pipelines,
  sources,
}: {
  backTo: string
  companies: Option[]
  contacts: RelatedOption[]
  defaultValues: OpportunityInput
  isSaving: boolean
  leads: RelatedOption[]
  members: Option[]
  onSave: (input: OpportunityInput) => Promise<void>
  pipelines: PipelineWithStages[]
  sources: Option[]
}) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<OpportunityInput>({ defaultValues, resolver: zodResolver(opportunitySchema) })
  const companyId = useWatch({ control, name: 'companyId' })
  const pipelineId = useWatch({ control, name: 'pipelineId' })
  const status = useWatch({ control, name: 'status' })
  const pipeline = pipelines.find((item) => item.id === pipelineId)
  const visibleContacts = useMemo(
    () => contacts.filter((item) => item.companyId === companyId),
    [companyId, contacts],
  )
  const visibleLeads = useMemo(
    () => leads.filter((item) => !item.companyId || item.companyId === companyId),
    [companyId, leads],
  )
  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSave)(event)}>
      <section className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <FormField error={errors.title?.message} label="Título" required>
          <Input {...register('title')} />
        </FormField>
        <FormField error={errors.companyId?.message} label="Empresa" required>
          <Select
            {...register('companyId', {
              onChange: () => {
                setValue('contactId', '')
                setValue('leadId', '')
              },
            })}
          >
            <option value="">Selecione...</option>
            {companies.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.contactId?.message} label="Contato">
          <Select disabled={!companyId} {...register('contactId')}>
            <option value="">Sem contato</option>
            {visibleContacts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.leadId?.message} label="Lead de origem">
          <Select {...register('leadId')}>
            <option value="">Sem lead vinculado</option>
            {visibleLeads.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.ownerMemberId?.message} label="Responsável">
          <Select {...register('ownerMemberId')}>
            <option value="">Sem responsável</option>
            {members.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.leadSourceId?.message} label="Origem">
          <Select {...register('leadSourceId')}>
            <option value="">Sem origem</option>
            {sources.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.pipelineId?.message} label="Pipeline" required>
          <Select
            {...register('pipelineId', {
              onChange: (event) => {
                const selected = pipelines.find((item) => item.id === String(event.target.value))
                const firstStage = selected?.stages[0]
                setValue('stageId', firstStage?.id ?? '')
                setValue('probability', firstStage?.default_probability ?? 0)
                setValue(
                  'status',
                  firstStage?.is_won ? 'won' : firstStage?.is_lost ? 'lost' : 'open',
                )
              },
            })}
          >
            {pipelines.map((item) => (
              <option disabled={!item.is_active} key={item.id} value={item.id}>
                {item.name}
                {item.is_active ? '' : ' (inativo)'}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.stageId?.message} label="Etapa" required>
          <Select
            {...register('stageId', {
              onChange: (event) => {
                const stage = pipeline?.stages.find(
                  (item) => item.id === String(event.target.value),
                )
                if (!stage) return
                setValue('probability', stage.default_probability)
                setValue('status', stage.is_won ? 'won' : stage.is_lost ? 'lost' : 'open')
              },
            })}
          >
            <option value="">Selecione...</option>
            {pipeline?.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.estimatedValue?.message} label="Valor estimado">
          <Input
            min="0"
            step="0.01"
            type="number"
            {...register('estimatedValue', { valueAsNumber: true })}
          />
        </FormField>
        <FormField error={errors.probability?.message} label="Probabilidade (%)">
          <Input
            max="100"
            min="0"
            type="number"
            {...register('probability', { valueAsNumber: true })}
          />
        </FormField>
        <FormField error={errors.expectedCloseDate?.message} label="Previsão de fechamento">
          <Input type="date" {...register('expectedCloseDate')} />
        </FormField>
        <FormField error={errors.productService?.message} label="Produto/serviço">
          <Input {...register('productService')} />
        </FormField>
        <FormField error={errors.status?.message} label="Estado">
          <Select {...register('status')}>
            {opportunityStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        {status === 'lost' ? (
          <FormField error={errors.lossReason?.message} label="Motivo da perda" required>
            <Input {...register('lossReason')} />
          </FormField>
        ) : null}
        {status === 'won' || status === 'lost' || status === 'discarded' ? (
          <FormField error={errors.closedAt?.message} label="Data de fechamento">
            <Input type="datetime-local" {...register('closedAt')} />
          </FormField>
        ) : null}
        <div className="md:col-span-2">
          <FormField error={errors.description?.message} label="Descrição">
            <Textarea {...register('description')} />
          </FormField>
        </div>
      </section>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
          to={backTo}
        >
          Cancelar
        </Link>
        <Button disabled={isSaving} type="submit">
          {isSaving ? 'Salvando...' : 'Salvar oportunidade'}
        </Button>
      </div>
    </form>
  )
}
