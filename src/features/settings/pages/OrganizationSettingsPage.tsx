import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { roleCanManage } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'
import { useOrganizationSettings, useUpdateOrganization } from '../settings.hooks'
import { SettingsBackLink } from '../components/SettingsBackLink'

function OrganizationForm({
  canManage,
  initialName,
  initialSlug,
  onSave,
  pending,
}: {
  canManage: boolean
  initialName: string
  initialSlug: string
  onSave: (input: { name: string; slug: string }) => void
  pending: boolean
}) {
  const [name, setName] = useState(initialName)
  const [slug, setSlug] = useState(initialSlug)
  return (
    <form
      className="max-w-2xl space-y-5 rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ name, slug })
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium">Nome</span>
        <Input
          disabled={!canManage}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Identificador</span>
        <Input
          disabled={!canManage}
          onChange={(event) => setSlug(event.target.value)}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          required
          value={slug}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Use letras minúsculas, números e hífens no identificador.
      </p>
      {canManage ? (
        <Button disabled={pending} type="submit">
          {pending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Seu perfil possui acesso somente para consulta.
        </p>
      )}
    </form>
  )
}

export function OrganizationSettingsPage() {
  const { activeOrganization, refetch } = useOrganization()
  const organizationId = activeOrganization?.organizationId ?? ''
  const query = useOrganizationSettings(organizationId)
  const mutation = useUpdateOrganization(organizationId)
  const canManage = roleCanManage(activeOrganization?.role)
  return (
    <div className="space-y-6">
      <PageHeader
        actions={<SettingsBackLink />}
        description="Informações compartilhadas por toda a organização."
        title="Informações da organização"
      />
      {query.isLoading ? (
        <StatePanel kind="loading">Carregando...</StatePanel>
      ) : query.error || !query.data ? (
        <StatePanel kind="error">
          {query.error?.message ?? 'Organização não encontrada.'}
        </StatePanel>
      ) : (
        <OrganizationForm
          canManage={canManage}
          initialName={query.data.name}
          initialSlug={query.data.slug}
          onSave={(input) => {
            void mutation.mutateAsync(input).then(() => refetch())
          }}
          pending={mutation.isPending}
        />
      )}
      {mutation.error ? (
        <StatePanel kind="error">{mutation.error.message}</StatePanel>
      ) : mutation.isSuccess ? (
        <StatePanel>Organização atualizada.</StatePanel>
      ) : null}
    </div>
  )
}
