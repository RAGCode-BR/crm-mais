-- BLOCO 6: consistent task lifecycle and indexes for follow-up views.

create or replace function private.set_task_lifecycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'completed' then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;

  return new;
end;
$$;

revoke all on function private.set_task_lifecycle()
  from public, anon, authenticated, service_role;

create trigger tasks_set_lifecycle
before insert or update of status, completed_at on public.tasks
for each row execute function private.set_task_lifecycle();

create index tasks_assigned_completed_idx
  on public.tasks (organization_id, assigned_member_id, completed_at desc)
  where status = 'completed' and assigned_member_id is not null;

