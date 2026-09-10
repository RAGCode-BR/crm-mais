import { Bell, CheckCheck, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { StatePanel } from '@/components/shared/StatePanel'
import { Button } from '@/components/ui/Button'
import { useOrganization } from '@/features/organizations/useOrganization'

import { NotificationCard } from '../components/NotificationCard'
import { useNotificationActions, useNotifications } from '../notification.hooks'
import { notificationPageSize } from '../notification.service'
import type { NotificationFilter } from '../notification.types'

export function NotificationsPage() {
  const { activeOrganization } = useOrganization()
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [page, setPage] = useState(1)
  const organizationId = activeOrganization?.organizationId
  const membershipId = activeOrganization?.membershipId
  const query = useNotifications(organizationId, membershipId, filter, page)
  const actions = useNotificationActions(organizationId, membershipId)
  const setCurrentFilter = (next: NotificationFilter) => {
    setFilter(next)
    setPage(1)
  }
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
              to="/notificacoes/preferencias"
            >
              <Settings2 className="size-4" /> Preferências
            </Link>
            <Button
              disabled={
                actions.markAllRead.isPending || !query.data?.items.some((item) => !item.read_at)
              }
              onClick={() => actions.markAllRead.mutate()}
              variant="outline"
            >
              <CheckCheck className="size-4" /> Marcar todas como lidas
            </Button>
          </>
        }
        description="Acompanhe tarefas, reuniões, leads e oportunidades que precisam da sua atenção."
        title="Notificações"
      />
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map((value) => (
          <Button
            key={value}
            onClick={() => setCurrentFilter(value)}
            variant={filter === value ? 'primary' : 'outline'}
          >
            {value === 'all' ? 'Todas' : 'Não lidas'}
          </Button>
        ))}
      </div>
      {query.isLoading ? (
        <StatePanel kind="loading">Atualizando notificações...</StatePanel>
      ) : query.error ? (
        <StatePanel kind="error">{query.error.message}</StatePanel>
      ) : query.data?.items.length ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          {query.data.items.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onReadChange={(id, read) => actions.markRead.mutate({ id, read })}
            />
          ))}
          <Pagination
            count={query.data.count}
            onChange={setPage}
            page={page}
            pageSize={notificationPageSize}
          />
        </section>
      ) : (
        <StatePanel>
          <Bell className="mx-auto mb-3 size-7" />
          <p className="font-medium text-foreground">
            {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
          </p>
          <p className="mt-1">Quando algo precisar da sua atenção, aparecerá aqui.</p>
        </StatePanel>
      )}
    </div>
  )
}
