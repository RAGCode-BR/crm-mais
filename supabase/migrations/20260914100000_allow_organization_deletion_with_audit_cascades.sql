-- Deleting an organization cascades to its tenant records. Their audit triggers
-- can run after the parent row has been removed, so they must not attempt to
-- create audit entries that would immediately violate the parent foreign key.
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

  -- Cascade deletes no longer have a valid parent organization. Their audit
  -- history is deleted together with that parent, so skip transient entries.
  if not exists (
    select 1 from public.organizations where id = target_organization_id
  ) then
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
