import type { Company, Contact, Lead, LeadSource, LossReason } from './database/crm'
import type { Cadence, CadenceEnrollment, CadenceStep } from './database/cadence'
import type { Activity, EntityTag, Note, Tag, Task } from './database/engagement'
import type { Organization, OrganizationMember, Profile, Team } from './database/identity'
import type { Opportunity, Pipeline, PipelineStage } from './database/pipeline'
import type { ProspectingList, ProspectingListItem } from './database/prospecting'
import type { LeadScoreResult, LeadScoringRule } from './database/scoring'
import type { CommercialRecommendationRule } from './database/recommendation'
import type { Attachment, AuditLog, Notification, NotificationPreference } from './database/system'
import type { Json } from './database/common'

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
      loss_reasons: TableDefinition<LossReason, 'organization_id' | 'name'>
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
      notification_preferences: TableDefinition<
        NotificationPreference,
        'organization_id' | 'member_id' | 'type'
      >
      audit_logs: TableDefinition<AuditLog, 'organization_id' | 'entity_type' | 'action'>
      prospecting_lists: TableDefinition<ProspectingList, 'organization_id' | 'name'>
      prospecting_list_items: TableDefinition<ProspectingListItem, 'organization_id' | 'list_id'>
      cadences: TableDefinition<Cadence, 'organization_id' | 'name'>
      cadence_steps: TableDefinition<
        CadenceStep,
        'organization_id' | 'cadence_id' | 'position' | 'day_number' | 'type' | 'title'
      >
      cadence_enrollments: TableDefinition<
        CadenceEnrollment,
        'organization_id' | 'cadence_id' | 'lead_id' | 'assigned_member_id'
      >
      lead_scoring_rules: TableDefinition<
        LeadScoringRule,
        'organization_id' | 'name' | 'rule_type' | 'condition_value' | 'points'
      >
      lead_score_results: TableDefinition<
        LeadScoreResult,
        'organization_id' | 'lead_id' | 'score' | 'classification'
      >
      commercial_recommendation_rules: TableDefinition<
        CommercialRecommendationRule,
        'organization_id' | 'code' | 'name' | 'priority'
      >
    }
    Views: Record<string, never>
    Functions: {
      refresh_my_notifications: {
        Args: { target_organization_id: string }
        Returns: number
      }
      search_global: {
        Args: {
          target_organization_id: string
          search_text: string
          result_limit?: number
        }
        Returns: Array<{
          entity_type: 'company' | 'contact' | 'lead' | 'opportunity' | 'task'
          entity_id: string
          title: string
          subtitle: string
          action_path: string
          rank: number
          updated_at: string
        }>
      }
      get_sales_report: {
        Args: {
          target_organization_id: string
          period_start: string
          period_end: string
          target_owner_member_id?: string | null
          target_team_id?: string | null
          target_lead_source_id?: string | null
          target_industry?: string | null
          target_product_service?: string | null
          target_pipeline_id?: string | null
        }
        Returns: Json
      }
      get_loss_analysis: {
        Args: {
          target_organization_id: string
          period_start: string
          period_end: string
          target_owner_member_id?: string | null
          target_team_id?: string | null
          target_lead_source_id?: string | null
          target_industry?: string | null
          target_product_service?: string | null
          target_pipeline_id?: string | null
        }
        Returns: Json
      }
      get_commercial_recommendations: {
        Args: { target_organization_id: string }
        Returns: Array<{
          recommendation_id: string
          rule_code: string
          category: string
          priority: string
          title: string
          reason: string
          action_label: string
          action_path: string
          entity_type: string
          entity_id: string
          owner_member_id: string | null
          score: number | null
          reference_at: string | null
        }>
      }
      get_lead_scoring_overview: {
        Args: { target_organization_id: string }
        Returns: Array<{
          lead_id: string
          lead_name: string
          company_name: string
          owner_name: string
          score: number
          classification: string
          breakdown: Json
          calculated_at: string | null
          last_activity_at: string | null
          next_contact_at: string | null
          has_open_follow_up: boolean
        }>
      }
      recalculate_organization_lead_scores: {
        Args: { target_organization_id: string }
        Returns: number
      }
      get_commercial_dashboard: {
        Args: {
          target_organization_id: string
          period_start: string
          period_end: string
          target_owner_member_id?: string | null
          target_team_id?: string | null
          target_lead_source_id?: string | null
          target_industry?: string | null
          target_product_service?: string | null
          target_pipeline_id?: string | null
        }
        Returns: Json
      }
      save_cadence_configuration: {
        Args: {
          target_organization_id: string
          target_cadence_id: string | null
          cadence_name: string
          cadence_description: string
          cadence_status: string
          steps: Json
        }
        Returns: string
      }
      set_cadence_enrollment_status: {
        Args: { target_enrollment_id: string; target_status: string }
        Returns: CadenceEnrollment
      }
      move_opportunity: {
        Args: {
          opportunity_id: string
          target_stage_id: string
          target_loss_reason?: string | null
        }
        Returns: Opportunity
      }
      save_pipeline_configuration: {
        Args: {
          target_organization_id: string
          target_pipeline_id: string | null
          pipeline_name: string
          pipeline_description: string
          pipeline_is_default: boolean
          pipeline_is_active: boolean
          stages: Json
        }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
