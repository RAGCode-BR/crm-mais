-- Block 15: notification center, preferences and event-driven generation.

alter table public.notifications add column dedupe_key text;
create unique index notifications_dedupe_key_idx
on public.notifications (organization_id, recipient_member_id, dedupe_key)
where dedupe_key is not null;

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  member_id uuid not null,
  type text not null check (type in (
    'task_due', 'task_overdue', 'lead_assigned', 'opportunity_changed',
    'opportunity_stalled', 'meeting', 'hot_lead', 'mention', 'system'
  )),
  in_app_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint notification_preferences_member_fkey
    foreign key (organization_id, member_id)
    references public.organization_members (organization_id, id) on delete cascade,
  constraint notification_preferences_member_type_key
    unique (organization_id, member_id, type)
);

create index notification_preferences_member_idx
on public.notification_preferences (organization_id, member_id);
create index notification_preferences_created_by_idx
on public.notification_preferences (created_by)
where created_by is not null;

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function private.set_updated_at();
create trigger notification_preferences_set_authenticated_creator
before insert on public.notification_preferences
for each row execute function private.set_authenticated_creator();
create trigger notification_preferences_protect_tenant_identity
before update on public.notification_preferences
for each row execute function private.protect_tenant_identity();

alter table public.notification_preferences enable row level security;
alter table public.notification_preferences force row level security;

create policy notification_preferences_select_own
on public.notification_preferences for select to authenticated
using ((select private.is_current_organization_member(organization_id, member_id)));

create policy notification_preferences_insert_own
on public.notification_preferences for insert to authenticated
with check ((select private.is_current_organization_member(organization_id, member_id)));

create policy notification_preferences_update_own
on public.notification_preferences for update to authenticated
using ((select private.is_current_organization_member(organization_id, member_id)))
with check ((select private.is_current_organization_member(organization_id, member_id)));

revoke all on public.notification_preferences from public, anon, authenticated;
grant select, insert on public.notification_preferences to authenticated;
grant update (in_app_enabled) on public.notification_preferences to authenticated;

