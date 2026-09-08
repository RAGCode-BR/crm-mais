import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { Option } from '@/features/crm/crm.types'

import { prospectingListSchema } from '../prospecting.schemas'
import type { ProspectingListInput } from '../prospecting.types'

export function ProspectingListForm({
  isSaving,
  members,
  onSave,
}: {
  isSaving: boolean
  members: Option[]
  onSave: (input: ProspectingListInput) => Promise<void>
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ProspectingListInput>({
    defaultValues: { name: '', description: '', ownerMemberId: '' },
    resolver: zodResolver(prospectingListSchema),
  })
  const submit = handleSubmit(onSave)
  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      <div className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
        <FormField error={errors.name?.message} label="Nome da lista" required>
          <Input placeholder="Empresas de construção civil — São Paulo" {...register('name')} />
        </FormField>
        <FormField error={errors.ownerMemberId?.message} label="Responsável padrão">
          <Select {...register('ownerMemberId')}>
            <option value="">Sem responsável</option>
            {members.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="md:col-span-2">
          <FormField error={errors.description?.message} label="Descrição">
            <Textarea
              placeholder="Objetivo, segmento e critérios desta frente de prospecção."
              {...register('description')}
            />
          </FormField>
        </div>
      </div>
      <div className="flex justify-end">
        <Button disabled={isSaving} type="submit">
          {isSaving ? 'Criando...' : 'Criar lista'}
        </Button>
      </div>
    </form>
  )
}
