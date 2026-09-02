import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth'
import { AuthFormField } from '@/features/auth/components/AuthFormField'
import { AuthNotice } from '@/features/auth/components/AuthNotice'

import {
  type OrganizationInput,
  createOrganizationSlug,
  organizationSchema,
} from '../organization.schemas'
import { createOrganization, getOrganizationErrorMessage } from '../organization.service'
import { organizationKeys } from '../useOrganizations'
import { useOrganization } from '../useOrganization'

export function OrganizationsPage() {
  const { user } = useAuth()
  const { organizations, setActiveOrganization } = useOrganization()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: '', slug: '' },
  })

  function handleNameChange(name: string) {
    form.setValue('name', name, { shouldDirty: true, shouldValidate: true })

    if (!form.formState.dirtyFields.slug) {
      form.setValue('slug', createOrganizationSlug(name), { shouldValidate: true })
    }
  }

  async function handleSubmit(values: OrganizationInput) {
    if (!user) return

    setSubmitError(null)

    try {
      const organizationId = await createOrganization(values.name, values.slug)
      await queryClient.invalidateQueries({ queryKey: organizationKeys.forUser(user.id) })
      setActiveOrganization(organizationId)
      navigate('/', { replace: true })
    } catch (error) {
      setSubmitError(getOrganizationErrorMessage(error))
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          to="/"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>

        <div className="mb-8 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Nova organização</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Você será definido como OWNER. Depois será possível convidar a equipe e distribuir papéis.
        </p>

        <form
          className="mt-8 space-y-5 rounded-xl border border-border bg-card p-6"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {submitError ? <AuthNotice message={submitError} /> : null}

          <AuthFormField
            autoComplete="organization"
            error={form.formState.errors.name?.message}
            label="Nome da organização"
            {...form.register('name', {
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                handleNameChange(event.target.value)
              },
            })}
          />
          <AuthFormField
            aria-describedby="slug-help"
            error={form.formState.errors.slug?.message}
            label="Identificador"
            {...form.register('slug')}
          />
          <p className="-mt-3 text-xs text-muted-foreground" id="slug-help">
            Usado internamente para identificar a organização. Exemplo: minha-empresa.
          </p>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            {organizations.length > 0 ? (
              <Button onClick={() => navigate('/')} variant="outline">
                Cancelar
              </Button>
            ) : null}
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? <Spinner label="Criando organização" /> : null}
              Criar organização
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
