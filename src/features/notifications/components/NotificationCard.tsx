import {
  Bell,
  CalendarClock,
  Check,
  CircleAlert,
  Flame,
  GitBranch,
  MessageSquareText,
  RotateCcw,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import type { Notification, NotificationType } from '@/types/database/system'

import { notificationPath, notificationTypeLabels } from '../notification.constants'

const icons = {
  task_due: CalendarClock,
  task_overdue: CircleAlert,
  lead_assigned: Target,
  opportunity_changed: GitBranch,
  opportunity_stalled: CircleAlert,
  meeting: CalendarClock,
  hot_lead: Flame,
  mention: MessageSquareText,
  system: Bell,
} satisfies Record<NotificationType, typeof Bell>

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function NotificationCard({
  notification,
  onReadChange,
}: {
  notification: Notification
  onReadChange(id: string, read: boolean): void
}) {
  const Icon = icons[notification.type]
  const path = notificationPath(notification.related_entity_type, notification.related_entity_id)
  const unread = notification.read_at === null
  return (
    <article
      className={cn(
        'flex flex-col gap-4 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-start',
        unread && 'bg-primary/5',
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-primary">
            {notificationTypeLabels[notification.type]}
          </span>
          {unread ? (
            <span className="size-2 rounded-full bg-primary" aria-label="Não lida" />
          ) : null}
        </div>
        <h2 className="mt-1 font-semibold">{notification.title}</h2>
        {notification.body ? (
          <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {dateTime.format(new Date(notification.created_at))}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {path ? (
          <Link
            className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            onClick={() => unread && onReadChange(notification.id, true)}
            to={path}
          >
            Abrir
          </Link>
        ) : null}
        <Button
          className="h-9 px-3"
          onClick={() => onReadChange(notification.id, unread)}
          variant="ghost"
        >
          {unread ? <Check className="size-4" /> : <RotateCcw className="size-4" />}
          {unread ? 'Marcar como lida' : 'Marcar como não lida'}
        </Button>
      </div>
    </article>
  )
}
