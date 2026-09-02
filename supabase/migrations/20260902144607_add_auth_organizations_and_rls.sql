-- Block 2: Supabase Auth lifecycle, multi-organization membership and RBAC.

-- Authorization helpers live outside the exposed public schema. Each helper binds
-- its decision to auth.uid(); user-editable metadata is never consulted.
create or replace function private.current_organization_role(target_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select member.role
  from public.organization_members as member
  where member.organization_id = target_organization_id
    and member.profile_id = (select auth.uid())
    and member.status = 'active'
  limit 1;
$$;

create or replace function private.has_organization_role(
  target_organization_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as member
    where member.organization_id = target_organization_id
      and member.profile_id = (select auth.uid())
      and member.status = 'active'
      and member.role = any (allowed_roles)
  );
$$;

create or replace function private.shares_organization_with_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as current_member
    join public.organization_members as target_member
      on target_member.organization_id = current_member.organization_id
     and target_member.profile_id = target_profile_id
     and target_member.status = 'active'
    where current_member.profile_id = (select auth.uid())
      and current_member.status = 'active'
  );
$$;

create or replace function private.is_current_organization_member(
  target_organization_id uuid,
  target_member_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as member
    where member.id = target_member_id
      and member.organization_id = target_organization_id
      and member.profile_id = (select auth.uid())
      and member.status = 'active'
  );
$$;

revoke all on function private.current_organization_role(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.has_organization_role(uuid, text[])
  from public, anon, authenticated, service_role;
revoke all on function private.shares_organization_with_profile(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.is_current_organization_member(uuid, uuid)
  from public, anon, authenticated, service_role;

grant usage on schema private to authenticated;
grant execute on function private.current_organization_role(uuid) to authenticated;
grant execute on function private.has_organization_role(uuid, text[]) to authenticated;
grant execute on function private.shares_organization_with_profile(uuid) to authenticated;
grant execute on function private.is_current_organization_member(uuid, uuid) to authenticated;

-- Profiles are created from auth.users. Metadata is copied only as display data;
-- it is never used to authorize requests.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
begin
  display_name := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
  display_name := coalesce(display_name, nullif(split_part(new.email, '@', 1), ''), 'Usuário');

  insert into public.profiles (id, full_name)
  values (new.id, display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user()
  from public, anon, authenticated, service_role;

create trigger auth_users_create_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

insert into public.profiles (id, full_name)
select
  auth_user.id,
  coalesce(
    nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(auth_user.email, '@', 1), ''),
    'Usuário'
  )
from auth.users as auth_user
on conflict (id) do nothing;

-- Authenticated inserts cannot impersonate another creator.
create or replace function private.set_authenticated_creator()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.created_by := (select auth.uid());
  end if;

  return new;
end;
$$;

revoke all on function private.set_authenticated_creator()
  from public, anon, authenticated, service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'teams', 'organization_members', 'lead_sources',
    'companies', 'contacts', 'leads', 'pipelines', 'pipeline_stages',
    'opportunities', 'activities', 'tasks', 'notes', 'tags', 'entity_tags',
    'attachments', 'notifications', 'audit_logs'
  ]
  loop
    execute format(
      'create trigger %I before insert on public.%I for each row execute function private.set_authenticated_creator()',
      table_name || '_set_authenticated_creator',
      table_name
    );
  end loop;
end;
$$;

-- Organization creation bootstraps an active owner membership atomically.
create or replace function private.create_organization_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    insert into public.organization_members (
      organization_id,
      profile_id,
      role,
      status,
      joined_at,
      created_by
    )
    values (
      new.id,
      (select auth.uid()),
      'owner',
      'active',
      now(),
      (select auth.uid())
    );
  end if;

  return new;
end;
$$;

revoke all on function private.create_organization_owner_membership()
  from public, anon, authenticated, service_role;

create trigger organizations_create_owner_membership
after insert on public.organizations
for each row execute function private.create_organization_owner_membership();

-- Tenant records cannot be moved between organizations or have their creator
-- rewritten after insertion.
create or replace function private.protect_tenant_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id is immutable'
      using errcode = '23514';
  end if;

  if new.created_by is distinct from old.created_by then
    raise exception 'created_by is immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_tenant_identity()
  from public, anon, authenticated, service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'teams', 'organization_members', 'lead_sources', 'companies', 'contacts',
    'leads', 'pipelines', 'pipeline_stages', 'opportunities', 'activities',
    'tasks', 'notes', 'tags', 'entity_tags', 'attachments', 'notifications',
    'audit_logs'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.protect_tenant_identity()',
      table_name || '_protect_tenant_identity',
      table_name
    );
  end loop;
end;
$$;

-- An organization must keep at least one active owner while it exists.
create or replace function private.protect_last_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  removes_active_owner boolean;
begin
  removes_active_owner := old.role = 'owner'
    and old.status = 'active'
    and (
      tg_op = 'DELETE'
      or new.role <> 'owner'
      or new.status <> 'active'
    );

  if removes_active_owner
    and exists (
      select 1
      from public.organizations
      where id = old.organization_id
    )
    and not exists (
      select 1
      from public.organization_members as other_owner
      where other_owner.organization_id = old.organization_id
        and other_owner.id <> old.id
        and other_owner.role = 'owner'
        and other_owner.status = 'active'
    )
  then
    raise exception 'an organization must have at least one active owner'
      using errcode = '23514';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.protect_last_organization_owner()
  from public, anon, authenticated, service_role;

create trigger organization_members_protect_last_owner
before update or delete on public.organization_members
for each row execute function private.protect_last_organization_owner();

