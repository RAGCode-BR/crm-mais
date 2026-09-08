-- BLOCO 7: commercial dashboard aggregates with tenant-aware RLS.

create index opportunities_closed_outcome_idx
  on public.opportunities (organization_id, status, closed_at desc)
  where status in ('won', 'lost');

create index companies_organization_industry_idx
  on public.companies (organization_id, industry)
  where industry is not null;

create index opportunities_organization_product_idx
  on public.opportunities (organization_id, product_service)
  where product_service is not null;

create or replace function public.get_commercial_dashboard(
  target_organization_id uuid,
  period_start timestamptz,
  period_end timestamptz,
  target_owner_member_id uuid default null,
  target_team_id uuid default null,
  target_lead_source_id uuid default null,
  target_industry text default null,
  target_product_service text default null,
  target_pipeline_id uuid default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with
  valid_period as (
    select period_start as starts_at, period_end as ends_at
    where period_end >= period_start
      and period_end <= period_start + interval '366 days'
  ),
  filtered_leads as (
    select l.id, l.status, l.created_at, l.lead_source_id
    from valid_period bounds
    join public.leads l on true
    left join public.companies c
      on c.organization_id = l.organization_id and c.id = l.company_id
    left join public.organization_members member
      on member.organization_id = l.organization_id and member.id = l.owner_member_id
    where l.organization_id = target_organization_id
      and l.created_at >= period_start
      and l.created_at <= period_end
      and (target_owner_member_id is null or l.owner_member_id = target_owner_member_id)
      and (target_team_id is null or member.team_id = target_team_id)
      and (target_lead_source_id is null or l.lead_source_id = target_lead_source_id)
      and (target_industry is null or c.industry = target_industry)
  ),
  filtered_opportunities as (
    select
      o.id, o.status, o.estimated_value, o.probability, o.created_at,
      o.closed_at, o.loss_reason, o.stage_id, o.owner_member_id
    from valid_period bounds
    join public.opportunities o on true
    join public.companies c
      on c.organization_id = o.organization_id and c.id = o.company_id
    left join public.organization_members member
      on member.organization_id = o.organization_id and member.id = o.owner_member_id
    where o.organization_id = target_organization_id
      and (target_owner_member_id is null or o.owner_member_id = target_owner_member_id)
      and (target_team_id is null or member.team_id = target_team_id)
      and (target_lead_source_id is null or o.lead_source_id = target_lead_source_id)
      and (target_industry is null or c.industry = target_industry)
      and (target_product_service is null or o.product_service = target_product_service)
      and (target_pipeline_id is null or o.pipeline_id = target_pipeline_id)
  ),
  filtered_activities as (
    select a.id, a.type, a.occurred_at
    from valid_period bounds
    join public.activities a on true
    left join public.opportunities o
      on o.organization_id = a.organization_id and o.id = a.opportunity_id
    left join public.leads l
      on l.organization_id = a.organization_id and l.id = a.lead_id
    left join public.companies c
      on c.organization_id = a.organization_id
      and c.id = coalesce(a.company_id, o.company_id, l.company_id)
    left join public.organization_members member
      on member.organization_id = a.organization_id and member.id = a.actor_member_id
    where a.organization_id = target_organization_id
      and a.occurred_at >= period_start
      and a.occurred_at <= period_end
      and (target_owner_member_id is null or a.actor_member_id = target_owner_member_id)
      and (target_team_id is null or member.team_id = target_team_id)
      and (
        target_lead_source_id is null
        or coalesce(o.lead_source_id, l.lead_source_id, c.lead_source_id) = target_lead_source_id
      )
      and (target_industry is null or c.industry = target_industry)
      and (target_product_service is null or o.product_service = target_product_service)
      and (target_pipeline_id is null or o.pipeline_id = target_pipeline_id)
  ),
  filtered_tasks as (
    select t.id
    from valid_period bounds
    join public.tasks t on true
    left join public.opportunities o
      on o.organization_id = t.organization_id and o.id = t.opportunity_id
    left join public.leads l
      on l.organization_id = t.organization_id and l.id = t.lead_id
    left join public.companies c
      on c.organization_id = t.organization_id
      and c.id = coalesce(t.company_id, o.company_id, l.company_id)
    left join public.organization_members member
      on member.organization_id = t.organization_id and member.id = t.assigned_member_id
    where t.organization_id = target_organization_id
      and t.status in ('pending', 'in_progress')
      and t.due_at < now()
      and (target_owner_member_id is null or t.assigned_member_id = target_owner_member_id)
      and (target_team_id is null or member.team_id = target_team_id)
      and (
        target_lead_source_id is null
        or coalesce(o.lead_source_id, l.lead_source_id, c.lead_source_id) = target_lead_source_id
      )
      and (target_industry is null or c.industry = target_industry)
      and (target_product_service is null or o.product_service = target_product_service)
      and (target_pipeline_id is null or o.pipeline_id = target_pipeline_id)
  ),
  lead_evolution as (
    select
      to_char(day_bucket, 'YYYY-MM-DD') as label,
      count(fl.id)::int as value
    from valid_period bounds
    cross join lateral generate_series(
      date_trunc('day', bounds.starts_at),
      date_trunc('day', bounds.ends_at),
      interval '1 day'
    ) day_bucket
    left join filtered_leads fl
      on fl.created_at >= day_bucket and fl.created_at < day_bucket + interval '1 day'
    group by day_bucket
    order by day_bucket
  ),
  opportunities_by_stage as (
    select ps.name as label, count(fo.id)::int as value, ps.position
    from filtered_opportunities fo
    join public.pipeline_stages ps on ps.id = fo.stage_id
    where fo.status in ('open', 'no_response', 'reactivate_later')
    group by ps.id, ps.name, ps.position
    order by ps.position
  ),
  sales_evolution as (
    select
      to_char(day_bucket, 'YYYY-MM-DD') as label,
      coalesce(sum(fo.estimated_value), 0)::numeric as value
    from valid_period bounds
    cross join lateral generate_series(
      date_trunc('day', bounds.starts_at),
      date_trunc('day', bounds.ends_at),
      interval '1 day'
    ) day_bucket
    left join filtered_opportunities fo
      on fo.status = 'won'
      and fo.closed_at >= day_bucket
      and fo.closed_at < day_bucket + interval '1 day'
    group by day_bucket
    order by day_bucket
  ),
  leads_by_source as (
    select coalesce(ls.name, 'Sem origem') as label, count(fl.id)::int as value
    from filtered_leads fl
    left join public.lead_sources ls on ls.id = fl.lead_source_id
    group by ls.id, ls.name
    order by value desc, label
    limit 8
  ),
  loss_reasons as (
    select coalesce(nullif(btrim(fo.loss_reason), ''), 'Não informado') as label,
      count(*)::int as value
    from filtered_opportunities fo
    where fo.status = 'lost'
      and fo.closed_at >= period_start
      and fo.closed_at <= period_end
    group by coalesce(nullif(btrim(fo.loss_reason), ''), 'Não informado')
    order by value desc, label
    limit 8
  ),
  outcomes as (
    select
      count(*) filter (
        where status = 'won' and closed_at >= period_start and closed_at <= period_end
      )::int as won,
      count(*) filter (
        where status = 'lost' and closed_at >= period_start and closed_at <= period_end
      )::int as lost,
      coalesce(avg(estimated_value) filter (
        where status = 'won' and closed_at >= period_start and closed_at <= period_end
      ), 0)::numeric as average_ticket
    from filtered_opportunities
  )
  select jsonb_build_object(
    'metrics', jsonb_build_object(
      'newLeads', (select count(*)::int from filtered_leads),
      'qualifiedLeads', (select count(*)::int from filtered_leads where status = 'qualified'),
      'meetings', (select count(*)::int from filtered_activities where type = 'meeting'),
      'proposals', (select count(*)::int from filtered_activities where type = 'proposal'),
      'negotiations', (
        select count(*)::int
        from filtered_opportunities fo
        join public.pipeline_stages ps on ps.id = fo.stage_id
        where fo.status in ('open', 'no_response', 'reactivate_later')
          and lower(ps.name) like '%negocia%'
      ),
      'won', outcomes.won,
      'lost', outcomes.lost,
      'conversionRate', case
        when outcomes.won + outcomes.lost = 0 then 0
        else round((outcomes.won::numeric / (outcomes.won + outcomes.lost)) * 100, 2)
      end,
      'averageTicket', round(outcomes.average_ticket, 2),
      'pipelineValue', (
        select coalesce(sum(estimated_value), 0)::numeric
        from filtered_opportunities
        where status in ('open', 'no_response', 'reactivate_later')
      ),
      'salesForecast', (
        select coalesce(sum(estimated_value * probability / 100.0), 0)::numeric
        from filtered_opportunities
        where status in ('open', 'no_response', 'reactivate_later')
      ),
      'overdueTasks', (select count(*)::int from filtered_tasks)
    ),
    'leadEvolution', (select coalesce(jsonb_agg(to_jsonb(lead_evolution)), '[]') from lead_evolution),
    'opportunitiesByStage', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'value', value)), '[]')
      from opportunities_by_stage
    ),
    'salesEvolution', (select coalesce(jsonb_agg(to_jsonb(sales_evolution)), '[]') from sales_evolution),
    'leadsBySource', (select coalesce(jsonb_agg(to_jsonb(leads_by_source)), '[]') from leads_by_source),
    'lossReasons', (select coalesce(jsonb_agg(to_jsonb(loss_reasons)), '[]') from loss_reasons)
  )
  from outcomes;
$$;

revoke all on function public.get_commercial_dashboard(
  uuid, timestamptz, timestamptz, uuid, uuid, uuid, text, text, uuid
) from public, anon;

grant execute on function public.get_commercial_dashboard(
  uuid, timestamptz, timestamptz, uuid, uuid, uuid, text, text, uuid
) to authenticated;
