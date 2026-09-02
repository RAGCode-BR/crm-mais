import { supabase } from '@/lib/supabase/client'
import type { OrganizationRole, OrganizationStatus } from '@/types/database/identity'

export type OrganizationAccess = {
  membershipId: string
  organizationId: string
  name: string
  role: OrganizationRole
  slug: string
  status: OrganizationStatus
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('A conexão pública com o Supabase ainda não foi configurada.')
  }

  return supabase
}

export async function listOrganizationsForUser(userId: string): Promise<OrganizationAccess[]> {
  const client = requireSupabase()
  const { data: memberships, error: membershipsError } = await client
    .from('organization_members')
    .select('id, organization_id, role, status')
    .eq('profile_id', userId)
    .eq('status', 'active')

  if (membershipsError) throw membershipsError
  if (memberships.length === 0) return []

  const organizationIds = memberships.map(({ organization_id }) => organization_id)
  const { data: organizations, error: organizationsError } = await client
    .from('organizations')
    .select('id, name, slug, status')
    .in('id', organizationIds)
    .eq('status', 'active')

  if (organizationsError) throw organizationsError

  const organizationsById = new Map(
    organizations.map((organization) => [organization.id, organization]),
  )

  return memberships.flatMap((membership) => {
    const organization = organizationsById.get(membership.organization_id)

    if (!organization) return []

    return [
      {
        membershipId: membership.id,
        organizationId: organization.id,
        name: organization.name,
        role: membership.role,
        slug: organization.slug,
        status: organization.status,
      },
    ]
  })
}

export async function createOrganization(name: string, slug: string) {
  const id = crypto.randomUUID()
  const { error } = await requireSupabase().from('organizations').insert({
    id,
    name,
    slug,
    status: 'active',
  })

  if (error) throw error

  return id
}

export function getOrganizationErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Não foi possível concluir a solicitação.'

  const errorWithCode = error as Error & { code?: string }

  if (errorWithCode.code === '23505') {
    return 'Este identificador já está sendo usado por outra organização.'
  }

  return error.message
}
