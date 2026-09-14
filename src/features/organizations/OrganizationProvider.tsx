import { useMemo, useState, type PropsWithChildren } from 'react'

import { useAuth } from '@/features/auth'

import { OrganizationContext, type OrganizationContextValue } from './organization-context'
import { useOrganizations } from './useOrganizations'

function storageKey(userId: string) {
  return `crm.active-organization.${userId}`
}

function readStoredOrganizationId(userId: string): string | null {
  try {
    return localStorage.getItem(storageKey(userId))
  } catch {
    return null
  }
}

function writeStoredOrganizationId(userId: string, organizationId: string) {
  try {
    localStorage.setItem(storageKey(userId), organizationId)
  } catch {
    // Ignora falhas de armazenamento (navegação privada, políticas restritivas, etc.).
  }
}

export function OrganizationProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const [selectedOrganizations, setSelectedOrganizations] = useState<Record<string, string>>({})
  const query = useOrganizations(user?.id)
  const organizations = useMemo(() => query.data ?? [], [query.data])
  const storedOrganizationId = user ? readStoredOrganizationId(user.id) : null
  const selectedOrganizationId = user
    ? (selectedOrganizations[user.id] ?? storedOrganizationId)
    : null
  const activeOrganization =
    organizations.find(({ organizationId }) => organizationId === selectedOrganizationId) ??
    organizations[0] ??
    null

  const value = useMemo<OrganizationContextValue>(
    () => ({
      activeOrganization,
      error: query.error,
      isLoading: query.isLoading,
      organizations,
      refetch: query.refetch,
      setActiveOrganization: (organizationId) => {
        if (!user) return

        writeStoredOrganizationId(user.id, organizationId)
        setSelectedOrganizations((current) => ({
          ...current,
          [user.id]: organizationId,
        }))
      },
    }),
    [activeOrganization, organizations, query.error, query.isLoading, query.refetch, user],
  )

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
}
