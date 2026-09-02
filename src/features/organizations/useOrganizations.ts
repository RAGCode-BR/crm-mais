import { useQuery } from '@tanstack/react-query'

import { listOrganizationsForUser } from './organization.service'

export const organizationKeys = {
  forUser: (userId: string) => ['organizations', 'user', userId] as const,
}

export function useOrganizations(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => listOrganizationsForUser(userId ?? ''),
    queryKey: organizationKeys.forUser(userId ?? 'anonymous'),
  })
}
