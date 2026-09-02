import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FormActions } from '@/features/crm/components/FormActions'
import { contactSchema } from '@/features/crm/crm.schemas'
import { findContactDuplicates } from '@/features/crm/crm.service'
import type { ContactInput, DuplicateMatch, Option } from '@/features/crm/crm.types'

export function ContactForm({
  backTo,
  companies,
  defaultValues,
  id,
  isSaving,
  onSave,
  organizationId,
}: {
  backTo: string
  companies: Option[]
  defaultValues: ContactInput
  id?: string
  isSaving: boolean
  onSave: (input: ContactInput) => Promise<void>
  organizationId: string
}) {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
  } = useForm<ContactInput>({ defaultValues, resolver: zodResolver(contactSchema) })
  const submit = handleSubmit(async (input) => {
    const matches = await findContactDuplicates(organizationId, input, id)
    if (matches.length) {
      setDuplicates(matches)
      return
    }
    await onSave(input)
  })
  return (
    <form className="space-y-6" onSubmit={(e) => void submit(e)}>
      <div className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <FormField error={errors.companyId?.message} label="Empresa" required>
          <Select {...register('companyId')}>
            <option value="">Selecione...</option>
            {companies.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <div />
        <FormField error={errors.firstName?.message} label="Nome" required>
          <Input {...register('firstName')} />
        </FormField>
        <FormField error={errors.lastName?.message} label="Sobrenome">
          <Input {...register('lastName')} />
        </FormField>
        <FormField error={errors.jobTitle?.message} label="Cargo">
          <Input {...register('jobTitle')} />
        </FormField>
        <FormField error={errors.department?.message} label="Departamento">
          <Input {...register('department')} />
        </FormField>
        <FormField error={errors.phone?.message} label="Telefone">
          <Input inputMode="tel" {...register('phone')} />
        </FormField>
        <FormField error={errors.whatsapp?.message} label="WhatsApp">
          <Input inputMode="tel" {...register('whatsapp')} />
        </FormField>
        <FormField error={errors.email?.message} label="E-mail">
          <Input type="email" {...register('email')} />
        </FormField>
        <FormField error={errors.linkedinUrl?.message} label="LinkedIn">
          <Input
            placeholder="https://linkedin.com/in/..."
            type="url"
            {...register('linkedinUrl')}
          />
        </FormField>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input className="size-4" type="checkbox" {...register('isPrimary')} />
          Contato principal da empresa
        </label>
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
