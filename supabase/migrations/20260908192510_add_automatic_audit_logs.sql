-- Capture important business mutations at the database boundary. The trigger
-- stores a minimized business snapshot: free text and direct personal
-- identifiers are removed before values reach the audit table.
create or replace function private.capture_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_row jsonb;
  old_safe jsonb := '{}'::jsonb;
  new_safe jsonb := '{}'::jsonb;
  changed_old jsonb := '{}'::jsonb;
  changed_new jsonb := '{}'::jsonb;
  target_organization_id uuid;
  target_entity_id uuid;
  target_actor_member_id uuid;
  excluded_fields constant text[] := array[
    'id', 'organization_id', 'created_at', 'updated_at', 'created_by',
    'tax_id', 'email', 'phone', 'whatsapp', 'notes', 'description',
    'content', 'metadata', 'storage_path', 'file_name', 'mime_type',
    'website', 'linkedin_url', 'avatar_url', 'ip_address', 'user_agent'
  ];
begin
  source_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  target_entity_id := nullif(source_row ->> 'id', '')::uuid;
  target_organization_id := case
    when tg_table_name = 'organizations' then target_entity_id
    else nullif(source_row ->> 'organization_id', '')::uuid
  end;

  if target_organization_id is null then
    return null;
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    old_safe := to_jsonb(old) - excluded_fields;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    new_safe := to_jsonb(new) - excluded_fields;
  end if;

  if tg_op = 'UPDATE' then
    select
      coalesce(jsonb_object_agg(previous.key, previous.value), '{}'::jsonb),
      coalesce(jsonb_object_agg(previous.key, new_safe -> previous.key), '{}'::jsonb)
    into changed_old, changed_new
    from jsonb_each(old_safe) as previous
    where previous.value is distinct from new_safe -> previous.key;

    if changed_old = '{}'::jsonb then
      return null;
    end if;
    old_safe := changed_old;
    new_safe := changed_new;
  end if;

  select member.id
    into target_actor_member_id
  from public.organization_members as member
  where member.organization_id = target_organization_id
    and member.profile_id = (select auth.uid())
    and member.status = 'active'
  limit 1;

  insert into public.audit_logs (
    organization_id,
    actor_member_id,
    entity_type,
    entity_id,
    action,
    previous_values,
    new_values,
    created_by
  )
  values (
    target_organization_id,
    target_actor_member_id,
    tg_table_name,
    target_entity_id,
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then old_safe else null end,
    case when tg_op in ('INSERT', 'UPDATE') then new_safe else null end,
    (select auth.uid())
  );

  return null;
end;
$$;

revoke all on function private.capture_audit_log()
  from public, anon, authenticated, service_role;

comment on function private.capture_audit_log() is
  'Internal trigger that records sanitized, organization-scoped business mutations.';

do $$
declare
  audited_table text;
begin
  foreach audited_table in array array[
    'teams', 'organization_members', 'lead_sources', 'companies', 'contacts',
    'leads', 'pipelines', 'pipeline_stages', 'opportunities', 'activities',
    'tasks', 'notes', 'tags', 'entity_tags', 'attachments',
    'notification_preferences', 'prospecting_lists', 'prospecting_list_items',
    'cadences', 'cadence_steps', 'cadence_enrollments', 'lead_scoring_rules',
    'commercial_recommendation_rules'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.capture_audit_log()',
      audited_table || '_capture_audit_log',
      audited_table
    );
  end loop;
end;
$$;

create trigger organizations_capture_audit_log
after insert or update on public.organizations
for each row execute function private.capture_audit_log();
