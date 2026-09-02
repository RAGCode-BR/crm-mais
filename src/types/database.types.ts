import type { Company, Contact, Lead, LeadSource } from './database/crm'
import type { Activity, EntityTag, Note, Tag, Task } from './database/engagement'
import type { Organization, OrganizationMember, Profile, Team } from './database/identity'
import type { Opportunity, Pipeline, PipelineStage } from './database/pipeline'
import type { Attachment, AuditLog, Notification } from './database/system'

type TableDefinition<Row extends object, RequiredInsert extends keyof Row> = {
  Row: Row & Record<string, unknown>
  Insert: Pick<Row, RequiredInsert> & Partial<Omit<Row, RequiredInsert>> & Record<string, unknown>
  Update: Partial<Row> & Record<string, unknown>
  Relationships: []
}

/**
 * Public schema contract composed from the domain types.
 * Its table set is compared with Supabase CLI generated types during block validation.
 */
export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<Profile, 'id' | 'full_name'>
      organizations: TableDefinition<Organization, 'name' | 'slug'>
      teams: TableDefinition<Team, 'organization_id' | 'name'>
      organization_members: TableDefinition<OrganizationMember, 'organization_id' | 'profile_id'>
      lead_sources: TableDefinition<LeadSource, 'organization_id' | 'name'>
      companies: TableDefinition<Company, 'organization_id' | 'trade_name'>
      contacts: TableDefinition<Contact, 'organization_id' | 'company_id' | 'first_name'>
      leads: TableDefinition<Lead, 'organization_id' | 'name'>
      pipelines: TableDefinition<Pipeline, 'organization_id' | 'name'>
      pipeline_stages: TableDefinition<
        PipelineStage,
        'organization_id' | 'pipeline_id' | 'name' | 'position'
      >
      opportunities: TableDefinition<
        Opportunity,
        'organization_id' | 'title' | 'company_id' | 'pipeline_id' | 'stage_id'
      >
      activities: TableDefinition<Activity, 'organization_id' | 'type' | 'subject'>
      tasks: TableDefinition<Task, 'organization_id' | 'title'>
      notes: TableDefinition<Note, 'organization_id' | 'author_member_id' | 'content'>
      tags: TableDefinition<Tag, 'organization_id' | 'name'>
      entity_tags: TableDefinition<EntityTag, 'organization_id' | 'tag_id'>
      attachments: TableDefinition<
        Attachment,
        | 'organization_id'
        | 'uploaded_by_member_id'
        | 'storage_bucket'
        | 'storage_path'
        | 'file_name'
        | 'size_bytes'
      >
      notifications: TableDefinition<
        Notification,
        'organization_id' | 'recipient_member_id' | 'type' | 'title'
      >
      audit_logs: TableDefinition<AuditLog, 'organization_id' | 'entity_type' | 'action'>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
