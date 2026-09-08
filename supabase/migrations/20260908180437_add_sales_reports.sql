-- Block 12: tenant-aware sales and loss analysis reports.
create or replace function public.get_sales_report(
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
  with dashboard as (
    select public.get_commercial_dashboard(
      target_organization_id, period_start, period_end,
      target_owner_member_id, target_team_id, target_lead_source_id,
      target_industry, target_product_service, target_pipeline_id
    ) as data
  ),
  filtered_opportunities as (
    select opportunity.*, stage.name as stage_name
    from public.opportunities as opportunity
    join public.companies as company
      on company.organization_id = opportunity.organization_id and company.id = opportunity.company_id
    join public.pipeline_stages as stage
      on stage.organization_id = opportunity.organization_id and stage.id = opportunity.stage_id
    left join public.organization_members as member
      on member.organization_id = opportunity.organization_id and member.id = opportunity.owner_member_id
    where opportunity.organization_id = target_organization_id
      and (target_owner_member_id is null or opportunity.owner_member_id = target_owner_member_id)
      and (target_team_id is null or member.team_id = target_team_id)
      and (target_lead_source_id is null or opportunity.lead_source_id = target_lead_source_id)
      and (target_industry is null or company.industry = target_industry)
      and (target_product_service is null or opportunity.product_service = target_product_service)
      and (target_pipeline_id is null or opportunity.pipeline_id = target_pipeline_id)
  ),
  opportunity_stats as (
    select
      count(*) filter (where status = 'open')::integer as open_opportunities,
      coalesce(sum(estimated_value) filter (
        where status = 'won' and closed_at between period_start and period_end
      ), 0)::numeric as closed_revenue,
      coalesce(avg(extract(epoch from (closed_at - created_at)) / 86400) filter (
        where status in ('won', 'lost') and closed_at between period_start and period_end
      ), 0)::numeric as average_sales_cycle_days
    from filtered_opportunities
  ),
  current_stage_age as (
    select
      opportunity.id,
      opportunity.stage_name,
      extract(epoch from (now() - coalesce(stage_event.changed_at, opportunity.created_at))) / 86400 as days
    from filtered_opportunities as opportunity
    left join lateral (
      select max(activity.occurred_at) as changed_at
      from public.activities as activity
      where activity.organization_id = opportunity.organization_id
        and activity.opportunity_id = opportunity.id
        and activity.type = 'stage_change'
    ) as stage_event on true
    where opportunity.status = 'open'
  ),
  stage_times as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'label', grouped.stage_name,
      'averageDays', round(grouped.average_days, 1),
      'opportunityCount', grouped.opportunity_count
    ) order by grouped.average_days desc), '[]'::jsonb) as data
    from (
      select stage_name, avg(days) as average_days, count(*)::integer as opportunity_count
      from current_stage_age group by stage_name
    ) as grouped
  ),
  metrics as (
    select
      dashboard.data -> 'metrics' as base,
      coalesce((dashboard.data -> 'metrics' ->> 'newLeads')::numeric, 0) as leads,
      coalesce((dashboard.data -> 'metrics' ->> 'qualifiedLeads')::numeric, 0) as qualified,
      coalesce((dashboard.data -> 'metrics' ->> 'meetings')::numeric, 0) as meetings,
      coalesce((dashboard.data -> 'metrics' ->> 'proposals')::numeric, 0) as proposals,
      coalesce((dashboard.data -> 'metrics' ->> 'negotiations')::numeric, 0) as negotiations,
      coalesce((dashboard.data -> 'metrics' ->> 'won')::numeric, 0) as won
    from dashboard
  )
  select jsonb_build_object(
    'metrics', metrics.base || jsonb_build_object(
      'openOpportunities', stats.open_opportunities,
      'closedRevenue', stats.closed_revenue,
      'averageSalesCycleDays', round(stats.average_sales_cycle_days, 1)
    ),
    'funnel', jsonb_build_array(
      jsonb_build_object('label', 'Lead → Qualificado', 'from', metrics.leads, 'to', metrics.qualified,
        'rate', case when metrics.leads = 0 then 0 else round(least(100, metrics.qualified * 100 / metrics.leads), 1) end),
      jsonb_build_object('label', 'Qualificado → Reunião', 'from', metrics.qualified, 'to', metrics.meetings,
        'rate', case when metrics.qualified = 0 then 0 else round(least(100, metrics.meetings * 100 / metrics.qualified), 1) end),
      jsonb_build_object('label', 'Reunião → Proposta', 'from', metrics.meetings, 'to', metrics.proposals,
        'rate', case when metrics.meetings = 0 then 0 else round(least(100, metrics.proposals * 100 / metrics.meetings), 1) end),
      jsonb_build_object('label', 'Proposta → Negociação', 'from', metrics.proposals, 'to', metrics.negotiations,
        'rate', case when metrics.proposals = 0 then 0 else round(least(100, metrics.negotiations * 100 / metrics.proposals), 1) end),
      jsonb_build_object('label', 'Negociação → Ganho', 'from', metrics.negotiations, 'to', metrics.won,
        'rate', case when metrics.negotiations = 0 then 0 else round(least(100, metrics.won * 100 / metrics.negotiations), 1) end)
    ),
    'stageTimes', stage_times.data
  )
  from metrics cross join opportunity_stats as stats cross join stage_times;
$$;

revoke all on function public.get_sales_report(
  uuid, timestamptz, timestamptz, uuid, uuid, uuid, text, text, uuid
) from public, anon;
grant execute on function public.get_sales_report(
  uuid, timestamptz, timestamptz, uuid, uuid, uuid, text, text, uuid
) to authenticated;

