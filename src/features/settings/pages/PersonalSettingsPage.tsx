import { useState, type ChangeEvent } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/features/auth'
import { SettingsBackLink } from '../components/SettingsBackLink'
import { useProfileSettings, useUpdateProfile } from '../settings.hooks'

type PersonalFormValue = { full_name: string; phone: string; timezone: string; locale: string }
function PersonalForm({
  initialValue,
  onSave,
  pending,
}: {
  initialValue: PersonalFormValue
  onSave: (value: PersonalFormValue) => void
  pending: boolean
}) {
  const [form, setForm] = useState(initialValue)
  const field =
    (key: keyof PersonalFormValue) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }))
  return (
    <form
      className="grid max-w-2xl gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(form)
      }}
    >
      <label className="space-y-2">
        <span className="text-sm font-medium">Nome completo</span>
        <Input onChange={field('full_name')} required value={form.full_name} />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Telefone</span>
        <Input onChange={field('phone')} value={form.phone} />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Fuso horário</span>
        <Select onChange={field('timezone')} value={form.timezone}>
          <option value="America/Sao_Paulo">Brasília</option>
          <option value="America/Manaus">Manaus</option>
          <option value="America/Rio_Branco">Rio Branco</option>
          <option value="UTC">UTC</option>
        </Select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Idioma</span>
        <Select onChange={field('locale')} value={form.locale}>
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es">Español</option>
        </Select>
      </label>
      <div className="md:col-span-2">
        <Button disabled={pending} type="submit">
          {pending ? 'Salvando...' : 'Salvar preferências'}
        </Button>
      </div>
    </form>
  )
}

export function PersonalSettingsPage() {
  const { user } = useAuth()
  const query = useProfileSettings(user?.id)
  const mutation = useUpdateProfile(user?.id ?? '')
  return (
    <div className="space-y-6">
      <PageHeader
        actions={<SettingsBackLink />}
        description="Estas informações pertencem somente à sua conta."
        title="Configurações pessoais"
      />
      {query.isLoading ? (
        <StatePanel kind="loading">Carregando...</StatePanel>
      ) : query.error || !query.data ? (
        <StatePanel kind="error">{query.error?.message ?? 'Perfil não encontrado.'}</StatePanel>
      ) : (
        <PersonalForm
          initialValue={{
            full_name: query.data.full_name,
            phone: query.data.phone ?? '',
            timezone: query.data.timezone,
            locale: query.data.locale,
          }}
          onSave={(value) => mutation.mutate(value)}
          pending={mutation.isPending}
        />
      )}
      {mutation.error ? (
        <StatePanel kind="error">{mutation.error.message}</StatePanel>
      ) : mutation.isSuccess ? (
        <StatePanel>Perfil atualizado.</StatePanel>
      ) : null}
    </div>
  )
}
