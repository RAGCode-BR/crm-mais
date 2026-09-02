import type { TaskPriority, TaskStatus, TaskType } from '@/types/database/engagement'

export type TaskView = 'mine' | 'today' | 'overdue' | 'upcoming' | 'completed'

export type TaskInput = {
  title: string
  description: string
  assignedMemberId: string
  priority: TaskPriority
  status: TaskStatus
  type: TaskType
  dueAt: string
  companyId: string
  contactId: string
  leadId: string
  opportunityId: string
}

export type TaskFilters = {
  page: number
  pageSize: number
  search: string
  priority: string
  type: string
  view: TaskView
  memberId: string
  todayStart: string
  todayEnd: string
}
