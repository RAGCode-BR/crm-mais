import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FormActions } from '@/features/crm/components/FormActions'
import { leadStatusOptions, temperatureOptions } from '@/features/crm/crm.constants'
import { leadSchema } from '@/features/crm/crm.schemas'
import { findLeadDuplicates } from '@/features/crm/crm.service'
import type { DuplicateMatch, LeadInput, Option } from '@/features/crm/crm.types'

type ContactOption = Option & { companyId: string }
export function LeadForm({
  backTo,
  companies,
  contacts,
  defaultValues,
  id,
  isSaving,
  members,
  onSave,
  organizationId,
  sources,
}: {
  backTo: string
  companies: Option[]
  contacts: ContactOption[]
  defaultValues: LeadInput
  id?: string
  isSaving: boolean
  members: Option[]
  onSave: (input: LeadInput) => Promise<void>
  organizationId: string
  sources: Option[]
}) {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    control,
    setValue,
  } = useForm<LeadInput>({ defaultValues, resolver: zodResolver(leadSchema) })
  const companyId = useWatch({ control, name: 'companyId' })
  const visibleContacts = useMemo(
    () => contacts.filter((o) => !companyId || o.companyId === companyId),
    [companyId, contacts],
  )
  const submit = handleSubmit(async (input) => {
    const matches = await findLeadDuplicates(organizationId, input, id)
    if (matches.length) {
      setDuplicates(matches)
      return
    }
    await onSave(input)
  })
  return (
    <form className="space-y-6" onSubmit={(e) => void submit(e)}>
      <div className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <FormField error={errors.name?.message} label="Nome do lead" required>
          <Input {...register('name')} />
        </FormField>
        <FormField error={errors.companyId?.message} label="Empresa">
          <Select {...register('companyId', { onChange: () => setValue('contactId', '') })}>
            <option value="">Sem empresa</option>
            {companies.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.contactId?.message} label="Contato">
          <Select disabled={!companyId} {...register('contactId')}>
            <option value="">Sem contato</option>
            {visibleContacts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.ownerMemberId?.message} label="Responsável">
          <Select {...register('ownerMemberId')}>
            <option value="">Sem responsável</option>
            {members.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.leadSourceId?.message} label="Origem">
          <Select {...register('leadSourceId')}>
            <option value="">Sem origem</option>
            {sources.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.status?.message} label="Status" required>
          <Select {...register('status')}>
            {leadStatusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.temperature?.message} label="Temperatura" required>
          <Select {...register('temperature')}>
            {temperatureOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={errors.score?.message} label="Score (0–100)" required>
          <Input max="100" min="0" type="number" {...register('score', { valueAsNumber: true })} />
        </FormField>
        <FormField error={errors.phone?.message} label="Telefone">
          <Input inputMode="tel" {...register('phone')} />
        </FormField>
        <FormField error={errors.email?.message} label="E-mail">
          <Input type="email" {...register('email')} />
        </FormField>
        <FormField error={errors.nextAction?.message} label="Próxima ação">
          <Input {...register('nextAction')} />
        </FormField>
        <FormField error={errors.nextContactAt?.message} label="Próximo contato">
          <Input type="datetime-local" {...register('nextContactAt')} />
        </FormField>
        <div className="md:col-span-2">
          <FormField error={errors.notes?.message} label="Observações">
            <Textarea {...register('notes')} />
          </FormField>
        </div>
      </div>
      <FormActions
        backTo={backTo}
        duplicates={duplicates}
        isSaving={isSaving}
        onConfirm={() => void onSave(getValues())}
      />
    </form>
  )
}
