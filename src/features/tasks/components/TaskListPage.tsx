import { ListTodo, Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { StatePanel } from '@/components/shared/StatePanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { roleCanWrite } from '@/features/crm/crm.constants'
import { useOrganization } from '@/features/organizations/useOrganization'
import { TaskCard } from './TaskCard'
import { TaskViewNav } from './TaskViewNav'
import {
  TASK_PAGE_SIZE,
  taskPriorityOptions,
  taskTypeOptions,
  taskViewCopy,
} from '../task.constants'
import { todayBounds } from '../task-date'
import { useSetTaskStatus, useTaskLookups, useTasks } from '../task.hooks'
import type { TaskFilters, TaskView } from '../task.types'

export function TaskListPage({ view }: { view: TaskView }) {
  const { activeOrganization } = useOrganization()
  const [params, setParams] = useSearchParams()
  const bounds = todayBounds()
  const organizationId = activeOrganization?.organizationId
  const filters: TaskFilters = {
    page: Math.max(1, Number(params.get('pagina')) || 1),
    pageSize: TASK_PAGE_SIZE,
    search: params.get('busca') ?? '',
    priority: params.get('prioridade') ?? '',
    type: params.get('tipo') ?? '',
    view,
    memberId: activeOrganization?.membershipId ?? '',
    todayStart: bounds.start,
    todayEnd: bounds.end,
  }
  const tasks = useTasks(organizationId, filters)
  const lookups = useTaskLookups(organizationId)
  const statusMutation = useSetTaskStatus(organizationId ?? '')
  const copy = taskViewCopy[view]
  const update = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'pagina') next.delete('pagina')
        return next
      },
      { replace: true },
    )
  const maps = {
    companies: new Map(lookups.data?.companies.map((item) => [item.value, item.label])),
    contacts: new Map(lookups.data?.contacts.map((item) => [item.value, item.label])),
    leads: new Map(lookups.data?.leads.map((item) => [item.value, item.label])),
    opportunities: new Map(lookups.data?.opportunities.map((item) => [item.value, item.label])),
  }
  const canWrite = roleCanWrite(activeOrganization?.role)

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          canWrite ? (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              to="/tarefas/nova"
            >
              <Plus className="size-4" />
              Nova tarefa
            </Link>
          ) : undefined
        }
        description={copy.description}
        title={copy.title}
      />
      <TaskViewNav />
      <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
        <Input
          aria-label="Buscar tarefas"
          onChange={(event) => update('busca', event.target.value)}
          placeholder="Buscar tarefa..."
          value={filters.search}
        />
        <Select
          aria-label="Tipo da tarefa"
          onChange={(event) => update('tipo', event.target.value)}
          value={filters.type}
        >
          <option value="">Todos os tipos</option>
          {taskTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Prioridade da tarefa"
          onChange={(event) => update('prioridade', event.target.value)}
          value={filters.priority}
        >
          <option value="">Todas as prioridades</option>
          {taskPriorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </section>
      {tasks.isLoading || lookups.isLoading ? (
        <StatePanel kind="loading">Carregando tarefas...</StatePanel>
      ) : tasks.error || lookups.error ? (
        <StatePanel kind="error">{tasks.error?.message ?? lookups.error?.message}</StatePanel>
      ) : tasks.data?.rows.length ? (
        <section className="space-y-3">
          {tasks.data.rows.map((task) => (
            <TaskCard
              canWrite={canWrite && !statusMutation.isPending}
              key={task.id}
              maps={maps}
              onStatus={(id, status) => statusMutation.mutate({ id, status })}
              task={task}
            />
          ))}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Pagination
              count={tasks.data.count}
              onChange={(page) => update('pagina', String(page))}
              page={filters.page}
              pageSize={filters.pageSize}
            />
          </div>
        </section>
      ) : (
        <StatePanel>
          <ListTodo className="mx-auto mb-2 size-5" />
          Nenhuma tarefa encontrada nesta visão.
        </StatePanel>
      )}
      {statusMutation.error ? (
        <StatePanel kind="error">{statusMutation.error.message}</StatePanel>
      ) : null}
    </div>
  )
}
