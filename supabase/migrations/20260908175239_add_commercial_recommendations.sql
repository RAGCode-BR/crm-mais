-- Block 11: rule-based commercial alerts and next-best-action recommendations.
create table public.commercial_recommendation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null check (code in (
    'follow_up_due',
    'forgotten_lead',
    'reactivate_lead',
    'high_score_no_task',
    'stalled_opportunity',
    'closing_soon',
    'overdue_follow_up'
  )),
  name text not null check (length(btrim(name)) between 1 and 120),
  description text check (description is null or length(description) <= 500),
  threshold_days integer check (threshold_days is null or threshold_days between 0 and 3650),
  minimum_score smallint check (minimum_score is null or minimum_score between 0 and 100),
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint commercial_recommendation_rules_organization_id_id_key
    unique (organization_id, id),
  constraint commercial_recommendation_rules_code_key unique (organization_id, code),
  constraint commercial_recommendation_rules_parameters_check check (
    (code = 'high_score_no_task' and minimum_score is not null and threshold_days is null)
    or (code <> 'high_score_no_task' and minimum_score is null and threshold_days is not null)
  )
);

create index commercial_recommendation_rules_active_idx
  on public.commercial_recommendation_rules (organization_id, is_active, priority);
create index commercial_recommendation_rules_created_by_idx
  on public.commercial_recommendation_rules (created_by) where created_by is not null;

create trigger commercial_recommendation_rules_set_updated_at
before update on public.commercial_recommendation_rules
for each row execute function private.set_updated_at();
create trigger commercial_recommendation_rules_set_authenticated_creator
before insert on public.commercial_recommendation_rules
for each row execute function private.set_authenticated_creator();
create trigger commercial_recommendation_rules_protect_tenant_identity
before update on public.commercial_recommendation_rules
for each row execute function private.protect_tenant_identity();

create or replace function private.create_default_recommendation_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.commercial_recommendation_rules (
    organization_id, code, name, description, threshold_days, minimum_score, priority
  ) values
    (new.id, 'follow_up_due', 'Entrar em contato hoje', 'Próximo contato do lead chegou e ainda não foi atualizado.', 0, null, 'urgent'),
    (new.id, 'overdue_follow_up', 'Follow-up atrasado', 'Tarefa comercial venceu e continua aberta.', 0, null, 'urgent'),
    (new.id, 'high_score_no_task', 'Lead quente sem acompanhamento', 'Lead de score alto não possui tarefa aberta.', null, 60, 'high'),
    (new.id, 'stalled_opportunity', 'Oportunidade parada', 'Negociação aberta está há muitos dias sem mudança de etapa.', 12, null, 'high'),
    (new.id, 'closing_soon', 'Fechamento próximo', 'Oportunidade possui previsão de fechamento próxima.', 7, null, 'high'),
    (new.id, 'forgotten_lead', 'Lead sem atividade', 'Lead não recebe contato comercial há vários dias.', 30, null, 'medium'),
    (new.id, 'reactivate_lead', 'Reativar lead', 'Lead não recebe contato comercial há um período prolongado.', 90, null, 'medium');
  return new;
end;
$$;

revoke all on function private.create_default_recommendation_rules()
from public, anon, authenticated, service_role;
create trigger organizations_create_default_recommendation_rules
after insert on public.organizations
for each row execute function private.create_default_recommendation_rules();

insert into public.commercial_recommendation_rules (
  organization_id, code, name, description, threshold_days, minimum_score, priority
)
select organization.id, defaults.code, defaults.name, defaults.description,
  defaults.threshold_days, defaults.minimum_score, defaults.priority
