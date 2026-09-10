import type {
  MembershipStatus,
  OrganizationMember,
  OrganizationRole,
  Profile,
  Team,
} from '@/types/database/identity'
import type { LeadSource, LossReason } from '@/types/database/crm'
import type { Tag } from '@/types/database/engagement'

export type CatalogKind = 'teams' | 'lead_sources' | 'tags' | 'loss_reasons'
export type CatalogRow = Team | LeadSource | Tag | LossReason

export type MemberView = OrganizationMember & {
  profile: Profile
}

export type MemberUpdate = {
  role: OrganizationRole
  status: MembershipStatus
  teamId: string
}

export type ProfileInput = Pick<Profile, 'full_name' | 'phone' | 'timezone' | 'locale'>
