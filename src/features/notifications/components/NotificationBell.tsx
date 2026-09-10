import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useOrganization } from '@/features/organizations/useOrganization'

import { useUnreadNotificationCount } from '../notification.hooks'

export function NotificationBell() {
  const { activeOrganization } = useOrganization()
  const count = useUnreadNotificationCount(
    activeOrganization?.organizationId,
    activeOrganization?.membershipId,
  )
  const unread = count.data ?? 0
  return (
    <Link
      aria-label={unread ? `${unread} notificações não lidas` : 'Notificações'}
      className="relative grid size-10 shrink-0 place-items-center rounded-md border border-border bg-card hover:bg-muted"
      to="/notificacoes"
    >
      <Bell className="size-4" />
      {unread ? (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-5 text-primary-foreground">
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </Link>
  )
}
