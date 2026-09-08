-- Block 9: configurable sales cadences that generate internal tasks only.
create table public.cadences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  description text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint cadences_organization_id_id_key unique (organization_id, id)
);

create table public.cadence_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  cadence_id uuid not null,
  position integer not null check (position > 0),
  day_number integer not null check (day_number between 1 and 365),
  type text not null
    check (type in ('call', 'whatsapp', 'email', 'meeting', 'follow_up', 'general')),
  title text not null check (length(btrim(title)) > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint cadence_steps_organization_id_id_key unique (organization_id, id),
  constraint cadence_steps_cadence_fkey
    foreign key (organization_id, cadence_id)
    references public.cadences (organization_id, id) on delete cascade,
  constraint cadence_steps_position_key unique (organization_id, cadence_id, position)
);

create table public.cadence_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  cadence_id uuid not null,
  lead_id uuid not null,
  assigned_member_id uuid not null,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'removed')),
  started_at timestamptz not null default now(),
  current_step_position integer check (current_step_position is null or current_step_position > 0),
  next_step_due_at timestamptz,
  paused_at timestamptz,
  completed_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint cadence_enrollments_organization_id_id_key unique (organization_id, id),
  constraint cadence_enrollments_cadence_fkey
    foreign key (organization_id, cadence_id)
    references public.cadences (organization_id, id),
  constraint cadence_enrollments_lead_fkey
    foreign key (organization_id, lead_id)
    references public.leads (organization_id, id),
  constraint cadence_enrollments_assigned_member_fkey
    foreign key (organization_id, assigned_member_id)
    references public.organization_members (organization_id, id),
  constraint cadence_enrollments_state_dates_check check (
    (status = 'paused' and paused_at is not null or status <> 'paused' and paused_at is null)
    and (status = 'completed' and completed_at is not null or status <> 'completed' and completed_at is null)
    and (status = 'removed' and removed_at is not null or status <> 'removed' and removed_at is null)
  )
);

create unique index cadence_enrollments_active_lead_key
  on public.cadence_enrollments (organization_id, cadence_id, lead_id)
  where status in ('active', 'paused');
create index cadences_organization_status_idx
  on public.cadences (organization_id, status, updated_at desc);
create index cadences_created_by_idx on public.cadences (created_by)
  where created_by is not null;
create index cadence_steps_cadence_position_idx
  on public.cadence_steps (organization_id, cadence_id, position);
create index cadence_steps_created_by_idx on public.cadence_steps (created_by)
  where created_by is not null;
create index cadence_enrollments_cadence_status_idx
  on public.cadence_enrollments (organization_id, cadence_id, status, updated_at desc);
create index cadence_enrollments_assignee_due_idx
  on public.cadence_enrollments (organization_id, assigned_member_id, next_step_due_at)
  where status = 'active';
create index cadence_enrollments_lead_idx
  on public.cadence_enrollments (organization_id, lead_id, created_at desc);
create index cadence_enrollments_created_by_idx on public.cadence_enrollments (created_by)
  where created_by is not null;

alter table public.tasks
  add column cadence_enrollment_id uuid,
  add column cadence_step_id uuid,
  add constraint tasks_cadence_enrollment_fkey
    foreign key (organization_id, cadence_enrollment_id)
    references public.cadence_enrollments (organization_id, id),
  add constraint tasks_cadence_step_fkey
    foreign key (organization_id, cadence_step_id)
    references public.cadence_steps (organization_id, id),
  add constraint tasks_cadence_pair_check
    check (num_nonnulls(cadence_enrollment_id, cadence_step_id) in (0, 2));

create unique index tasks_active_cadence_step_key
  on public.tasks (organization_id, cadence_enrollment_id, cadence_step_id)
  where cadence_enrollment_id is not null and status in ('pending', 'in_progress', 'completed');
