import { zodResolver } from '@hookform/resolvers/zod'
import { UserRoundPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/shared/FormField'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

import { useRegisterResponsible } from '../pipeline.hooks'
import { responsibleSchema } from '../pipeline.schemas'
import type { ResponsibleInput } from '../pipeline.types'

export function ResponsibleRegistrationPanel({
  companyName,
  companyPhone,
  opportunityId,
  organizationId,
}: {
  companyName: string
  companyPhone: string
  opportunityId: string
  organizationId: string
}) {
  const mutation = useRegisterResponsible(organizationId, opportunityId)
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ResponsibleInput>({
    defaultValues: { name: '', jobTitle: '', phone: companyPhone },
    resolver: zodResolver(responsibleSchema),
  })

  return (
    <section className="rounded-xl border border-dashed border-primary/40 bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <UserRoundPlus aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold">Cadastrar responsável</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta oportunidade ainda não tem uma pessoa de contato. Depois do primeiro contato,
            cadastre quem atendeu em {companyName}: ela passa a ser um contato da empresa.
          </p>
        </div>
      </div>
      <form
        className="mt-5 grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-start"
        onSubmit={(event) => void handleSubmit((input) => mutation.mutateAsync(input))(event)}
      >
        <FormField error={errors.name?.message} label="Nome" required>
          <Input autoComplete="off" placeholder="Nome e sobrenome" {...register('name')} />
        </FormField>
        <FormField error={errors.jobTitle?.message} label="Cargo">
          <Input autoComplete="off" {...register('jobTitle')} />
        </FormField>
        <FormField error={errors.phone?.message} label="Telefone">
          <Input autoComplete="off" inputMode="tel" type="tel" {...register('phone')} />
        </FormField>
        <Button className="md:mt-6" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? 'Salvando...' : 'Cadastrar'}
        </Button>
      </form>
      {mutation.error ? (
        <div className="mt-4">
          <StatePanel kind="error">{mutation.error.message}</StatePanel>
        </div>
      ) : null}
    </section>
  )
}
