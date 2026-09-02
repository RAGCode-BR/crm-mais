import { emptyToNull, safeSearch } from '@/features/crm/crm.schemas'
import type { Paginated } from '@/features/crm/crm.types'
import { loadTimelineLookups } from '@/features/timeline/timeline.service'
import { supabase } from '@/lib/supabase/client'
import type { Task, TaskPriority, TaskStatus, TaskType } from '@/types/database/engagement'
import type { TaskFilters, TaskInput } from './task.types'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

const taskColumns =
  'id,organization_id,company_id,contact_id,lead_id,opportunity_id,assigned_member_id,title,description,priority,status,type,due_at,completed_at,created_at,updated_at,created_by'
const activeStatuses: TaskStatus[] = ['pending', 'in_progress']

export async function listTasks(
  organizationId: string,
  filters: TaskFilters,
): Promise<Paginated<Task>> {
  let query = client()
    .from('tasks')
    .select(taskColumns, { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('assigned_member_id', filters.memberId)

  const search = safeSearch(filters.search)
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  if (filters.priority) query = query.eq('priority', filters.priority as TaskPriority)
  if (filters.type) query = query.eq('type', filters.type as TaskType)

  if (filters.view === 'completed') query = query.eq('status', 'completed')
  else {
    query = query.in('status', activeStatuses)
    if (filters.view === 'today') {
      query = query.gte('due_at', filters.todayStart).lte('due_at', filters.todayEnd)
    }
    if (filters.view === 'overdue') query = query.lt('due_at', filters.todayStart)
    if (filters.view === 'upcoming') query = query.gt('due_at', filters.todayEnd)
  }

  const from = (filters.page - 1) * filters.pageSize
  const ordered =
    filters.view === 'completed'
      ? query.order('completed_at', { ascending: false, nullsFirst: false })
      : query.order('due_at', { ascending: true, nullsFirst: false })
  const { data, error, count } = await ordered.range(from, from + filters.pageSize - 1)
  if (error) throw error
  return { rows: (data ?? []) as unknown as Task[], count: count ?? 0 }
}

export async function getTask(organizationId: string, id: string) {
  const { data, error } = await client()
    .from('tasks')
    .select(taskColumns)
    .eq('organization_id', organizationId)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as Task
}

function taskPayload(input: TaskInput) {
  return {
    title: input.title.trim(),
    description: emptyToNull(input.description),
    assigned_member_id: input.assignedMemberId,
    priority: input.priority,
    status: input.status,
    type: input.type,
    due_at: new Date(input.dueAt).toISOString(),
    completed_at: input.status === 'completed' ? new Date().toISOString() : null,
    company_id: emptyToNull(input.companyId),
    contact_id: emptyToNull(input.contactId),
    lead_id: emptyToNull(input.leadId),
    opportunity_id: emptyToNull(input.opportunityId),
  }
}

export async function saveTask(organizationId: string, input: TaskInput, id?: string) {
  const payload = taskPayload(input)
  const request = id
    ? client().from('tasks').update(payload).eq('organization_id', organizationId).eq('id', id)
    : client()
        .from('tasks')
        .insert({ ...payload, organization_id: organizationId })
  const { data, error } = await request.select(taskColumns).single()
  if (error) throw error
  return data as unknown as Task
}

export async function setTaskStatus(organizationId: string, id: string, status: TaskStatus) {
  const { data, error } = await client()
    .from('tasks')
    .update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('organization_id', organizationId)
    .eq('id', id)
    .select(taskColumns)
    .single()
  if (error) throw error
  return data as unknown as Task
}

export const loadTaskLookups = (organizationId: string) => loadTimelineLookups(organizationId)