create or replace function private.notification_is_enabled(
  target_organization_id uuid,
  target_member_id uuid,
  notification_type text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((
    select preference.in_app_enabled
    from public.notification_preferences as preference
    where preference.organization_id = target_organization_id
      and preference.member_id = target_member_id
      and preference.type = notification_type
  ), true);
$$;

revoke all on function private.notification_is_enabled(uuid, uuid, text)
from public, anon, authenticated, service_role;

create or replace function private.create_notification(
  target_organization_id uuid,
  target_member_id uuid,
  notification_type text,
  notification_title text,
  notification_body text,
  entity_type text,
  entity_id uuid,
  notification_dedupe_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if target_member_id is null
    or not private.notification_is_enabled(
      target_organization_id, target_member_id, notification_type
    ) then
    return false;
  end if;

  insert into public.notifications (
    organization_id, recipient_member_id, type, title, body,
    related_entity_type, related_entity_id, dedupe_key
  ) values (
    target_organization_id, target_member_id, notification_type,
    notification_title, notification_body, entity_type, entity_id,
    notification_dedupe_key
  )
  on conflict (organization_id, recipient_member_id, dedupe_key)
  where dedupe_key is not null do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count > 0;
end;
$$;

revoke all on function private.create_notification(
  uuid, uuid, text, text, text, text, uuid, text
) from public, anon, authenticated, service_role;

create or replace function private.notify_lead_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_member_id is not null
    and (tg_op = 'INSERT' or new.owner_member_id is distinct from old.owner_member_id) then
    perform private.create_notification(
      new.organization_id, new.owner_member_id, 'lead_assigned',
      'Lead atribuído a você', new.name, 'lead', new.id,
      'lead-assigned:' || new.id::text || ':' || new.owner_member_id::text
    );
  end if;
  return new;
end;
$$;
revoke all on function private.notify_lead_assignment()
from public, anon, authenticated, service_role;
create trigger leads_create_assignment_notification
after insert or update of owner_member_id on public.leads
for each row execute function private.notify_lead_assignment();

create or replace function private.notify_hot_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_member_id is not null and new.score >= 60 and old.score < 60 then
    perform private.create_notification(
      new.organization_id, new.owner_member_id, 'hot_lead',
      'Lead quente requer atenção',
      new.name || ' atingiu score ' || new.score::text || '.',
      'lead', new.id, 'hot-lead:' || new.id::text || ':' || new.score::text
    );
  end if;
  return new;
end;
$$;
revoke all on function private.notify_hot_lead()
from public, anon, authenticated, service_role;
create trigger leads_create_hot_notification
after update of score on public.leads
for each row execute function private.notify_hot_lead();

create or replace function private.notify_opportunity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_member_id is not null then
    perform private.create_notification(
      new.organization_id, new.owner_member_id, 'opportunity_changed',
      'Oportunidade alterada', new.title,
      'opportunity', new.id,
      'opportunity-changed:' || new.id::text || ':' || extract(epoch from new.updated_at)::bigint::text
    );
  end if;
  return new;
end;
$$;
revoke all on function private.notify_opportunity_change()
from public, anon, authenticated, service_role;
create trigger opportunities_create_change_notification
after update of stage_id, status, estimated_value, probability, expected_close_date
on public.opportunities
for each row execute function private.notify_opportunity_change();

create or replace function private.notify_meeting()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_member_id uuid;
begin
  if new.type <> 'meeting' then return new; end if;

  select coalesce(opportunity.owner_member_id, lead.owner_member_id, company.owner_member_id)
  into target_member_id
  from (select 1) as singleton
  left join public.opportunities as opportunity
    on opportunity.organization_id = new.organization_id and opportunity.id = new.opportunity_id
  left join public.leads as lead
    on lead.organization_id = new.organization_id and lead.id = new.lead_id
  left join public.companies as company
    on company.organization_id = new.organization_id and company.id = new.company_id;

  if target_member_id is not null then
    perform private.create_notification(
      new.organization_id, target_member_id, 'meeting',
      'Reunião registrada', new.subject,
      coalesce(
        case when new.opportunity_id is not null then 'opportunity' end,
        case when new.lead_id is not null then 'lead' end,
        'company'
      ),
      coalesce(new.opportunity_id, new.lead_id, new.company_id),
      'meeting:' || new.id::text
    );
  end if;
  return new;
end;
$$;
revoke all on function private.notify_meeting()
from public, anon, authenticated, service_role;
create trigger activities_create_meeting_notification
after insert on public.activities
for each row execute function private.notify_meeting();

create or replace function private.refresh_member_notifications(
  target_organization_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid;
  created_count integer := 0;
  item record;
begin
  select member.id into current_member_id
  from public.organization_members as member
  where member.organization_id = target_organization_id
    and member.profile_id = (select auth.uid())
    and member.status = 'active';

  if current_member_id is null then
    raise exception 'insufficient permissions to refresh notifications';
  end if;

  for item in
    select task.id, task.title, task.due_at,
      case when task.type = 'meeting' then 'meeting'
        when task.due_at < now() then 'task_overdue' else 'task_due' end as notification_type
    from public.tasks as task
    where task.organization_id = target_organization_id
      and task.assigned_member_id = current_member_id
      and task.status in ('pending', 'in_progress')
      and task.due_at <= now() + interval '24 hours'
  loop
    if private.create_notification(
      target_organization_id, current_member_id, item.notification_type,
      case item.notification_type
        when 'meeting' then 'Reunião próxima'
        when 'task_overdue' then 'Tarefa atrasada'
        else 'Tarefa próxima' end,
      item.title || ' · ' || to_char(item.due_at at time zone 'UTC', 'DD/MM/YYYY HH24:MI'),
      'task', item.id,
      item.notification_type || ':' || item.id::text
    ) then created_count := created_count + 1; end if;
  end loop;

  for item in
    select opportunity.id, opportunity.title, opportunity.stage_id,
      coalesce(stage_change.changed_at, opportunity.created_at) as last_change
    from public.opportunities as opportunity
    left join lateral (
      select max(activity.occurred_at) as changed_at
      from public.activities as activity
      where activity.organization_id = opportunity.organization_id
        and activity.opportunity_id = opportunity.id
        and activity.type = 'stage_change'
    ) as stage_change on true
    where opportunity.organization_id = target_organization_id
      and opportunity.owner_member_id = current_member_id
      and opportunity.status = 'open'
      and coalesce(stage_change.changed_at, opportunity.created_at) <= now() - interval '12 days'
  loop
    if private.create_notification(
      target_organization_id, current_member_id, 'opportunity_stalled',
      'Oportunidade parada',
      item.title || ' está sem mudança de etapa há mais de 12 dias.',
      'opportunity', item.id,
      'opportunity-stalled:' || item.id::text || ':' || item.stage_id::text
    ) then created_count := created_count + 1; end if;
  end loop;

  return created_count;
end;
$$;

revoke all on function private.refresh_member_notifications(uuid)
from public, anon, authenticated, service_role;
grant execute on function private.refresh_member_notifications(uuid) to authenticated;

create or replace function public.refresh_my_notifications(
  target_organization_id uuid
)
returns integer
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.refresh_member_notifications(target_organization_id);
$$;
revoke all on function public.refresh_my_notifications(uuid)
from public, anon, service_role;
grant execute on function public.refresh_my_notifications(uuid) to authenticated;
