-- BLOCO 5: append-only centralized timeline and automatic business events.

create or replace function private.current_actor_member_id(target_organization_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from public.organization_members
  where organization_id = target_organization_id
    and profile_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

revoke all on function private.current_actor_member_id(uuid)
  from public, anon, authenticated, service_role;

create or replace function private.log_lead_created_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activities (
    organization_id, company_id, contact_id, lead_id, actor_member_id,
    type, subject, description, metadata
  ) values (
    new.organization_id,
    new.company_id,
    new.contact_id,
    new.id,
    private.current_actor_member_id(new.organization_id),
    'system',
    'Lead criado',
    'O lead ' || new.name || ' foi adicionado ao CRM.',
    jsonb_build_object('event', 'lead_created', 'automatic', true)
  );
  return new;
end;
$$;

revoke all on function private.log_lead_created_activity()
  from public, anon, authenticated, service_role;

create trigger leads_log_created_activity
after insert on public.leads
for each row execute function private.log_lead_created_activity();

create or replace function private.log_owner_assignment_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_owner_id uuid;
  new_owner_id uuid;
  related_company_id uuid;
  related_contact_id uuid;
  related_lead_id uuid;
  related_opportunity_id uuid;
begin
  if tg_table_name = 'tasks' then
    old_owner_id := nullif(to_jsonb(old) ->> 'assigned_member_id', '')::uuid;
    new_owner_id := nullif(to_jsonb(new) ->> 'assigned_member_id', '')::uuid;
  else
    old_owner_id := nullif(to_jsonb(old) ->> 'owner_member_id', '')::uuid;
    new_owner_id := nullif(to_jsonb(new) ->> 'owner_member_id', '')::uuid;
  end if;

  if new_owner_id is not distinct from old_owner_id then
    return new;
  end if;

  related_company_id := case
    when tg_table_name = 'companies' then new.id
    else nullif(to_jsonb(new) ->> 'company_id', '')::uuid
  end;
  related_contact_id := nullif(to_jsonb(new) ->> 'contact_id', '')::uuid;
  related_lead_id := case
    when tg_table_name = 'leads' then new.id
    else nullif(to_jsonb(new) ->> 'lead_id', '')::uuid
  end;
  related_opportunity_id := case
    when tg_table_name = 'opportunities' then new.id
    else nullif(to_jsonb(new) ->> 'opportunity_id', '')::uuid
  end;

  insert into public.activities (
    organization_id, company_id, contact_id, lead_id, opportunity_id,
    actor_member_id, type, subject, description, metadata
  ) values (
    new.organization_id,
    related_company_id,
    related_contact_id,
    related_lead_id,
    related_opportunity_id,
    private.current_actor_member_id(new.organization_id),
    'assignment_change',
    'Responsável alterado',
    'O responsável pelo registro foi atualizado.',
    jsonb_build_object(
      'event', 'assignment_changed',
      'automatic', true,
      'entity', tg_table_name,
      'from_member_id', old_owner_id,
      'to_member_id', new_owner_id
    )
  );
  return new;
end;
$$;

revoke all on function private.log_owner_assignment_activity()
  from public, anon, authenticated, service_role;

create trigger companies_log_owner_assignment
after update of owner_member_id on public.companies
for each row execute function private.log_owner_assignment_activity();

create trigger leads_log_owner_assignment
after update of owner_member_id on public.leads
for each row execute function private.log_owner_assignment_activity();

create trigger opportunities_log_owner_assignment
after update of owner_member_id on public.opportunities
for each row execute function private.log_owner_assignment_activity();

create trigger tasks_log_owner_assignment
after update of assigned_member_id on public.tasks
for each row execute function private.log_owner_assignment_activity();

create or replace function private.log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_name text;
  event_subject text;
begin
  if tg_op = 'INSERT' then
    event_name := 'task_created';
    event_subject := 'Tarefa criada: ' || new.title;
  elsif new.status = 'completed' and old.status is distinct from new.status then
    event_name := 'task_completed';
    event_subject := 'Tarefa concluída: ' || new.title;
  else
    return new;
  end if;

  insert into public.activities (
    organization_id, company_id, contact_id, lead_id, opportunity_id,
    actor_member_id, type, subject, description, metadata
  ) values (
    new.organization_id,
    new.company_id,
    new.contact_id,
    new.lead_id,
    new.opportunity_id,
    private.current_actor_member_id(new.organization_id),
    'task',
    event_subject,
    new.description,
    jsonb_build_object(
      'event', event_name,
      'automatic', true,
      'task_id', new.id,
      'task_type', new.type
    )
  );
  return new;
end;
$$;

revoke all on function private.log_task_activity()
  from public, anon, authenticated, service_role;

create trigger tasks_log_created_activity
after insert on public.tasks
for each row execute function private.log_task_activity();

create trigger tasks_log_completed_activity
after update of status on public.tasks
for each row execute function private.log_task_activity();

create or replace function private.log_opportunity_outcome_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_name text;
  event_subject text;
begin
  if new.status = old.status or new.status not in ('won', 'lost') then
    return new;
  end if;

  event_name := case when new.status = 'won' then 'opportunity_won' else 'opportunity_lost' end;
  event_subject := case when new.status = 'won' then 'Oportunidade ganha' else 'Oportunidade perdida' end;

  insert into public.activities (
    organization_id, company_id, contact_id, lead_id, opportunity_id,
    actor_member_id, type, subject, description, metadata
  ) values (
    new.organization_id,
    new.company_id,
    new.contact_id,
    new.lead_id,
    new.id,
    private.current_actor_member_id(new.organization_id),
    'system',
    event_subject,
    case when new.status = 'lost' then new.loss_reason else 'Oportunidade concluída com sucesso.' end,
    jsonb_build_object(
      'event', event_name,
      'automatic', true,
      'estimated_value', new.estimated_value,
      'loss_reason', new.loss_reason
    )
  );
  return new;
end;
$$;

revoke all on function private.log_opportunity_outcome_activity()
  from public, anon, authenticated, service_role;

create trigger opportunities_log_outcome_activity
after update of status on public.opportunities
for each row execute function private.log_opportunity_outcome_activity();

-- The timeline is a historical ledger. Entries are append-only for every role.
drop policy if exists activities_update_sales on public.activities;
drop policy if exists activities_delete_manager on public.activities;
revoke update, delete on table public.activities from authenticated;
