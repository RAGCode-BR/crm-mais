-- Block 10: configurable, explainable lead scoring.
create table public.lead_scoring_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  description text check (description is null or length(description) <= 500),
  rule_type text not null check (rule_type in (
    'lead_status',
    'lead_temperature',
    'company_industry',
    'company_employee_min',
    'activity_type_exists',
    'inactivity_days_min'
  )),
  condition_value text not null check (length(btrim(condition_value)) between 1 and 120),
  points smallint not null check (points between -100 and 100 and points <> 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint lead_scoring_rules_organization_id_id_key unique (organization_id, id),
  constraint lead_scoring_rules_numeric_condition_check check (
    rule_type not in ('company_employee_min', 'inactivity_days_min')
    or condition_value ~ '^[0-9]+$'
  ),
  constraint lead_scoring_rules_known_condition_check check (
    (rule_type <> 'lead_status' or condition_value in (
      'new', 'researching', 'contacted', 'qualified', 'unqualified', 'converted', 'archived'
    ))
    and (rule_type <> 'lead_temperature' or condition_value in ('cold', 'warm', 'hot'))
    and (rule_type <> 'activity_type_exists' or condition_value in (
      'call', 'whatsapp', 'email', 'meeting', 'note', 'stage_change',
      'assignment_change', 'proposal', 'task', 'system'
    ))
  )
);

create table public.lead_score_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id uuid not null,
  score smallint not null check (score between 0 and 100),
  classification text not null check (classification in ('cold', 'warm', 'hot', 'very_hot')),
  breakdown jsonb not null default '[]'::jsonb check (jsonb_typeof(breakdown) = 'array'),
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint lead_score_results_organization_id_id_key unique (organization_id, id),
  constraint lead_score_results_lead_key unique (organization_id, lead_id),
  constraint lead_score_results_lead_fkey
    foreign key (organization_id, lead_id)
    references public.leads (organization_id, id) on delete cascade
);

create index lead_scoring_rules_organization_active_idx
  on public.lead_scoring_rules (organization_id, is_active, updated_at desc);
create index lead_scoring_rules_created_by_idx
  on public.lead_scoring_rules (created_by) where created_by is not null;
create index lead_score_results_score_idx
  on public.lead_score_results (organization_id, score desc, calculated_at desc);
create index lead_score_results_created_by_idx
  on public.lead_score_results (created_by) where created_by is not null;

create trigger lead_scoring_rules_set_updated_at
before update on public.lead_scoring_rules
for each row execute function private.set_updated_at();
create trigger lead_score_results_set_updated_at
before update on public.lead_score_results
for each row execute function private.set_updated_at();
create trigger lead_scoring_rules_set_authenticated_creator
before insert on public.lead_scoring_rules
for each row execute function private.set_authenticated_creator();
create trigger lead_score_results_set_authenticated_creator
before insert on public.lead_score_results
for each row execute function private.set_authenticated_creator();
create trigger lead_scoring_rules_protect_tenant_identity
before update on public.lead_scoring_rules
for each row execute function private.protect_tenant_identity();
create trigger lead_score_results_protect_tenant_identity
before update on public.lead_score_results
for each row execute function private.protect_tenant_identity();

create or replace function private.recalculate_lead_score(target_lead_id uuid)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_lead public.leads;
  target_company public.companies;
  scoring_rule public.lead_scoring_rules;
  last_activity_at timestamptz;
  raw_score integer := 0;
  final_score smallint;
  matched boolean;
  reason text;
  score_breakdown jsonb := '[]'::jsonb;