create index tasks_cadence_enrollment_idx
  on public.tasks (organization_id, cadence_enrollment_id, created_at desc)
  where cadence_enrollment_id is not null;
create index tasks_cadence_step_idx
  on public.tasks (organization_id, cadence_step_id)
  where cadence_step_id is not null;

create trigger cadences_set_updated_at before update on public.cadences
for each row execute function private.set_updated_at();
create trigger cadence_steps_set_updated_at before update on public.cadence_steps
for each row execute function private.set_updated_at();
create trigger cadence_enrollments_set_updated_at before update on public.cadence_enrollments
for each row execute function private.set_updated_at();

create trigger cadences_set_authenticated_creator before insert on public.cadences
for each row execute function private.set_authenticated_creator();
create trigger cadence_steps_set_authenticated_creator before insert on public.cadence_steps
for each row execute function private.set_authenticated_creator();
create trigger cadence_enrollments_set_authenticated_creator before insert on public.cadence_enrollments
for each row execute function private.set_authenticated_creator();

create trigger cadences_protect_tenant_identity before update on public.cadences
for each row execute function private.protect_tenant_identity();
create trigger cadence_steps_protect_tenant_identity before update on public.cadence_steps
for each row execute function private.protect_tenant_identity();
create trigger cadence_enrollments_protect_tenant_identity before update on public.cadence_enrollments
for each row execute function private.protect_tenant_identity();