create or replace function public.get_loss_analysis(
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
  with closed_opportunities as (
    select
      opportunity.*,
      company.industry,
      coalesce(profile.full_name, 'Sem responsável') as owner_name,
      coalesce(source.name, 'Sem origem') as source_name
    from public.opportunities as opportunity
    join public.companies as company
      on company.organization_id = opportunity.organization_id and company.id = opportunity.company_id
    left join public.organization_members as member
      on member.organization_id = opportunity.organization_id and member.id = opportunity.owner_member_id
    left join public.profiles as profile on profile.id = member.profile_id
    left join public.lead_sources as source
      on source.organization_id = opportunity.organization_id and source.id = opportunity.lead_source_id
    where opportunity.organization_id = target_organization_id
      and opportunity.status in ('won', 'lost')
      and opportunity.closed_at between period_start and period_end
      and period_end >= period_start and period_end <= period_start + interval '366 days'
      and (target_owner_member_id is null or opportunity.owner_member_id = target_owner_member_id)
      and (target_team_id is null or member.team_id = target_team_id)
      and (target_lead_source_id is null or opportunity.lead_source_id = target_lead_source_id)
      and (target_industry is null or company.industry = target_industry)
      and (target_product_service is null or opportunity.product_service = target_product_service)
      and (target_pipeline_id is null or opportunity.pipeline_id = target_pipeline_id)
  ),
  loss_by_reason as (
    select coalesce(jsonb_agg(jsonb_build_object('label', label, 'value', value)
      order by value desc, label), '[]'::jsonb) as data
    from (select coalesce(nullif(btrim(loss_reason), ''), 'Não informado') as label,
      count(*)::integer as value from closed_opportunities where status = 'lost' group by 1) grouped
  ),
  loss_by_owner as (
    select coalesce(jsonb_agg(jsonb_build_object('label', label, 'value', value)
      order by value desc, label), '[]'::jsonb) as data
    from (select owner_name as label, count(*)::integer as value
      from closed_opportunities where status = 'lost' group by owner_name) grouped
  ),
  loss_by_industry as (
    select coalesce(jsonb_agg(jsonb_build_object('label', label, 'value', value)
      order by value desc, label), '[]'::jsonb) as data
    from (select coalesce(industry, 'Não informado') as label, count(*)::integer as value
      from closed_opportunities where status = 'lost' group by 1) grouped
  ),
  loss_by_product as (
    select coalesce(jsonb_agg(jsonb_build_object('label', label, 'value', value)
      order by value desc, label), '[]'::jsonb) as data
    from (select coalesce(product_service, 'Não informado') as label, count(*)::integer as value
      from closed_opportunities where status = 'lost' group by 1) grouped
  ),
  conversion_by_owner as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'label', label, 'won', won, 'total', total,
      'rate', case when total = 0 then 0 else round(won * 100.0 / total, 1) end
    ) order by rate desc, label), '[]'::jsonb) as data
    from (select owner_name as label, count(*) filter (where status = 'won')::integer as won,
      count(*)::integer as total,
      case when count(*) = 0 then 0 else round(count(*) filter (where status = 'won') * 100.0 / count(*), 1) end as rate
      from closed_opportunities group by owner_name) grouped
  ),
  conversion_by_source as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'label', label, 'won', won, 'total', total,
      'rate', case when total = 0 then 0 else round(won * 100.0 / total, 1) end
    ) order by rate desc, label), '[]'::jsonb) as data
    from (select source_name as label, count(*) filter (where status = 'won')::integer as won,
      count(*)::integer as total,
      case when count(*) = 0 then 0 else round(count(*) filter (where status = 'won') * 100.0 / count(*), 1) end as rate
      from closed_opportunities group by source_name) grouped
  ),
  conversion_by_industry as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'label', label, 'won', won, 'total', total,
      'rate', case when total = 0 then 0 else round(won * 100.0 / total, 1) end
    ) order by rate desc, label), '[]'::jsonb) as data
    from (select coalesce(industry, 'Não informado') as label,
      count(*) filter (where status = 'won')::integer as won, count(*)::integer as total,
      case when count(*) = 0 then 0 else round(count(*) filter (where status = 'won') * 100.0 / count(*), 1) end as rate
      from closed_opportunities group by 1) grouped
  ),
  summary_stats as (
    select
      count(*) filter (where status = 'won')::integer as won,
      count(*) filter (where status = 'lost')::integer as lost,
      coalesce(sum(estimated_value) filter (where status = 'lost'), 0)::numeric as lost_value,
      case when count(*) = 0 then 0
        else round(count(*) filter (where status = 'won') * 100.0 / count(*), 1) end as conversion_rate
    from closed_opportunities
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'won', summary_stats.won,
      'lost', summary_stats.lost,
      'lostValue', summary_stats.lost_value,
      'conversionRate', summary_stats.conversion_rate
    ),
    'lossByReason', loss_by_reason.data,
    'lossByOwner', loss_by_owner.data,
    'lossByIndustry', loss_by_industry.data,
    'lossByProduct', loss_by_product.data,
    'conversionByOwner', conversion_by_owner.data,
    'conversionBySource', conversion_by_source.data,
    'conversionByIndustry', conversion_by_industry.data
  )
  from summary_stats
  cross join loss_by_reason cross join loss_by_owner cross join loss_by_industry
  cross join loss_by_product cross join conversion_by_owner cross join conversion_by_source
  cross join conversion_by_industry;
$$;

revoke all on function public.get_loss_analysis(
  uuid, timestamptz, timestamptz, uuid, uuid, uuid, text, text, uuid
) from public, anon;
grant execute on function public.get_loss_analysis(
  uuid, timestamptz, timestamptz, uuid, uuid, uuid, text, text, uuid
) to authenticated;