begin
  select * into target_lead from public.leads where id = target_lead_id;
  if not found then return 0; end if;

  if target_lead.company_id is not null then
    select * into target_company
    from public.companies
    where organization_id = target_lead.organization_id and id = target_lead.company_id;
  end if;
  select max(occurred_at) into last_activity_at
  from public.activities
  where organization_id = target_lead.organization_id and lead_id = target_lead.id;

  for scoring_rule in
    select * from public.lead_scoring_rules
    where organization_id = target_lead.organization_id and is_active
    order by created_at, id
  loop
    matched := false;
    reason := null;
    case scoring_rule.rule_type
      when 'lead_status' then
        matched := target_lead.status = scoring_rule.condition_value;
        reason := 'Status do lead: ' || target_lead.status;
      when 'lead_temperature' then
        matched := target_lead.temperature = scoring_rule.condition_value;
        reason := 'Temperatura do lead: ' || target_lead.temperature;
      when 'company_industry' then
        matched := lower(coalesce(target_company.industry, '')) = lower(scoring_rule.condition_value);
        reason := 'Segmento da empresa: ' || coalesce(target_company.industry, 'não informado');
      when 'company_employee_min' then
        matched := coalesce(target_company.employee_count, 0) >= scoring_rule.condition_value::integer;
        reason := 'Quantidade de funcionários: ' || coalesce(target_company.employee_count::text, 'não informada');
      when 'activity_type_exists' then
        matched := exists (
          select 1 from public.activities
          where organization_id = target_lead.organization_id
            and lead_id = target_lead.id
            and type = scoring_rule.condition_value
        );
        reason := 'Atividade registrada: ' || scoring_rule.condition_value;
      when 'inactivity_days_min' then
        matched := coalesce(last_activity_at, target_lead.created_at)
          <= now() - make_interval(days => scoring_rule.condition_value::integer);
        reason := 'Sem atividade há pelo menos ' || scoring_rule.condition_value || ' dias';
      else
        matched := false;
    end case;
    if matched then
      raw_score := raw_score + scoring_rule.points;
      score_breakdown := score_breakdown || jsonb_build_array(jsonb_build_object(
        'ruleId', scoring_rule.id,
        'ruleName', scoring_rule.name,
        'points', scoring_rule.points,
        'reason', reason
      ));
    end if;
  end loop;

  final_score := greatest(0, least(100, raw_score))::smallint;
  insert into public.lead_score_results (
    organization_id, lead_id, score, classification, breakdown, calculated_at
  ) values (
    target_lead.organization_id,
    target_lead.id,
    final_score,
    case
      when final_score >= 80 then 'very_hot'
      when final_score >= 60 then 'hot'
      when final_score >= 40 then 'warm'
      else 'cold'
    end,
    score_breakdown,
    now()
  )
  on conflict (organization_id, lead_id) do update
  set score = excluded.score,
      classification = excluded.classification,
      breakdown = excluded.breakdown,
      calculated_at = excluded.calculated_at;

  update public.leads set score = final_score
  where id = target_lead.id and score is distinct from final_score;
  return final_score;
end;
$$;

revoke all on function private.recalculate_lead_score(uuid)
from public, anon, authenticated, service_role;