create or replace function private.schedule_cadence_task(
  target_enrollment_id uuid,
  repeat_current boolean default false
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  enrollment public.cadence_enrollments;
  next_step public.cadence_steps;
  due_at timestamptz;
begin
  select * into enrollment
  from public.cadence_enrollments
  where id = target_enrollment_id
  for update;

  if not found or enrollment.status <> 'active' then
    return;
  end if;

  if repeat_current and enrollment.current_step_position is not null then
    select * into next_step
    from public.cadence_steps
    where organization_id = enrollment.organization_id
      and cadence_id = enrollment.cadence_id
      and position = enrollment.current_step_position;
  else
    select * into next_step
    from public.cadence_steps
    where organization_id = enrollment.organization_id
      and cadence_id = enrollment.cadence_id
      and position > coalesce(enrollment.current_step_position, 0)
    order by position
    limit 1;
  end if;

  if next_step.id is null then
    update public.cadence_enrollments
    set status = 'completed', completed_at = now(), next_step_due_at = null
    where id = enrollment.id;
    return;
  end if;

  due_at := greatest(
    now(),
    enrollment.started_at + make_interval(days => next_step.day_number - 1)
  );

  insert into public.tasks (
    organization_id,
    lead_id,
    assigned_member_id,
    title,
    description,
    priority,
    status,
    type,
    due_at,
    cadence_enrollment_id,
    cadence_step_id
  ) values (
    enrollment.organization_id,
    enrollment.lead_id,
    enrollment.assigned_member_id,
    '[Cadência] ' || next_step.title,
    next_step.description,
    'medium',
    'pending',
    next_step.type,
    due_at,
    enrollment.id,
    next_step.id
  );

  update public.cadence_enrollments
  set current_step_position = next_step.position,
      next_step_due_at = due_at
  where id = enrollment.id;
end;
$$;

revoke all on function private.schedule_cadence_task(uuid, boolean)
from public, anon, authenticated, service_role;
-- Trigger/RPC callers still execute with their own RLS context.
grant execute on function private.schedule_cadence_task(uuid, boolean)
to authenticated;

create or replace function private.start_cadence_enrollment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cadence_status text;
begin
  select status into cadence_status
  from public.cadences
  where organization_id = new.organization_id and id = new.cadence_id;

  if cadence_status <> 'active' then
    raise exception 'cadence must be active before enrolling leads';
  end if;

  perform private.schedule_cadence_task(new.id, false);
  return new;
end;
$$;

revoke all on function private.start_cadence_enrollment()
from public, anon, authenticated, service_role;

create trigger cadence_enrollments_start
after insert on public.cadence_enrollments
for each row execute function private.start_cadence_enrollment();

create or replace function private.advance_cadence_after_task()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.cadence_enrollment_id is not null
    and new.status in ('completed', 'cancelled')
    and old.status not in ('completed', 'cancelled') then
    perform private.schedule_cadence_task(new.cadence_enrollment_id, false);
  end if;
  return new;
end;
$$;

revoke all on function private.advance_cadence_after_task()
from public, anon, authenticated, service_role;

create trigger tasks_advance_cadence
after update of status on public.tasks
for each row execute function private.advance_cadence_after_task();

create or replace function private.prevent_cadence_task_reopen()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.cadence_enrollment_id is not null
    and old.status in ('completed', 'cancelled')
    and new.status not in ('completed', 'cancelled') then
    raise exception 'completed or cancelled cadence tasks cannot be reopened';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_cadence_task_reopen()
from public, anon, authenticated, service_role;

create trigger tasks_prevent_cadence_reopen
before update of status on public.tasks
for each row execute function private.prevent_cadence_task_reopen();

create or replace function public.set_cadence_enrollment_status(
  target_enrollment_id uuid,
  target_status text
)
returns public.cadence_enrollments
language plpgsql
security invoker
set search_path = ''
as $$
declare
  enrollment public.cadence_enrollments;
begin
  if target_status not in ('active', 'paused', 'removed') then
    raise exception 'invalid cadence enrollment status';
  end if;

  select * into enrollment
  from public.cadence_enrollments
  where id = target_enrollment_id
  for update;

  if not found then
    raise exception 'cadence enrollment not found';
  end if;

  if target_status = 'active' then
    if enrollment.status <> 'paused' then
      raise exception 'only paused cadence enrollments can be resumed';
    end if;
    update public.cadence_enrollments
    set status = 'active', paused_at = null, next_step_due_at = null
    where id = enrollment.id;
    perform private.schedule_cadence_task(enrollment.id, true);
  elsif target_status = 'paused' then
    if enrollment.status <> 'active' then
      raise exception 'only active cadence enrollments can be paused';
    end if;
    update public.cadence_enrollments
    set status = 'paused', paused_at = now(), next_step_due_at = null
    where id = enrollment.id;
    update public.tasks
    set status = 'cancelled'
    where cadence_enrollment_id = enrollment.id
      and status in ('pending', 'in_progress');
  else
    if enrollment.status not in ('active', 'paused') then
      raise exception 'only active or paused cadence enrollments can be removed';
    end if;
    update public.cadence_enrollments
    set status = 'removed', removed_at = now(), paused_at = null, next_step_due_at = null
    where id = enrollment.id;
    update public.tasks
    set status = 'cancelled'
    where cadence_enrollment_id = enrollment.id
      and status in ('pending', 'in_progress');
  end if;

  select * into enrollment from public.cadence_enrollments where id = enrollment.id;
  return enrollment;
end;
$$;

revoke all on function public.set_cadence_enrollment_status(uuid, text)
from public, anon;
grant execute on function public.set_cadence_enrollment_status(uuid, text)
to authenticated;

create or replace function public.save_cadence_configuration(
  target_organization_id uuid,
  target_cadence_id uuid,
  cadence_name text,
  cadence_description text,
  cadence_status text,
  steps jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_cadence_id uuid;
  step_count integer;
begin
  if not private.has_organization_role(
    target_organization_id,
    array['owner', 'admin', 'manager']
  ) then
    raise exception 'insufficient permissions to manage cadences';
  end if;
  if length(btrim(cadence_name)) = 0 then
    raise exception 'cadence name is required';
  end if;
  if cadence_status not in ('draft', 'active', 'paused', 'archived') then
    raise exception 'invalid cadence status';
  end if;
  if jsonb_typeof(steps) <> 'array' then
    raise exception 'cadence steps must be an array';
  end if;
  step_count := jsonb_array_length(steps);
  if step_count < 1 or step_count > 30 then
    raise exception 'cadence must have between 1 and 30 steps';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(steps) as step
    where coalesce((step ->> 'dayNumber')::integer, 0) not between 1 and 365
      or coalesce(step ->> 'type', '') not in (
        'call', 'whatsapp', 'email', 'meeting', 'follow_up', 'general'
      )
      or length(btrim(coalesce(step ->> 'title', ''))) = 0
  ) then
    raise exception 'invalid cadence step';
  end if;

  if target_cadence_id is null then
    insert into public.cadences (organization_id, name, description, status)
    values (
      target_organization_id,
      btrim(cadence_name),
      nullif(btrim(cadence_description), ''),
      cadence_status
    )
    returning id into saved_cadence_id;
  else
    if exists (
      select 1 from public.cadence_enrollments
      where organization_id = target_organization_id
        and cadence_id = target_cadence_id
        and status in ('active', 'paused')
    ) then
      raise exception 'cadence with active enrollments cannot have its steps edited';
    end if;
    update public.cadences
    set name = btrim(cadence_name),
        description = nullif(btrim(cadence_description), ''),
        status = cadence_status
    where organization_id = target_organization_id and id = target_cadence_id
    returning id into saved_cadence_id;
    if saved_cadence_id is null then
      raise exception 'cadence not found';
    end if;
    delete from public.cadence_steps
    where organization_id = target_organization_id and cadence_id = saved_cadence_id;
  end if;

  insert into public.cadence_steps (
    organization_id, cadence_id, position, day_number, type, title, description
  )
  select
    target_organization_id,
    saved_cadence_id,
    step.ordinality::integer,
    (step.value ->> 'dayNumber')::integer,
    step.value ->> 'type',
    btrim(step.value ->> 'title'),
    nullif(btrim(coalesce(step.value ->> 'description', '')), '')
  from jsonb_array_elements(steps) with ordinality as step(value, ordinality);

  return saved_cadence_id;
end;
$$;

revoke all on function public.save_cadence_configuration(
  uuid, uuid, text, text, text, jsonb
) from public, anon;
grant execute on function public.save_cadence_configuration(
  uuid, uuid, text, text, text, jsonb
) to authenticated;

alter table public.cadences enable row level security;
alter table public.cadences force row level security;
alter table public.cadence_steps enable row level security;
alter table public.cadence_steps force row level security;
alter table public.cadence_enrollments enable row level security;
alter table public.cadence_enrollments force row level security;

create policy cadences_select_member
on public.cadences for select to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales', 'viewer']
)));
create policy cadences_insert_manager
on public.cadences for insert to authenticated
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));
create policy cadences_update_manager
on public.cadences for update to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)))
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));
create policy cadences_delete_manager
on public.cadences for delete to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));

create policy cadence_steps_select_member
on public.cadence_steps for select to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales', 'viewer']
)));
create policy cadence_steps_insert_manager
on public.cadence_steps for insert to authenticated
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));
create policy cadence_steps_update_manager
on public.cadence_steps for update to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)))
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));
create policy cadence_steps_delete_manager
on public.cadence_steps for delete to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));

create policy cadence_enrollments_select_member
on public.cadence_enrollments for select to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales', 'viewer']
)));
create policy cadence_enrollments_insert_sales
on public.cadence_enrollments for insert to authenticated
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales']
)));
create policy cadence_enrollments_update_sales
on public.cadence_enrollments for update to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales']
)))
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales']
)));
create policy cadence_enrollments_delete_manager
on public.cadence_enrollments for delete to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));

revoke all on table public.cadences, public.cadence_steps, public.cadence_enrollments
from public, anon;
grant select, insert, update, delete on table
  public.cadences, public.cadence_steps, public.cadence_enrollments
to authenticated;
