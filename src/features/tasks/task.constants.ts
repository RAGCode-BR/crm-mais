import type { TaskPriority, TaskStatus, TaskType } from '@/types/database/engagement'
import type { TaskView } from './task.types'

export const TASK_PAGE_SIZE = 12

export const taskPriorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export const taskStatusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
]

export const taskTypeOptions: Array<{ value: TaskType; label: string }> = [
  { value: 'call', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'general', label: 'Tarefa geral' },
]

export const taskViews: Array<{ value: TaskView; label: string; path: string }> = [
  { value: 'mine', label: 'Minhas tarefas', path: '/tarefas' },
  { value: 'today', label: 'Hoje', path: '/tarefas/hoje' },
  { value: 'overdue', label: 'Atrasadas', path: '/tarefas/atrasadas' },
  { value: 'upcoming', label: 'Próximas', path: '/tarefas/proximas' },
  { value: 'completed', label: 'Concluídas', path: '/tarefas/concluidas' },
]

export const taskViewCopy: Record<TaskView, { title: string; description: string }> = {
  mine: {
    title: 'Minhas tarefas',
    description: 'Acompanhe todas as suas atividades comerciais em aberto.',
  },
  today: {
    title: 'Tarefas de hoje',
    description: 'Priorize os contatos e follow-ups com vencimento hoje.',
  },
  overdue: {
    title: 'Tarefas atrasadas',
    description: 'Retome pendências vencidas sem perder o contexto comercial.',
  },
  upcoming: {
    title: 'Próximas tarefas',
    description: 'Planeje as atividades previstas para os próximos dias.',
  },
  completed: {
    title: 'Tarefas concluídas',
    description: 'Consulte o histórico das atividades que você já finalizou.',
  },
}

export const taskPriorityLabel = (value: string) =>
  taskPriorityOptions.find((option) => option.value === value)?.label ?? value
export const taskStatusLabel = (value: string) =>
  taskStatusOptions.find((option) => option.value === value)?.label ?? value
export const taskTypeLabel = (value: string) =>
  taskTypeOptions.find((option) => option.value === value)?.label ?? value