from public.organizations as organization
cross join (values
  ('follow_up_due', 'Entrar em contato hoje', 'Próximo contato do lead chegou e ainda não foi atualizado.', 0, null::integer, 'urgent'),
  ('overdue_follow_up', 'Follow-up atrasado', 'Tarefa comercial venceu e continua aberta.', 0, null::integer, 'urgent'),
  ('high_score_no_task', 'Lead quente sem acompanhamento', 'Lead de score alto não possui tarefa aberta.', null::integer, 60, 'high'),
  ('stalled_opportunity', 'Oportunidade parada', 'Negociação aberta está há muitos dias sem mudança de etapa.', 12, null::integer, 'high'),
  ('closing_soon', 'Fechamento próximo', 'Oportunidade possui previsão de fechamento próxima.', 7, null::integer, 'high'),
  ('forgotten_lead', 'Lead sem atividade', 'Lead não recebe contato comercial há vários dias.', 30, null::integer, 'medium'),
  ('reactivate_lead', 'Reativar lead', 'Lead não recebe contato comercial há um período prolongado.', 90, null::integer, 'medium')
) as defaults(code, name, description, threshold_days, minimum_score, priority);

create or replace function public.get_commercial_recommendations(
  target_organization_id uuid
)
returns table (
  recommendation_id text,
  rule_code text,
  category text,
  priority text,
  title text,
  reason text,
  action_label text,
  action_path text,
  entity_type text,
  entity_id uuid,
  owner_member_id uuid,
  score integer,
  reference_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with active_rules as (
    select * from public.commercial_recommendation_rules
    where organization_id = target_organization_id and is_active
  ),
  lead_context as (
    select
      lead.*,
      contact.last_contact_at,
      exists (
        select 1 from public.tasks as open_task
        where open_task.organization_id = lead.organization_id
          and open_task.lead_id = lead.id
          and open_task.status in ('pending', 'in_progress')
      ) as has_open_task
    from public.leads as lead
    left join lateral (
      select max(activity.occurred_at) as last_contact_at
      from public.activities as activity
      where activity.organization_id = lead.organization_id
        and activity.lead_id = lead.id
        and activity.type in ('call', 'whatsapp', 'email', 'meeting', 'proposal')
    ) as contact on true
    where lead.organization_id = target_organization_id
      and lead.archived_at is null
      and lead.status not in ('converted', 'unqualified')
  ),
  opportunity_context as (
    select
      opportunity.*,
      coalesce(stage_event.changed_at, opportunity.created_at) as stage_changed_at
    from public.opportunities as opportunity
    left join lateral (
      select max(activity.occurred_at) as changed_at
      from public.activities as activity
      where activity.organization_id = opportunity.organization_id
        and activity.opportunity_id = opportunity.id
        and activity.type = 'stage_change'
    ) as stage_event on true
    where opportunity.organization_id = target_organization_id and opportunity.status = 'open'
  ),
  recommendations as (
    select
      rule.code || ':' || lead.id::text as recommendation_id,
      rule.code as rule_code,
      'lead'::text as category,
      rule.priority,
      rule.name as title,
      'Próximo contato previsto para ' || to_char(lead.next_contact_at at time zone 'UTC', 'DD/MM/YYYY HH24:MI') || '.' as reason,
      'Abrir lead'::text as action_label,
      '/leads/' || lead.id::text as action_path,
      'lead'::text as entity_type,
      lead.id as entity_id,
      lead.owner_member_id,
      lead.score::integer,
      lead.next_contact_at as reference_at
    from lead_context as lead
    join active_rules as rule on rule.code = 'follow_up_due'
    where lead.next_contact_at <= now()

    union all
    select rule.code || ':' || task.id::text, rule.code, 'task', rule.priority,
      rule.name, 'A tarefa venceu em ' || to_char(task.due_at at time zone 'UTC', 'DD/MM/YYYY HH24:MI') || '.',
      'Abrir tarefa', '/tarefas/' || task.id::text, 'task', task.id,
      task.assigned_member_id, null::integer, task.due_at
    from public.tasks as task
    join active_rules as rule on rule.code = 'overdue_follow_up'
    where task.organization_id = target_organization_id
      and task.status in ('pending', 'in_progress') and task.due_at < now()

    union all
    select rule.code || ':' || lead.id::text, rule.code, 'lead', rule.priority,
      rule.name, 'Score ' || lead.score || ' sem tarefa pendente ou em andamento.',
      'Criar follow-up', '/tarefas/nova?lead=' || lead.id::text, 'lead', lead.id,
      lead.owner_member_id, lead.score::integer, null::timestamptz
    from lead_context as lead
    join active_rules as rule on rule.code = 'high_score_no_task'
    where lead.score >= rule.minimum_score and not lead.has_open_task

    union all
    select rule.code || ':' || opportunity.id::text, rule.code, 'opportunity', rule.priority,
      rule.name, 'Sem mudança de etapa há ' || floor(extract(epoch from (now() - opportunity.stage_changed_at)) / 86400)::integer || ' dias.',
      'Abrir oportunidade', '/oportunidades/' || opportunity.id::text, 'opportunity', opportunity.id,
      opportunity.owner_member_id, null::integer, opportunity.stage_changed_at
    from opportunity_context as opportunity
    join active_rules as rule on rule.code = 'stalled_opportunity'
    where opportunity.stage_changed_at <= now() - make_interval(days => rule.threshold_days)

    union all
    select rule.code || ':' || opportunity.id::text, rule.code, 'opportunity', rule.priority,
      rule.name, 'Fechamento previsto para ' || to_char(opportunity.expected_close_date, 'DD/MM/YYYY') || '.',
      'Revisar negociação', '/oportunidades/' || opportunity.id::text, 'opportunity', opportunity.id,
      opportunity.owner_member_id, null::integer, opportunity.expected_close_date::timestamptz
    from opportunity_context as opportunity
    join active_rules as rule on rule.code = 'closing_soon'
    where opportunity.expected_close_date between current_date and current_date + rule.threshold_days

    union all
    select rule.code || ':' || lead.id::text, rule.code, 'lead', rule.priority,
      rule.name, 'Sem contato comercial há ' || floor(extract(epoch from (now() - coalesce(lead.last_contact_at, lead.created_at))) / 86400)::integer || ' dias.',
      'Revisar lead', '/leads/' || lead.id::text, 'lead', lead.id,
      lead.owner_member_id, lead.score::integer, coalesce(lead.last_contact_at, lead.created_at)
    from lead_context as lead
    join active_rules as rule on rule.code = 'forgotten_lead'
    left join active_rules as reactivation on reactivation.code = 'reactivate_lead'
    where coalesce(lead.last_contact_at, lead.created_at) <= now() - make_interval(days => rule.threshold_days)
      and (reactivation.id is null or coalesce(lead.last_contact_at, lead.created_at) > now() - make_interval(days => reactivation.threshold_days))

    union all
    select rule.code || ':' || lead.id::text, rule.code, 'lead', rule.priority,
      rule.name, 'Último contato comercial há ' || floor(extract(epoch from (now() - coalesce(lead.last_contact_at, lead.created_at))) / 86400)::integer || ' dias.',
      'Reativar lead', '/leads/' || lead.id::text, 'lead', lead.id,
      lead.owner_member_id, lead.score::integer, coalesce(lead.last_contact_at, lead.created_at)
    from lead_context as lead
    join active_rules as rule on rule.code = 'reactivate_lead'
    where coalesce(lead.last_contact_at, lead.created_at) <= now() - make_interval(days => rule.threshold_days)
  )
  select * from recommendations
  order by case priority when 'urgent' then 1 when 'high' then 2 when 'medium' then 3 else 4 end,
    reference_at nulls last, title
  limit 200;
$$;

revoke all on function public.get_commercial_recommendations(uuid)
from public, anon;
grant execute on function public.get_commercial_recommendations(uuid)
to authenticated;

alter table public.commercial_recommendation_rules enable row level security;
alter table public.commercial_recommendation_rules force row level security;

create policy commercial_recommendation_rules_select_member
on public.commercial_recommendation_rules for select to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales', 'viewer']
)));
create policy commercial_recommendation_rules_insert_manager
on public.commercial_recommendation_rules for insert to authenticated
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));
create policy commercial_recommendation_rules_update_manager
on public.commercial_recommendation_rules for update to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
))) with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));
create policy commercial_recommendation_rules_delete_manager
on public.commercial_recommendation_rules for delete to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));

revoke all on public.commercial_recommendation_rules from anon, authenticated;
grant select, insert, update, delete on public.commercial_recommendation_rules to authenticated;
