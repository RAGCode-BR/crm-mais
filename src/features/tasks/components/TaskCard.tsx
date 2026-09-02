import {
  Building2,
  CalendarClock,
  Check,
  CirclePlay,
  ContactRound,
  ExternalLink,
  RotateCcw,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import type { Task, TaskStatus } from '@/types/database/engagement'
import { isTaskOverdue } from '../task-date'
import { taskPriorityLabel, taskStatusLabel, taskTypeLabel } from '../task.constants'

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

type TaskMaps = {
  companies: Map<string, string>
  contacts: Map<string, string>
  leads: Map<string, string>
  opportunities: Map<string, string>
}

export function TaskCard({
  canWrite,
  maps,
  onStatus,
  task,
}: {
  canWrite: boolean
  maps: TaskMaps
  onStatus: (id: string, status: TaskStatus) => void
  task: Task
}) {
  const overdue = isTaskOverdue(task.due_at, task.status)
  const links = [
    task.company_id
      ? {
          icon: Building2,
          label: maps.companies.get(task.company_id) ?? 'Empresa',
          to: `/empresas/${task.company_id}`,
        }
      : null,
    task.contact_id
      ? {
          icon: ContactRound,
          label: maps.contacts.get(task.contact_id) ?? 'Contato',
          to: `/contatos/${task.contact_id}`,
        }
      : null,
    task.lead_id
      ? {
          icon: Target,
          label: maps.leads.get(task.lead_id) ?? 'Lead',
          to: `/leads/${task.lead_id}`,
        }
      : null,
    task.opportunity_id
      ? {
          icon: ExternalLink,
          label: maps.opportunities.get(task.opportunity_id) ?? 'Oportunidade',
          to: `/oportunidades/${task.opportunity_id}`,
        }
      : null,
  ].filter((link) => link !== null)

  return (
    <article
      className={cn(
        'rounded-xl border bg-card p-4 transition-colors',
        overdue
          ? 'border-amber-300 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/10'
          : 'border-border',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-muted px-2 py-1 font-medium">
              {taskTypeLabel(task.type)}
            </span>
            <span className="rounded-full bg-muted px-2 py-1">
              {taskPriorityLabel(task.priority)}
            </span>
            <span className="text-muted-foreground">{taskStatusLabel(task.status)}</span>
          </div>
          <Link className="mt-3 block font-semibold hover:text-primary" to={`/tarefas/${task.id}`}>
            {task.title}
          </Link>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
          ) : null}
          <div
            className={cn(
              'mt-3 flex items-center gap-2 text-sm',
              overdue ? 'font-medium text-amber-800 dark:text-amber-300' : 'text-muted-foreground',
            )}
          >
            <CalendarClock className="size-4" />
            {task.due_at ? dateTime.format(new Date(task.due_at)) : 'Sem vencimento'}
            {overdue ? <span>· atrasada</span> : null}
          </div>
          {links.length ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {links.map(({ icon: Icon, label, to }) => (
                <Link
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  key={to}
                  to={to}
                >
                  <Icon className="size-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        {canWrite ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {task.status === 'pending' ? (
              <Button onClick={() => onStatus(task.id, 'in_progress')} variant="outline">
                <CirclePlay className="size-4" />
                Iniciar
              </Button>
            ) : null}
            {task.status === 'completed' ? (
              <Button onClick={() => onStatus(task.id, 'pending')} variant="outline">
                <RotateCcw className="size-4" />
                Reabrir
              </Button>
            ) : task.status !== 'cancelled' ? (
              <Button onClick={() => onStatus(task.id, 'completed')}>
                <Check className="size-4" />
                Concluir
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}