-- Profiles: users can see colleagues in a shared active organization and can
-- only create/update their own profile.
create policy profiles_select_shared_organization
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.shares_organization_with_profile(id))
);

create policy profiles_insert_self
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

create policy profiles_update_self
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Organizations: every authenticated user may create one and becomes its owner.
create policy organizations_select_member
on public.organizations for select
to authenticated
using (
  (select private.has_organization_role(
    id,
    array['owner', 'admin', 'manager', 'sales', 'viewer']
  ))
);

create policy organizations_insert_creator
on public.organizations for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'active'
);

create policy organizations_update_administrator
on public.organizations for update
to authenticated
using (
  (select private.has_organization_role(id, array['owner', 'admin']))
)
with check (
  (select private.has_organization_role(id, array['owner', 'admin']))
);

create policy organizations_delete_owner
on public.organizations for delete
to authenticated
using (
  (select private.has_organization_role(id, array['owner']))
);

-- Membership policies break recursive RLS lookups through private helpers.
create policy organization_members_select_member
on public.organization_members for select
to authenticated
using (
  (select private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager', 'sales', 'viewer']
  ))
);

create policy organization_members_insert_administrator
on public.organization_members for insert
to authenticated
with check (
  (select private.current_organization_role(organization_id)) = 'owner'
  or (
    (select private.current_organization_role(organization_id)) = 'admin'
    and role <> 'owner'
  )
);

create policy organization_members_update_administrator
on public.organization_members for update
to authenticated
using (
  (select private.current_organization_role(organization_id)) = 'owner'
  or (
    (select private.current_organization_role(organization_id)) = 'admin'
    and role <> 'owner'
  )
)
with check (
  (select private.current_organization_role(organization_id)) = 'owner'
  or (
    (select private.current_organization_role(organization_id)) = 'admin'
    and role <> 'owner'
  )
);

create policy organization_members_delete_administrator
on public.organization_members for delete
to authenticated
using (
  (select private.current_organization_role(organization_id)) = 'owner'
  or (
    (select private.current_organization_role(organization_id)) = 'admin'
    and role <> 'owner'
  )
);

-- Team and configuration records are managed by owner/admin/manager; all active
-- organization members can read them.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'teams', 'lead_sources', 'pipelines', 'pipeline_stages', 'tags'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.has_organization_role(organization_id, array[''owner'', ''admin'', ''manager'', ''sales'', ''viewer''])))',
      table_name || '_select_member',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.has_organization_role(organization_id, array[''owner'', ''admin'', ''manager''])))',
      table_name || '_insert_manager',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.has_organization_role(organization_id, array[''owner'', ''admin'', ''manager'']))) with check ((select private.has_organization_role(organization_id, array[''owner'', ''admin'', ''manager''])))',
      table_name || '_update_manager',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.has_organization_role(organization_id, array[''owner'', ''admin'', ''manager''])))',
      table_name || '_delete_manager',
      table_name
    );
  end loop;
end;
$$;

-- Commercial records can be created and updated by sales roles. Destructive
-- operations are limited to management roles.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'companies', 'contacts', 'leads', 'opportunities', 'activities', 'tasks',
    'notes', 'entity_tags', 'attachments'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.has_organization_role(organization_id, array[''owner'', ''admin'', ''manager'', ''sales'', ''viewer''])))',
      table_name || '_select_member',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.has_organization_role(organization_id, array[''owner'', ''admin'', ''manager'', ''sales''])))',
      table_name || '_insert_sales',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.has_organization_role(organization_id, array[''owner'', ''admin'', ''manager'', ''sales'']))) with check ((select private.has_organization_role(organization_id, array[''owner'', ''admin'', ''manager'', ''sales''])))',
      table_name || '_update_sales',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.has_organization_role(organization_id, array[''owner'', ''admin'', ''manager''])))',
      table_name || '_delete_manager',
      table_name
    );
  end loop;
end;
$$;

-- Notifications are private to their recipient. Creation belongs to future
-- server-side workflows, so the browser receives no INSERT privilege.
create policy notifications_select_recipient
on public.notifications for select
to authenticated
using (
  (select private.is_current_organization_member(
    organization_id,
    recipient_member_id
  ))
);

create policy notifications_update_recipient
on public.notifications for update
to authenticated
using (
  (select private.is_current_organization_member(
    organization_id,
    recipient_member_id
  ))
)
with check (
  (select private.is_current_organization_member(
    organization_id,
    recipient_member_id
  ))
);

create policy notifications_delete_recipient
on public.notifications for delete
to authenticated
using (
  (select private.is_current_organization_member(
    organization_id,
    recipient_member_id
  ))
);

-- Audit data is append-only from the browser and visible only to management.
create policy audit_logs_select_manager
on public.audit_logs for select
to authenticated
using (
  (select private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']
  ))
);

-- Data API privileges are intentionally explicit. Anon remains fully revoked.
grant usage on schema public to authenticated;

grant select, insert on table public.profiles to authenticated;
grant update (full_name, avatar_url, phone, timezone, locale)
  on table public.profiles to authenticated;

grant select, insert, delete on table public.organizations to authenticated;
grant update (name, slug, status)
  on table public.organizations to authenticated;

grant select, insert, delete on table public.teams to authenticated;
grant update (name, description, is_active)
  on table public.teams to authenticated;

grant select, insert, delete on table public.organization_members to authenticated;
grant update (team_id, role, status, joined_at)
  on table public.organization_members to authenticated;

grant select, insert, update, delete on table
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
  public.attachments
to authenticated;

grant select, delete on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

grant select on table public.audit_logs to authenticated;

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
from anon;
