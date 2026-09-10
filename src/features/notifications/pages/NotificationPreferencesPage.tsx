import { ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatePanel } from '@/components/shared/StatePanel'
import { useOrganization } from '@/features/organizations/useOrganization'

import { notificationTypeLabels } from '../notification.constants'
import { useNotificationPreferences, useSetNotificationPreference } from '../notification.hooks'

export function NotificationPreferencesPage() {
  const { activeOrganization } = useOrganization()
  const organizationId = activeOrganization?.organizationId
  const membershipId = activeOrganization?.membershipId
  const query = useNotificationPreferences(organizationId, membershipId)
  const update = useSetNotificationPreference(organizationId, membershipId)
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
            to="/configuracoes"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        }
        description="Escolha quais alertas deseja receber dentro do CRM."
        title="Preferências de notificações"
      />
      {query.isLoading ? (
        <StatePanel kind="loading">Carregando preferências...</StatePanel>
      ) : query.error ? (
        <StatePanel kind="error">{query.error.message}</StatePanel>
      ) : (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          {query.data?.map((preference) => (
            <label
              className="flex items-center gap-4 border-b border-border p-4 last:border-b-0"
              key={preference.type}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                <SlidersHorizontal className="size-4 text-primary" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{notificationTypeLabels[preference.type]}</span>
                <span className="block text-sm text-muted-foreground">
                  Receber este tipo de alerta dentro do sistema.
                </span>
              </span>
              <input
                aria-label={`Ativar ${notificationTypeLabels[preference.type]}`}
                checked={preference.in_app_enabled}
                className="size-5 accent-[var(--primary)]"
                disabled={update.isPending}
                onChange={(event) =>
                  update.mutate({
                    enabled: event.target.checked,
                    id: preference.id,
                    type: preference.type,
                  })
                }
                type="checkbox"
              />
            </label>
          ))}
        </section>
      )}
      {update.error ? <p className="text-sm text-red-600">{update.error.message}</p> : null}
    </div>
  )
}
