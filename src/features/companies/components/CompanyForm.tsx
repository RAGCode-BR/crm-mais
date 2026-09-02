import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { companyStatusOptions } from '@/features/crm/crm.constants'
import { findCompanyDuplicates } from '@/features/crm/crm.service'
import { companySchema } from '@/features/crm/crm.schemas'
import type { CompanyInput, DuplicateMatch, Option } from '@/features/crm/crm.types'
import { FormActions } from '@/features/crm/components/FormActions'

export function CompanyForm({
  backTo,
  defaultValues,
  id,
  isSaving,
  members,
  onSave,
  organizationId,
  sources,
}: {
  backTo: string
  defaultValues: CompanyInput
  id?: string
  isSaving: boolean
  members: Option[]
  onSave: (input: CompanyInput) => Promise<void>
  organizationId: string
  sources: Option[]
}) {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const {
    formState: { errors },
    handleSubmit,
    register,
    getValues,
  } = useForm<CompanyInput>({ defaultValues, resolver: zodResolver(companySchema) })
  const submit = handleSubmit(async (input) => {
    const matches = await findCompanyDuplicates(organizationId, input, id)
    if (matches.length) {
      setDuplicates(matches)
      return
    }
    await onSave(input)
  })
  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      <div className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <FormField error={errors.tradeName?.message} label="Nome fantasia" required>
          <Input {...register('tradeName')} />
        </FormField>
        <FormField error={errors.legalName?.message} label="Razão social">
          <Input {...register('legalName')} />
        </FormField>
        <FormField error={errors.taxId?.message} label="CNPJ">
          <Input inputMode="numeric" {...register('taxId')} />
        </FormField>
        <FormField error={errors.industry?.message} label="Segmento">
          <Input {...register('industry')} />
        </FormField>
        <FormField error={errors.companySize?.message} label="Porte">
          <Input {...register('companySize')} />
        </FormField>
        <FormField error={errors.employeeCount?.message} label="Quantidade de funcionários">
          <Input
            min="0"
            type="number"
            {...register('employeeCount', {
              setValueAs: (value) => (value === '' ? null : Number(value)),
            })}
          />
        </FormField>
        <FormField error={errors.website?.message} label="Site">
          <Input placeholder="https://empresa.com.br" type="url" {...register('website')} />
        </FormField>
        <FormField error={errors.phone?.message} label="Telefone">
          <Input inputMode="tel" {...register('phone')} />
        </FormField>
        <FormField error={errors.email?.message} label="E-mail">
          <Input type="email" {...register('email')} />
        </FormField>
        <FormField error={errors.city?.message} label="Cidade">
          <Input {...register('city')} />
        </FormField>
        <FormField error={errors.state?.message} label="Estado">
          <Input {...register('state')} />
        </FormField>
        <FormField error={errors.countryCode?.message} label="País (ISO)">
          <Input maxLength={2} {...register('countryCode')} />
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
            {companyStatusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
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
