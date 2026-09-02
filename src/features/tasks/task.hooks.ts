import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TaskStatus } from '@/types/database/engagement'
import { getTask, listTasks, loadTaskLookups, saveTask, setTaskStatus } from './task.service'
import type { TaskFilters, TaskInput } from './task.types'

export const taskKeys = {
  all: (organizationId: string) => ['tasks', organizationId] as const,
  list: (organizationId: string, filters: TaskFilters) =>
    ['tasks', organizationId, 'list', filters] as const,
  detail: (organizationId: string, id: string) => ['tasks', organizationId, 'detail', id] as const,
  lookups: (organizationId: string) => ['tasks', organizationId, 'lookups'] as const,
}

export const useTasks = (organizationId: string | undefined, filters: TaskFilters) =>
  useQuery({
    queryKey: taskKeys.list(organizationId ?? '', filters),
    queryFn: () => listTasks(organizationId!, filters),
    enabled: Boolean(organizationId && filters.memberId),
    placeholderData: (previous) => previous,
  })

export const useTask = (organizationId?: string, id?: string) =>
  useQuery({
    queryKey: taskKeys.detail(organizationId ?? '', id ?? ''),
    queryFn: () => getTask(organizationId!, id!),
    enabled: Boolean(organizationId && id),
  })

export const useTaskLookups = (organizationId?: string) =>
  useQuery({
    queryKey: taskKeys.lookups(organizationId ?? ''),
    queryFn: () => loadTaskLookups(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  })

function useTaskInvalidation(organizationId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: taskKeys.all(organizationId) }),
      queryClient.invalidateQueries({ queryKey: ['timeline', organizationId] }),
    ])
}

export function useSaveTask(organizationId: string, id?: string) {
  const invalidate = useTaskInvalidation(organizationId)
  return useMutation({
    mutationFn: (input: TaskInput) => saveTask(organizationId, input, id),
    onSuccess: invalidate,
  })
}

export function useSetTaskStatus(organizationId: string) {
  const invalidate = useTaskInvalidation(organizationId)
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      setTaskStatus(organizationId, id, status),
    onSuccess: invalidate,
  })
}
