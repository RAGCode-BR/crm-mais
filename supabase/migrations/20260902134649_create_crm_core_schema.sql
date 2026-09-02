-- CRM+ core schema
-- Block 1: data model only. Authorization policies are introduced in Block 2.

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) > 0),
  avatar_url text,
  phone text,
  timezone text not null default 'America/Sao_Paulo',
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint organizations_slug_key unique (slug)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint teams_organization_id_id_key unique (organization_id, id),
  constraint teams_organization_id_name_key unique (organization_id, name)
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  team_id uuid,
  role text not null default 'sales'
    check (role in ('owner', 'admin', 'manager', 'sales', 'viewer')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint organization_members_organization_id_id_key unique (organization_id, id),
  constraint organization_members_organization_id_profile_id_key
    unique (organization_id, profile_id),
  constraint organization_members_team_fkey
    foreign key (organization_id, team_id)
    references public.teams (organization_id, id)
);

create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint lead_sources_organization_id_id_key unique (organization_id, id),
  constraint lead_sources_organization_id_name_key unique (organization_id, name)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  trade_name text not null check (length(btrim(trade_name)) > 0),
  legal_name text,
  tax_id text,
  industry text,
  company_size text,
  employee_count integer check (employee_count is null or employee_count >= 0),
  website text,
  phone text,
  email text,
  city text,
  state text,
  country_code text not null default 'BR' check (country_code ~ '^[A-Z]{2}$'),
  notes text,
  owner_member_id uuid,
  lead_source_id uuid,
  status text not null default 'prospect'
    check (status in ('prospect', 'active', 'inactive', 'archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint companies_organization_id_id_key unique (organization_id, id),
  constraint companies_owner_member_fkey
    foreign key (organization_id, owner_member_id)
    references public.organization_members (organization_id, id),
  constraint companies_lead_source_fkey
    foreign key (organization_id, lead_source_id)
    references public.lead_sources (organization_id, id),
  constraint companies_archived_at_check
    check (status = 'archived' or archived_at is null)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid not null,
  first_name text not null check (length(btrim(first_name)) > 0),
  last_name text,
  job_title text,
  department text,
  phone text,
  whatsapp text,
  email text,
  linkedin_url text,
  is_primary boolean not null default false,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint contacts_organization_id_id_key unique (organization_id, id),
  constraint contacts_organization_company_id_id_key
    unique (organization_id, company_id, id),
  constraint contacts_company_fkey
    foreign key (organization_id, company_id)
    references public.companies (organization_id, id)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  company_id uuid,
  contact_id uuid,
  owner_member_id uuid,
  lead_source_id uuid,
  email text,
  phone text,
  status text not null default 'new'
    check (status in ('new', 'researching', 'contacted', 'qualified', 'unqualified', 'converted', 'archived')),
  temperature text not null default 'cold'
    check (temperature in ('cold', 'warm', 'hot')),
  score smallint not null default 0 check (score between 0 and 100),
  next_action text,
  next_contact_at timestamptz,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint leads_organization_id_id_key unique (organization_id, id),
  constraint leads_company_fkey
    foreign key (organization_id, company_id)
    references public.companies (organization_id, id),
  constraint leads_contact_fkey
    foreign key (organization_id, contact_id)
    references public.contacts (organization_id, id),
  constraint leads_contact_company_fkey
    foreign key (organization_id, company_id, contact_id)
    references public.contacts (organization_id, company_id, id),
  constraint leads_owner_member_fkey
    foreign key (organization_id, owner_member_id)
    references public.organization_members (organization_id, id),
  constraint leads_lead_source_fkey
    foreign key (organization_id, lead_source_id)
    references public.lead_sources (organization_id, id),
  constraint leads_archived_at_check
    check (status = 'archived' or archived_at is null)
);

create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  description text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint pipelines_organization_id_id_key unique (organization_id, id),
  constraint pipelines_organization_id_name_key unique (organization_id, name)
);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pipeline_id uuid not null,
  name text not null check (length(btrim(name)) > 0),
  position smallint not null check (position >= 0),
  default_probability smallint not null default 0
    check (default_probability between 0 and 100),
  is_closed boolean not null default false,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint pipeline_stages_organization_id_id_key unique (organization_id, id),
  constraint pipeline_stages_organization_pipeline_id_id_key
    unique (organization_id, pipeline_id, id),
  constraint pipeline_stages_pipeline_position_key unique (pipeline_id, position),
  constraint pipeline_stages_pipeline_name_key unique (pipeline_id, name),
  constraint pipeline_stages_pipeline_fkey
    foreign key (organization_id, pipeline_id)
    references public.pipelines (organization_id, id),
  constraint pipeline_stages_outcome_check
    check (
      (not is_won and not is_lost)
      or (is_closed and is_won <> is_lost)
    )
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  company_id uuid not null,
  contact_id uuid,
  lead_id uuid,
  owner_member_id uuid,
  pipeline_id uuid not null,
  stage_id uuid not null,
  lead_source_id uuid,
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  estimated_value numeric(15, 2) not null default 0 check (estimated_value >= 0),
  probability smallint not null default 0 check (probability between 0 and 100),
  expected_close_date date,
  product_service text,
  description text,
  loss_reason text,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint opportunities_organization_id_id_key unique (organization_id, id),
  constraint opportunities_company_fkey
    foreign key (organization_id, company_id)
    references public.companies (organization_id, id),
  constraint opportunities_contact_fkey
    foreign key (organization_id, company_id, contact_id)
    references public.contacts (organization_id, company_id, id),
  constraint opportunities_lead_fkey
    foreign key (organization_id, lead_id)
    references public.leads (organization_id, id),
  constraint opportunities_owner_member_fkey
    foreign key (organization_id, owner_member_id)
    references public.organization_members (organization_id, id),
  constraint opportunities_pipeline_fkey
    foreign key (organization_id, pipeline_id)
    references public.pipelines (organization_id, id),
  constraint opportunities_stage_fkey
    foreign key (organization_id, pipeline_id, stage_id)
    references public.pipeline_stages (organization_id, pipeline_id, id),
  constraint opportunities_lead_source_fkey
    foreign key (organization_id, lead_source_id)
    references public.lead_sources (organization_id, id),
  constraint opportunities_closed_at_check
    check (
      (status = 'open' and closed_at is null)
      or (status in ('won', 'lost') and closed_at is not null)
    ),
  constraint opportunities_loss_reason_check
    check (
      status <> 'lost'
      or (loss_reason is not null and length(btrim(loss_reason)) > 0)
    )
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid,
  contact_id uuid,
  lead_id uuid,
  opportunity_id uuid,
  actor_member_id uuid,
  type text not null
    check (type in ('call', 'whatsapp', 'email', 'meeting', 'note', 'stage_change', 'assignment_change', 'proposal', 'task', 'system')),
  subject text not null check (length(btrim(subject)) > 0),
  description text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint activities_organization_id_id_key unique (organization_id, id),
  constraint activities_company_fkey
    foreign key (organization_id, company_id)
    references public.companies (organization_id, id),
  constraint activities_contact_fkey
    foreign key (organization_id, contact_id)
    references public.contacts (organization_id, id),
  constraint activities_lead_fkey
    foreign key (organization_id, lead_id)
    references public.leads (organization_id, id),
  constraint activities_opportunity_fkey
    foreign key (organization_id, opportunity_id)
    references public.opportunities (organization_id, id),
  constraint activities_actor_member_fkey
    foreign key (organization_id, actor_member_id)
    references public.organization_members (organization_id, id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid,
  contact_id uuid,
  lead_id uuid,
  opportunity_id uuid,
  assigned_member_id uuid,
  title text not null check (length(btrim(title)) > 0),
  description text,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  type text not null default 'general'
    check (type in ('call', 'whatsapp', 'email', 'meeting', 'follow_up', 'general')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint tasks_organization_id_id_key unique (organization_id, id),
  constraint tasks_company_fkey
    foreign key (organization_id, company_id)
    references public.companies (organization_id, id),
  constraint tasks_contact_fkey
    foreign key (organization_id, contact_id)
    references public.contacts (organization_id, id),
  constraint tasks_lead_fkey
    foreign key (organization_id, lead_id)
    references public.leads (organization_id, id),
  constraint tasks_opportunity_fkey
    foreign key (organization_id, opportunity_id)
    references public.opportunities (organization_id, id),
  constraint tasks_assigned_member_fkey
    foreign key (organization_id, assigned_member_id)
    references public.organization_members (organization_id, id),
  constraint tasks_completed_at_check
    check (
      (status = 'completed' and completed_at is not null)
      or (status <> 'completed' and completed_at is null)
    )
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid,
  contact_id uuid,
  lead_id uuid,
  opportunity_id uuid,
  author_member_id uuid not null,
  content text not null check (length(btrim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint notes_organization_id_id_key unique (organization_id, id),
  constraint notes_company_fkey
    foreign key (organization_id, company_id)
    references public.companies (organization_id, id),
  constraint notes_contact_fkey
    foreign key (organization_id, contact_id)
    references public.contacts (organization_id, id),
  constraint notes_lead_fkey
    foreign key (organization_id, lead_id)
    references public.leads (organization_id, id),
  constraint notes_opportunity_fkey
    foreign key (organization_id, opportunity_id)
    references public.opportunities (organization_id, id),
  constraint notes_author_member_fkey
    foreign key (organization_id, author_member_id)
    references public.organization_members (organization_id, id),
  constraint notes_single_parent_check
    check (num_nonnulls(company_id, contact_id, lead_id, opportunity_id) = 1)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint tags_organization_id_id_key unique (organization_id, id)
);

create table public.entity_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tag_id uuid not null,
  company_id uuid,
  contact_id uuid,
  lead_id uuid,
  opportunity_id uuid,
  activity_id uuid,
  task_id uuid,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint entity_tags_organization_id_id_key unique (organization_id, id),
  constraint entity_tags_tag_fkey
    foreign key (organization_id, tag_id)
    references public.tags (organization_id, id),
  constraint entity_tags_company_fkey
    foreign key (organization_id, company_id)
    references public.companies (organization_id, id),
  constraint entity_tags_contact_fkey
    foreign key (organization_id, contact_id)
    references public.contacts (organization_id, id),
  constraint entity_tags_lead_fkey
    foreign key (organization_id, lead_id)
    references public.leads (organization_id, id),
  constraint entity_tags_opportunity_fkey
    foreign key (organization_id, opportunity_id)
    references public.opportunities (organization_id, id),
  constraint entity_tags_activity_fkey
    foreign key (organization_id, activity_id)
    references public.activities (organization_id, id),
  constraint entity_tags_task_fkey
    foreign key (organization_id, task_id)
    references public.tasks (organization_id, id),
  constraint entity_tags_single_parent_check
    check (
      num_nonnulls(company_id, contact_id, lead_id, opportunity_id, activity_id, task_id) = 1
    )
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid,
  lead_id uuid,
  opportunity_id uuid,
  activity_id uuid,
  uploaded_by_member_id uuid not null,
  storage_bucket text not null check (length(btrim(storage_bucket)) > 0),
  storage_path text not null check (length(btrim(storage_path)) > 0),
  file_name text not null check (length(btrim(file_name)) > 0),
  mime_type text,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint attachments_organization_id_id_key unique (organization_id, id),
  constraint attachments_storage_object_key unique (storage_bucket, storage_path),
  constraint attachments_company_fkey
    foreign key (organization_id, company_id)
    references public.companies (organization_id, id),
  constraint attachments_lead_fkey
    foreign key (organization_id, lead_id)
    references public.leads (organization_id, id),
  constraint attachments_opportunity_fkey
    foreign key (organization_id, opportunity_id)
    references public.opportunities (organization_id, id),
  constraint attachments_activity_fkey
    foreign key (organization_id, activity_id)
    references public.activities (organization_id, id),
  constraint attachments_uploaded_by_member_fkey
    foreign key (organization_id, uploaded_by_member_id)
    references public.organization_members (organization_id, id),
  constraint attachments_single_parent_check
    check (num_nonnulls(company_id, lead_id, opportunity_id, activity_id) = 1)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  recipient_member_id uuid not null,
  type text not null
    check (type in ('task_due', 'task_overdue', 'lead_assigned', 'opportunity_changed', 'opportunity_stalled', 'meeting', 'hot_lead', 'mention', 'system')),
  title text not null check (length(btrim(title)) > 0),
  body text,
  related_entity_type text,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint notifications_organization_id_id_key unique (organization_id, id),
  constraint notifications_recipient_member_fkey
    foreign key (organization_id, recipient_member_id)
    references public.organization_members (organization_id, id),
  constraint notifications_related_entity_check
    check ((related_entity_type is null) = (related_entity_id is null))
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_member_id uuid,
  entity_type text not null check (length(btrim(entity_type)) > 0),
  entity_id uuid,
  action text not null check (length(btrim(action)) > 0),
  previous_values jsonb check (
    previous_values is null or jsonb_typeof(previous_values) = 'object'
  ),
  new_values jsonb check (new_values is null or jsonb_typeof(new_values) = 'object'),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint audit_logs_organization_id_id_key unique (organization_id, id),
  constraint audit_logs_actor_member_fkey
    foreign key (organization_id, actor_member_id)
    references public.organization_members (organization_id, id)
);

-- Frequently joined and filtered columns.
create index profiles_full_name_idx on public.profiles (lower(full_name));

create index organizations_created_by_idx on public.organizations (created_by)
  where created_by is not null;

create index teams_organization_active_idx on public.teams (organization_id, is_active);
create index teams_created_by_idx on public.teams (created_by) where created_by is not null;

create index organization_members_profile_id_idx
  on public.organization_members (profile_id);
create index organization_members_team_id_idx
  on public.organization_members (organization_id, team_id)
  where team_id is not null;
create index organization_members_active_role_idx
  on public.organization_members (organization_id, role)
  where status = 'active';
create index organization_members_created_by_idx
  on public.organization_members (created_by)
  where created_by is not null;

create index lead_sources_organization_active_idx
  on public.lead_sources (organization_id, is_active);
create index lead_sources_created_by_idx
  on public.lead_sources (created_by)
  where created_by is not null;

create index companies_organization_status_created_idx
  on public.companies (organization_id, status, created_at desc);
create index companies_owner_member_idx
  on public.companies (organization_id, owner_member_id)
  where owner_member_id is not null;
create index companies_lead_source_idx
  on public.companies (organization_id, lead_source_id)
  where lead_source_id is not null;
create index companies_trade_name_idx on public.companies (organization_id, lower(trade_name));
create index companies_tax_id_idx on public.companies (organization_id, tax_id)
  where tax_id is not null;
create index companies_email_idx on public.companies (organization_id, lower(email))
  where email is not null;
create index companies_created_by_idx on public.companies (created_by)
  where created_by is not null;

create index contacts_name_idx
  on public.contacts (organization_id, lower(first_name), lower(last_name));
create index contacts_email_idx on public.contacts (organization_id, lower(email))
  where email is not null;
create index contacts_phone_idx on public.contacts (organization_id, phone)
  where phone is not null;
create unique index contacts_one_primary_per_company_idx
  on public.contacts (organization_id, company_id)
  where is_primary and archived_at is null;
create index contacts_created_by_idx on public.contacts (created_by)
  where created_by is not null;

create index leads_organization_status_created_idx
  on public.leads (organization_id, status, created_at desc);
create index leads_owner_status_idx
  on public.leads (organization_id, owner_member_id, status)
  where owner_member_id is not null and archived_at is null;
create index leads_next_contact_idx
  on public.leads (organization_id, next_contact_at)
  where next_contact_at is not null and archived_at is null;
create index leads_company_id_idx on public.leads (organization_id, company_id)
  where company_id is not null;
create index leads_contact_id_idx on public.leads (organization_id, contact_id, company_id)
  where contact_id is not null;
create index leads_lead_source_id_idx on public.leads (organization_id, lead_source_id)
  where lead_source_id is not null;
create index leads_name_idx on public.leads (organization_id, lower(name));
create index leads_email_idx on public.leads (organization_id, lower(email))
  where email is not null;
create index leads_phone_idx on public.leads (organization_id, phone)
  where phone is not null;
create index leads_created_by_idx on public.leads (created_by)
  where created_by is not null;

create index pipelines_organization_active_idx
  on public.pipelines (organization_id, is_active);
create unique index pipelines_one_default_per_organization_idx
  on public.pipelines (organization_id)
  where is_default;
create index pipelines_created_by_idx on public.pipelines (created_by)
  where created_by is not null;

create index pipeline_stages_pipeline_position_idx
  on public.pipeline_stages (organization_id, pipeline_id, position);
create index pipeline_stages_created_by_idx on public.pipeline_stages (created_by)
  where created_by is not null;

create index opportunities_organization_status_created_idx
  on public.opportunities (organization_id, status, created_at desc);
create index opportunities_stage_status_idx
  on public.opportunities (organization_id, pipeline_id, stage_id, status);
create index opportunities_owner_status_idx
  on public.opportunities (organization_id, owner_member_id, status)
  where owner_member_id is not null;
create index opportunities_expected_close_idx
  on public.opportunities (organization_id, expected_close_date)
  where status = 'open' and expected_close_date is not null;
create index opportunities_company_id_idx
  on public.opportunities (organization_id, company_id);
create index opportunities_contact_id_idx
  on public.opportunities (organization_id, contact_id, company_id)
  where contact_id is not null;
create index opportunities_lead_id_idx
  on public.opportunities (organization_id, lead_id)
  where lead_id is not null;
create index opportunities_lead_source_id_idx
  on public.opportunities (organization_id, lead_source_id)
  where lead_source_id is not null;
create index opportunities_created_by_idx on public.opportunities (created_by)
  where created_by is not null;

create index activities_organization_occurred_idx
  on public.activities (organization_id, occurred_at desc);
create index activities_type_occurred_idx
  on public.activities (organization_id, type, occurred_at desc);
create index activities_company_id_idx
  on public.activities (organization_id, company_id, occurred_at desc)
  where company_id is not null;
create index activities_contact_id_idx
  on public.activities (organization_id, contact_id, occurred_at desc)
  where contact_id is not null;
create index activities_lead_id_idx
  on public.activities (organization_id, lead_id, occurred_at desc)
  where lead_id is not null;
create index activities_opportunity_id_idx
  on public.activities (organization_id, opportunity_id, occurred_at desc)
  where opportunity_id is not null;
create index activities_actor_member_id_idx
  on public.activities (organization_id, actor_member_id)
  where actor_member_id is not null;
create index activities_created_by_idx on public.activities (created_by)
  where created_by is not null;

create index tasks_assigned_status_due_idx
  on public.tasks (organization_id, assigned_member_id, status, due_at)
  where assigned_member_id is not null;
create index tasks_open_due_idx on public.tasks (organization_id, due_at)
  where status in ('pending', 'in_progress') and due_at is not null;
create index tasks_company_id_idx on public.tasks (organization_id, company_id)
  where company_id is not null;
create index tasks_contact_id_idx on public.tasks (organization_id, contact_id)
  where contact_id is not null;
create index tasks_lead_id_idx on public.tasks (organization_id, lead_id)
  where lead_id is not null;
create index tasks_opportunity_id_idx on public.tasks (organization_id, opportunity_id)
  where opportunity_id is not null;
create index tasks_created_by_idx on public.tasks (created_by)
  where created_by is not null;

create index notes_company_id_idx on public.notes (organization_id, company_id, created_at desc)
  where company_id is not null;
create index notes_contact_id_idx on public.notes (organization_id, contact_id, created_at desc)
  where contact_id is not null;
create index notes_lead_id_idx on public.notes (organization_id, lead_id, created_at desc)
  where lead_id is not null;
create index notes_opportunity_id_idx
  on public.notes (organization_id, opportunity_id, created_at desc)
  where opportunity_id is not null;
create index notes_author_member_id_idx
  on public.notes (organization_id, author_member_id);
create index notes_created_by_idx on public.notes (created_by)
  where created_by is not null;

create unique index tags_organization_name_key on public.tags (organization_id, lower(name));
create index tags_created_by_idx on public.tags (created_by) where created_by is not null;

create unique index entity_tags_company_key
  on public.entity_tags (organization_id, company_id, tag_id)
  where company_id is not null;
create unique index entity_tags_contact_key
  on public.entity_tags (organization_id, contact_id, tag_id)
  where contact_id is not null;
create unique index entity_tags_lead_key
  on public.entity_tags (organization_id, lead_id, tag_id)
  where lead_id is not null;
create unique index entity_tags_opportunity_key
  on public.entity_tags (organization_id, opportunity_id, tag_id)
  where opportunity_id is not null;
create unique index entity_tags_activity_key
  on public.entity_tags (organization_id, activity_id, tag_id)
  where activity_id is not null;
create unique index entity_tags_task_key
  on public.entity_tags (organization_id, task_id, tag_id)
  where task_id is not null;
create index entity_tags_tag_id_idx on public.entity_tags (organization_id, tag_id);
create index entity_tags_created_by_idx on public.entity_tags (created_by)
  where created_by is not null;

create index attachments_company_id_idx
  on public.attachments (organization_id, company_id, created_at desc)
  where company_id is not null;
create index attachments_lead_id_idx
  on public.attachments (organization_id, lead_id, created_at desc)
  where lead_id is not null;
create index attachments_opportunity_id_idx
  on public.attachments (organization_id, opportunity_id, created_at desc)
  where opportunity_id is not null;
create index attachments_activity_id_idx
  on public.attachments (organization_id, activity_id, created_at desc)
  where activity_id is not null;
create index attachments_uploaded_by_member_idx
  on public.attachments (organization_id, uploaded_by_member_id);
create index attachments_created_by_idx on public.attachments (created_by)
  where created_by is not null;

create index notifications_recipient_created_idx
  on public.notifications (organization_id, recipient_member_id, created_at desc);
create index notifications_unread_idx
  on public.notifications (organization_id, recipient_member_id, created_at desc)
  where read_at is null;
create index notifications_created_by_idx on public.notifications (created_by)
  where created_by is not null;

create index audit_logs_entity_created_idx
  on public.audit_logs (organization_id, entity_type, entity_id, created_at desc);
create index audit_logs_actor_created_idx
  on public.audit_logs (organization_id, actor_member_id, created_at desc)
  where actor_member_id is not null;
create index audit_logs_created_by_idx on public.audit_logs (created_by)
  where created_by is not null;

-- updated_at is maintained consistently for every mutable table.
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function private.set_updated_at();
create trigger teams_set_updated_at before update on public.teams
for each row execute function private.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members
for each row execute function private.set_updated_at();
create trigger lead_sources_set_updated_at before update on public.lead_sources
for each row execute function private.set_updated_at();
create trigger companies_set_updated_at before update on public.companies
for each row execute function private.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts
for each row execute function private.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
for each row execute function private.set_updated_at();
create trigger pipelines_set_updated_at before update on public.pipelines
for each row execute function private.set_updated_at();
create trigger pipeline_stages_set_updated_at before update on public.pipeline_stages
for each row execute function private.set_updated_at();
create trigger opportunities_set_updated_at before update on public.opportunities
for each row execute function private.set_updated_at();
create trigger activities_set_updated_at before update on public.activities
for each row execute function private.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function private.set_updated_at();
create trigger notes_set_updated_at before update on public.notes
for each row execute function private.set_updated_at();
create trigger tags_set_updated_at before update on public.tags
for each row execute function private.set_updated_at();
create trigger attachments_set_updated_at before update on public.attachments
for each row execute function private.set_updated_at();
create trigger notifications_set_updated_at before update on public.notifications
for each row execute function private.set_updated_at();

-- Secure-by-default foundation. Operation-specific policies and grants belong to Block 2.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.teams enable row level security;
alter table public.organization_members enable row level security;
alter table public.lead_sources enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.opportunities enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.entity_tags enable row level security;
alter table public.attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table
  public.profiles,
  public.organizations,
  public.teams,
  public.organization_members,
  public.lead_sources,
  public.companies,
  public.contacts,
  public.leads,
  public.pipelines,
  public.pipeline_stages,
  public.opportunities,
  public.activities,
  public.tasks,
  public.notes,
  public.tags,
  public.entity_tags,
  public.attachments,
  public.notifications,
  public.audit_logs
from anon, authenticated;

comment on schema private is 'Internal database helpers. Not exposed through the Data API.';
comment on table public.organization_members is
  'Membership is the authorization boundary between profiles and organizations.';
comment on table public.entity_tags is
  'Polymorphic tag links implemented with explicit tenant-safe foreign keys.';
comment on table public.audit_logs is
  'Append-only audit records. Automatic audit capture is introduced in Block 17.';
