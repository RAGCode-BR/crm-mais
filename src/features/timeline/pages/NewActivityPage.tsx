import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FormField } from '@/components/shared/FormField'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'
import { defaultActivitySubject, manualActivityOptions } from '../timeline.constants'
import { useCreateActivity, useTimelineLookups } from '../timeline.hooks'
import { activitySchema } from '../timeline.schemas'
import type { ActivityInput, ManualActivityType } from '../timeline.types'

function localDateTime() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function NewActivityPage() {
  const { activeOrganization } = useOrganization()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const organizationId = activeOrganization?.organizationId ?? ''
  const lookups = useTimelineLookups(organizationId)
  const mutation = useCreateActivity(organizationId, activeOrganization?.membershipId ?? '')
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<ActivityInput>({
    defaultValues: {
      type: 'call',
      subject: defaultActivitySubject.call,
      description: '',
      occurredAt: localDateTime(),
      companyId: params.get('empresa') ?? '',
      contactId: params.get('contato') ?? '',
      leadId: params.get('lead') ?? '',
      opportunityId: params.get('oportunidade') ?? '',
    },
    resolver: zodResolver(activitySchema),
  })
  if (!activeOrganization) return <StatePanel>Selecione uma organização.</StatePanel>
  if (!roleCanWrite(activeOrganization.role))
    return <StatePanel kind="error">Seu perfil possui acesso somente para leitura.</StatePanel>
  if (lookups.isLoading) return <StatePanel kind="loading">Carregando vínculos...</StatePanel>
  if (lookups.error) return <StatePanel kind="error">{lookups.error.message}</StatePanel>
  const data = lookups.data
  return (
    <div className="space-y-6">
      <PageHeader
        description="Registre contatos realizados, reuniões, anotações e propostas."
        title="Nova atividade"
      />
      <form
        className="space-y-6"
        onSubmit={(event) =>
          void handleSubmit(async (input) => {
            await mutation.mutateAsync(input)
            navigate('/timeline')
          })(event)
        }
      >
        <section className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
          <FormField error={errors.type?.message} label="Tipo" required>
            <Select
              {...register('type', {
                onChange: (event) =>
                  setValue(
                    'subject',
                    defaultActivitySubject[event.target.value as ManualActivityType],
                  ),
              })}
            >
              {manualActivityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField error={errors.occurredAt?.message} label="Data e hora" required>
            <Input type="datetime-local" {...register('occurredAt')} />
          </FormField>
          <div className="md:col-span-2">
            <FormField error={errors.subject?.message} label="Assunto" required>
              <Input {...register('subject')} />
            </FormField>
          </div>
          <FormField error={errors.companyId?.message} label="Empresa">
            <Select
              {...register('companyId', {
                onChange: () => {
                  setValue('contactId', '')
                  setValue('leadId', '')
                  setValue('opportunityId', '')
                },
              })}
            >
              <option value="">Sem empresa</option>
              {data?.companies.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField error={errors.contactId?.message} label="Contato">
            <Select
              {...register('contactId', {
                onChange: (event) => {
                  const contact = data?.contacts.find((item) => item.value === event.target.value)
                  if (contact) setValue('companyId', contact.companyId)
                },
              })}
            >
              <option value="">Sem contato</option>
              {data?.contacts.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField error={errors.leadId?.message} label="Lead">
            <Select
              {...register('leadId', {
                onChange: (event) => {
                  const lead = data?.leads.find((item) => item.value === event.target.value)
                  if (lead?.companyId) setValue('companyId', lead.companyId)
                },
              })}
            >
              <option value="">Sem lead</option>
              {data?.leads.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField error={errors.opportunityId?.message} label="Oportunidade">
            <Select
              {...register('opportunityId', {
                onChange: (event) => {
                  const opportunity = data?.opportunities.find(
                    (item) => item.value === event.target.value,
                  )
                  if (!opportunity) return
                  setValue('companyId', opportunity.companyId)
                  setValue('contactId', opportunity.contactId)
                  setValue('leadId', opportunity.leadId)
                },
              })}
            >
              <option value="">Sem oportunidade</option>
              {data?.opportunities.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="md:col-span-2">
            <FormField error={errors.description?.message} label="Descrição">
              <Textarea {...register('description')} />
            </FormField>
          </div>
        </section>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
            to="/timeline"
          >
            Cancelar
          </Link>
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Registrando...' : 'Registrar atividade'}
          </Button>
        </div>
      </form>
      {mutation.error ? <StatePanel kind="error">{mutation.error.message}</StatePanel> : null}
    </div>
  )
}
