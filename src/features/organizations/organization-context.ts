import { createContext } from 'react'

import type { OrganizationAccess } from './organization.service'

export type OrganizationContextValue = {
  activeOrganization: OrganizationAccess | null
  error: Error | null
  isLoading: boolean
  organizations: OrganizationAccess[]
  refetch: () => Promise<unknown>
  setActiveOrganization: (organizationId: string) => void
}

export const OrganizationContext = createContext<OrganizationContextValue | null>(null)
