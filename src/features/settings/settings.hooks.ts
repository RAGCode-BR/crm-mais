import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createCatalogItem,
  deleteCatalogItem,
  getOrganization,
  getProfile,
  inviteMember,
  listCatalog,
  listMembers,
  updateCatalogItem,
  updateMember,
  updateOrganization,
  updateProfile,
} from './settings.service'
import type { CatalogKind, MemberUpdate, ProfileInput } from './settings.types'

export const settingsKeys = {
  all: (organizationId: string) => ['settings', organizationId] as const,
  catalog: (organizationId: string, kind: CatalogKind) =>
    ['settings', organizationId, 'catalog', kind] as const,
  members: (organizationId: string) => ['settings', organizationId, 'members'] as const,
  organization: (organizationId: string) => ['settings', organizationId, 'organization'] as const,
  profile: (userId: string) => ['settings', 'profile', userId] as const,
}

export const useOrganizationSettings = (organizationId?: string) =>
  useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getOrganization(organizationId!),
    queryKey: settingsKeys.organization(organizationId ?? ''),
  })

export function useUpdateOrganization(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; slug: string }) =>
      updateOrganization(organizationId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.all(organizationId) }),
  })
}

export const useCatalog = (kind: CatalogKind, organizationId?: string) =>
  useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => listCatalog(kind, organizationId!),
    queryKey: settingsKeys.catalog(organizationId ?? '', kind),
  })

export function useCatalogMutations(kind: CatalogKind, organizationId: string) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: settingsKeys.catalog(organizationId, kind) })
  return {
    create: useMutation({
      mutationFn: (input: { name: string; description: string; color: string }) =>
        createCatalogItem(kind, organizationId, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteCatalogItem(kind, organizationId, id),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (input: {
        id: string
        name: string
        description: string
        color: string
        isActive: boolean
      }) => updateCatalogItem(kind, organizationId, input.id, input),
      onSuccess: invalidate,
    }),
  }
}

export const useMembers = (organizationId?: string) =>
  useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => listMembers(organizationId!),
    queryKey: settingsKeys.members(organizationId ?? ''),
  })

export function useMemberMutations(organizationId: string) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: settingsKeys.members(organizationId) })
  return {
    invite: useMutation({
      mutationFn: (input: { email: string; role: string; teamId: string }) =>
        inviteMember(organizationId, input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: MemberUpdate }) =>
        updateMember(organizationId, id, input),
      onSuccess: invalidate,
    }),
  }
}

export const useProfileSettings = (userId?: string) =>
  useQuery({
    enabled: Boolean(userId),
    queryFn: () => getProfile(userId!),
    queryKey: settingsKeys.profile(userId ?? ''),
  })

export function useUpdateProfile(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProfileInput) => updateProfile(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.profile(userId) }),
  })
}
