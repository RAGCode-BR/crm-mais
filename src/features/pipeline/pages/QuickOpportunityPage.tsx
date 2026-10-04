import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { FormField } from '@/components/shared/FormField'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'

import { useCreateQuickOpportunity, usePipelineLookups } from '../pipeline.hooks'
import { quickOpportunitySchema } from '../pipeline.schemas'
import type { QuickOpportunityInput, PipelineWithStages } from '../pipeline.types'

type Lookups = NonNullable<ReturnType<typeof usePipelineLookups>['data']>

function initialProbability(pipelines: PipelineWithStages[]) {
  const active = pipelines.filter((pipeline) => pipeline.is_active)
  const pipeline = active.find((item) => item.is_default) ?? active[0]
  return pipeline?.stages.find((stage) => !stage.is_closed)?.default_probability ?? 0
}

function QuickOpportunityForm({
  defaultValues,
  lookups,
  organizationId,
}: {
  defaultValues: QuickOpportunityInput
  lookups: Lookups
  organizationId: string
}) {
  const navigate = useNavigate()
  const mutation = useCreateQuickOpportunity(organizationId)
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<QuickOpportunityInput>({
    defaultValues,
    resolver: zodResolver(quickOpportunitySchema),
  })
  const companyName = useWatch({ control, name: 'companyName' })
  const matchedCompany = lookups.companies.find(
    (company) => company.label.trim().toLowerCase() === companyName.trim().toLowerCase(),
  )
  const companyContacts = matchedCompany
    ? lookups.contacts.filter((contact) => contact.companyId === matchedCompany.value)
    : []

  return (
    <form
      className="space-y-6"
      onSubmit={(event) =>
        void handleSubmit(async (input) => {
          const id = await mutation.mutateAsync(input)
          navigate(`/oportunidades/${id}`, { replace: true })
        })(event)
      }
    >
      <section className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <FormField
          description={
            matchedCompany
              ? 'Empresa já cadastrada: a oportunidade será vinculada a ela.'
              : 'Se a empresa não existir, ela será cadastrada.'
          }
          error={errors.companyName?.message}
          label="Empresa"
          required
        >
          <Input autoComplete="off" list="quick-company-options" {...register('companyName')} />
        </FormField>
        <datalist id="quick-company-options">
          {lookups.companies.map((company) => (
            <option key={company.value} value={company.label} />
          ))}
        </datalist>
        <FormField
          description="Opcional. Se ainda não souber quem atende, cadastre depois na página da oportunidade."
          error={errors.responsibleName?.message}
          label="Responsável"
        >
          <Input
            autoComplete="off"
            list="quick-responsible-options"
            placeholder="Nome e sobrenome"
            {...register('responsibleName')}
          />
        </FormField>
        <datalist id="quick-responsible-options">
          {companyContacts.map((contact) => (
            <option key={contact.value} value={contact.label} />
          ))}
        </datalist>
        <FormField error={errors.contactPhone?.message} label="Telefone para contato">
          <Input
            autoComplete="off"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            type="tel"
            {...register('contactPhone')}
          />
        </FormField>
        <FormField error={errors.productService?.message} label="Produto/serviço">
          <Input {...register('productService')} />
        </FormField>
        <FormField error={errors.estimatedValue?.message} label="Valor estimado (R$)">
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
        <div className="md:col-span-2">
          <FormField error={errors.description?.message} label="Descrição">
            <Textarea {...register('description')} />
          </FormField>
        </div>
      </section>
      {mutation.error ? <StatePanel kind="error">{mutation.error.message}</StatePanel> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
          to="/oportunidades"
        >
          Cancelar
        </Link>
        <Button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? 'Salvando...' : 'Criar oportunidade'}
        </Button>
      </div>
    </form>
  )
}

export function QuickOpportunityPage() {
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId ?? ''
  const lookups = usePipelineLookups(organizationId)

  if (!activeOrganization) return <StatePanel>Selecione uma organização.</StatePanel>
  if (!roleCanWrite(activeOrganization.role))
    return <StatePanel kind="error">Seu perfil possui acesso somente para leitura.</StatePanel>
  if (lookups.isLoading) return <StatePanel kind="loading">Carregando dados...</StatePanel>
  if (lookups.error || !lookups.data)
    return <StatePanel kind="error">{lookups.error?.message ?? 'Erro ao carregar.'}</StatePanel>

  return (
    <div className="space-y-6">
      <PageHeader
        description="Cadastre o cliente e a oportunidade de uma vez. Ela entra na primeira etapa do pipeline padrão."
        title="Oportunidade rápida"
      />
      <QuickOpportunityForm
        defaultValues={{
          companyName: '',
          responsibleName: '',
          contactPhone: '',
          estimatedValue: 0,
          probability: initialProbability(lookups.data.pipelines),
          productService: '',
          description: '',
        }}
        lookups={lookups.data}
        organizationId={organizationId}
      />
    </div>
  )
}
