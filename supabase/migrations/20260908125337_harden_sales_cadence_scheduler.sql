-- Keep the cadence scheduler internal: only trusted trigger/RPC entry points may invoke it.
revoke execute on function private.schedule_cadence_task(uuid, boolean)
from authenticated;

alter function private.start_cadence_enrollment() security definer;
alter function private.advance_cadence_after_task() security definer;

create or replace function public.set_cadence_enrollment_status(
  target_enrollment_id uuid,
  target_status text
)
returns public.cadence_enrollments
language plpgsql
security definer
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
  if not private.has_organization_role(
    enrollment.organization_id,
    array['owner', 'admin', 'manager', 'sales']
  ) then
    raise exception 'insufficient permissions to manage cadence enrollment';
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

  select * into enrollment
  from public.cadence_enrollments as refreshed
  where refreshed.id = target_enrollment_id;
  return enrollment;
end;
$$;

revoke all on function public.set_cadence_enrollment_status(uuid, text)
from public, anon;
grant execute on function public.set_cadence_enrollment_status(uuid, text)
to authenticated;