create or replace function public.recalculate_organization_lead_scores(
  target_organization_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_lead record;
  recalculated integer := 0;
begin
  if not private.has_organization_role(
    target_organization_id, array['owner', 'admin', 'manager', 'sales']
  ) then
    raise exception 'insufficient permissions to recalculate lead scores';
  end if;
  for target_lead in
    select id from public.leads
    where organization_id = target_organization_id and archived_at is null
  loop
    perform private.recalculate_lead_score(target_lead.id);
    recalculated := recalculated + 1;
  end loop;
  return recalculated;
end;
$$;

revoke all on function public.recalculate_organization_lead_scores(uuid)
from public, anon;
grant execute on function public.recalculate_organization_lead_scores(uuid)
to authenticated;

create or replace function public.get_lead_scoring_overview(
  target_organization_id uuid
)
returns table (
  lead_id uuid,
  lead_name text,
  company_name text,
  owner_name text,
  score smallint,
  classification text,
  breakdown jsonb,
  calculated_at timestamptz,
  last_activity_at timestamptz,
  next_contact_at timestamptz,
  has_open_follow_up boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    lead.id,
    lead.name,
    coalesce(company.trade_name, 'Sem empresa'),
    coalesce(profile.full_name, 'Sem responsável'),
    lead.score,
    coalesce(result.classification, case
      when lead.score >= 80 then 'very_hot'
      when lead.score >= 60 then 'hot'
      when lead.score >= 40 then 'warm'
      else 'cold'
    end),
    coalesce(result.breakdown, '[]'::jsonb),
    result.calculated_at,
    activity.last_activity_at,
    lead.next_contact_at,
    exists (
      select 1 from public.tasks as task
      where task.organization_id = lead.organization_id
        and task.lead_id = lead.id
        and task.status in ('pending', 'in_progress')
    )
  from public.leads as lead
  left join public.companies as company
    on company.organization_id = lead.organization_id and company.id = lead.company_id
  left join public.organization_members as member
    on member.organization_id = lead.organization_id and member.id = lead.owner_member_id
  left join public.profiles as profile on profile.id = member.profile_id
  left join public.lead_score_results as result
    on result.organization_id = lead.organization_id and result.lead_id = lead.id
  left join lateral (
    select max(item.occurred_at) as last_activity_at
    from public.activities as item
    where item.organization_id = lead.organization_id and item.lead_id = lead.id
  ) as activity on true
  where lead.organization_id = target_organization_id and lead.archived_at is null
  order by lead.score desc, lead.updated_at desc
  limit 500;
$$;

revoke all on function public.get_lead_scoring_overview(uuid)
from public, anon;
grant execute on function public.get_lead_scoring_overview(uuid)
to authenticated;

create or replace function private.refresh_lead_score()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.recalculate_lead_score(new.id);
  return new;
end;
$$;
revoke all on function private.refresh_lead_score()
from public, anon, authenticated, service_role;
create trigger leads_refresh_score
after insert or update of status, temperature, company_id on public.leads
for each row execute function private.refresh_lead_score();

create or replace function private.refresh_activity_lead_score()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op <> 'DELETE' and new.lead_id is not null then
    perform private.recalculate_lead_score(new.lead_id);
  end if;
  if tg_op <> 'INSERT' and old.lead_id is not null
    and (tg_op = 'DELETE' or old.lead_id is distinct from new.lead_id) then
    perform private.recalculate_lead_score(old.lead_id);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.refresh_activity_lead_score()
from public, anon, authenticated, service_role;
create trigger activities_refresh_lead_score
after insert or update or delete on public.activities
for each row execute function private.refresh_activity_lead_score();

create or replace function private.refresh_company_lead_scores()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_lead record;
begin
  for target_lead in select id from public.leads
    where organization_id = new.organization_id and company_id = new.id
  loop
    perform private.recalculate_lead_score(target_lead.id);
  end loop;
  return new;
end;
$$;
revoke all on function private.refresh_company_lead_scores()
from public, anon, authenticated, service_role;
create trigger companies_refresh_lead_scores
after update of industry, employee_count on public.companies
for each row execute function private.refresh_company_lead_scores();

create or replace function private.refresh_scoring_rule_leads()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_lead record;
declare target_organization_id uuid;
begin
  target_organization_id := case when tg_op = 'DELETE' then old.organization_id else new.organization_id end;
  for target_lead in select id from public.leads
    where organization_id = target_organization_id and archived_at is null
  loop
    perform private.recalculate_lead_score(target_lead.id);
  end loop;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.refresh_scoring_rule_leads()
from public, anon, authenticated, service_role;
create trigger lead_scoring_rules_refresh_scores
after insert or update or delete on public.lead_scoring_rules
for each row execute function private.refresh_scoring_rule_leads();

create or replace function private.create_default_scoring_rules()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.lead_scoring_rules (
    organization_id, name, description, rule_type, condition_value, points
  ) values
    (new.id, 'Lead quente', 'Temperatura comercial marcada como quente.', 'lead_temperature', 'hot', 20),
    (new.id, 'Empresa com 50+ funcionários', 'Empresa relacionada possui ao menos 50 funcionários.', 'company_employee_min', '50', 15),
    (new.id, 'Contato por WhatsApp', 'Existe uma atividade do tipo WhatsApp.', 'activity_type_exists', 'whatsapp', 15),
    (new.id, 'Reunião realizada', 'Existe uma atividade do tipo reunião.', 'activity_type_exists', 'meeting', 30),
    (new.id, 'Sem atividade há 15 dias', 'Reduz prioridade por inatividade.', 'inactivity_days_min', '15', -15),
    (new.id, 'Sem atividade há 30 dias', 'Reduz ainda mais a prioridade por inatividade.', 'inactivity_days_min', '30', -30);
  return new;
end;
$$;
revoke all on function private.create_default_scoring_rules()
from public, anon, authenticated, service_role;
create trigger organizations_create_default_scoring_rules
after insert on public.organizations
for each row execute function private.create_default_scoring_rules();

insert into public.lead_scoring_rules (
  organization_id, name, description, rule_type, condition_value, points
)
select organization.id, defaults.name, defaults.description, defaults.rule_type, defaults.condition_value, defaults.points
from public.organizations as organization
cross join (values
  ('Lead quente', 'Temperatura comercial marcada como quente.', 'lead_temperature', 'hot', 20),
  ('Empresa com 50+ funcionários', 'Empresa relacionada possui ao menos 50 funcionários.', 'company_employee_min', '50', 15),
  ('Contato por WhatsApp', 'Existe uma atividade do tipo WhatsApp.', 'activity_type_exists', 'whatsapp', 15),
  ('Reunião realizada', 'Existe uma atividade do tipo reunião.', 'activity_type_exists', 'meeting', 30),
  ('Sem atividade há 15 dias', 'Reduz prioridade por inatividade.', 'inactivity_days_min', '15', -15),
  ('Sem atividade há 30 dias', 'Reduz ainda mais a prioridade por inatividade.', 'inactivity_days_min', '30', -30)
) as defaults(name, description, rule_type, condition_value, points);

alter table public.lead_scoring_rules enable row level security;
alter table public.lead_scoring_rules force row level security;
alter table public.lead_score_results enable row level security;
alter table public.lead_score_results force row level security;

create policy lead_scoring_rules_select_member on public.lead_scoring_rules
for select to authenticated using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales', 'viewer']
)));
create policy lead_scoring_rules_insert_manager on public.lead_scoring_rules
for insert to authenticated with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));
create policy lead_scoring_rules_update_manager on public.lead_scoring_rules
for update to authenticated using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
))) with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));
create policy lead_scoring_rules_delete_manager on public.lead_scoring_rules
for delete to authenticated using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));
create policy lead_score_results_select_member on public.lead_score_results
for select to authenticated using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales', 'viewer']
)));

revoke all on public.lead_scoring_rules, public.lead_score_results
from anon, authenticated;
grant select, insert, update, delete on public.lead_scoring_rules to authenticated;
grant select on public.lead_score_results to authenticated;
