-- Block 14: tenant-scoped, ranked global search.
-- Expression indexes keep the source tables free of provider-specific embedding columns.

create index companies_global_search_fts_idx
on public.companies using gin ((
  setweight(to_tsvector('simple'::regconfig, coalesce(trade_name, '')), 'A') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(legal_name, '')), 'A') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(tax_id, '') || ' ' || coalesce(industry, '')), 'B') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(city, '') || ' ' || coalesce(state, '')), 'C')
));

create index contacts_global_search_fts_idx
on public.contacts using gin ((
  setweight(to_tsvector('simple'::regconfig, first_name || ' ' || coalesce(last_name, '')), 'A') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(email, '') || ' ' || coalesce(job_title, '') || ' ' || coalesce(department, '')), 'B')
));

create index leads_global_search_fts_idx
on public.leads using gin ((
  setweight(to_tsvector('simple'::regconfig, name), 'A') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(email, '') || ' ' || coalesce(phone, '')), 'B') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(next_action, '') || ' ' || coalesce(notes, '')), 'C')
));

create index opportunities_global_search_fts_idx
on public.opportunities using gin ((
  setweight(to_tsvector('simple'::regconfig, title), 'A') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(product_service, '')), 'B') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(description, '') || ' ' || coalesce(loss_reason, '')), 'C')
));

create index tasks_global_search_fts_idx
on public.tasks using gin ((
  setweight(to_tsvector('simple'::regconfig, title), 'A') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(description, '') || ' ' || type), 'B')
));

create or replace function public.search_global(
  target_organization_id uuid,
  search_text text,
  result_limit integer default 25
)
returns table (
  entity_type text,
  entity_id uuid,
  title text,
  subtitle text,
  action_path text,
  rank real,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      lower(btrim(search_text)) as term,
      websearch_to_tsquery('simple'::regconfig, btrim(search_text)) as ts_query
    where length(btrim(search_text)) >= 2
  ),
  matches as (
    select
      'company'::text as entity_type,
      company.id as entity_id,
      company.trade_name as title,
      concat_ws(' · ', 'Empresa', nullif(company.industry, ''), nullif(company.city, '')) as subtitle,
      '/empresas/' || company.id::text as action_path,
      greatest(
        ts_rank_cd(
          setweight(to_tsvector('simple'::regconfig, coalesce(company.trade_name, '')), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(company.legal_name, '')), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(company.tax_id, '') || ' ' || coalesce(company.industry, '')), 'B') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(company.city, '') || ' ' || coalesce(company.state, '')), 'C'),
          params.ts_query
        ),
        case
          when lower(company.trade_name) like params.term || '%' then 1.5::real
          when strpos(lower(company.trade_name || ' ' || coalesce(company.legal_name, '')), params.term) > 0 then 0.8::real
          else 0::real
        end
      ) as rank,
      company.updated_at
    from public.companies as company
    cross join params
    where company.organization_id = target_organization_id
      and company.archived_at is null
      and (
        (
          setweight(to_tsvector('simple'::regconfig, coalesce(company.trade_name, '')), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(company.legal_name, '')), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(company.tax_id, '') || ' ' || coalesce(company.industry, '')), 'B') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(company.city, '') || ' ' || coalesce(company.state, '')), 'C')
        ) @@ params.ts_query
        or strpos(lower(company.trade_name || ' ' || coalesce(company.legal_name, '')), params.term) > 0
      )

    union all

    select
      'contact',
      contact.id,
      btrim(contact.first_name || ' ' || coalesce(contact.last_name, '')),
      concat_ws(' · ', 'Contato', company.trade_name, nullif(contact.job_title, '')),
      '/contatos/' || contact.id::text,
      greatest(
        ts_rank_cd(
          setweight(to_tsvector('simple'::regconfig, contact.first_name || ' ' || coalesce(contact.last_name, '')), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(contact.email, '') || ' ' || coalesce(contact.job_title, '') || ' ' || coalesce(contact.department, '')), 'B'),
          params.ts_query
        ),
        case
          when lower(contact.first_name || ' ' || coalesce(contact.last_name, '')) like params.term || '%' then 1.3::real
          when strpos(lower(contact.first_name || ' ' || coalesce(contact.last_name, '')), params.term) > 0 then 0.75::real
          when strpos(lower(company.trade_name), params.term) > 0 then 0.45::real
          else 0::real
        end
      ),
      contact.updated_at
    from public.contacts as contact
    join public.companies as company
      on company.organization_id = contact.organization_id and company.id = contact.company_id
    cross join params
    where contact.organization_id = target_organization_id
      and contact.archived_at is null
      and (
        (
          setweight(to_tsvector('simple'::regconfig, contact.first_name || ' ' || coalesce(contact.last_name, '')), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(contact.email, '') || ' ' || coalesce(contact.job_title, '') || ' ' || coalesce(contact.department, '')), 'B')
        ) @@ params.ts_query
        or strpos(lower(contact.first_name || ' ' || coalesce(contact.last_name, '') || ' ' || company.trade_name), params.term) > 0
      )

    union all

    select
      'lead',
      lead.id,
      lead.name,
      concat_ws(' · ', 'Lead', company.trade_name, lead.status),
      '/leads/' || lead.id::text,
      greatest(
        ts_rank_cd(
          setweight(to_tsvector('simple'::regconfig, lead.name), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(lead.email, '') || ' ' || coalesce(lead.phone, '')), 'B') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(lead.next_action, '') || ' ' || coalesce(lead.notes, '')), 'C'),
          params.ts_query
        ),
        case
          when lower(lead.name) like params.term || '%' then 1.3::real
          when strpos(lower(lead.name), params.term) > 0 then 0.75::real
          when strpos(lower(coalesce(company.trade_name, '')), params.term) > 0 then 0.45::real
          else 0::real
        end
      ),
      lead.updated_at
    from public.leads as lead
    left join public.companies as company
      on company.organization_id = lead.organization_id and company.id = lead.company_id
    cross join params
    where lead.organization_id = target_organization_id
      and lead.archived_at is null
      and (
        (
          setweight(to_tsvector('simple'::regconfig, lead.name), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(lead.email, '') || ' ' || coalesce(lead.phone, '')), 'B') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(lead.next_action, '') || ' ' || coalesce(lead.notes, '')), 'C')
        ) @@ params.ts_query
        or strpos(lower(lead.name || ' ' || coalesce(company.trade_name, '')), params.term) > 0
      )

    union all

    select
      'opportunity',
      opportunity.id,
      opportunity.title,
      concat_ws(' · ', 'Oportunidade', company.trade_name, nullif(opportunity.product_service, '')),
      '/oportunidades/' || opportunity.id::text,
      greatest(
        ts_rank_cd(
          setweight(to_tsvector('simple'::regconfig, opportunity.title), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(opportunity.product_service, '')), 'B') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(opportunity.description, '') || ' ' || coalesce(opportunity.loss_reason, '')), 'C'),
          params.ts_query
        ),
        case
          when lower(opportunity.title) like params.term || '%' then 1.3::real
          when strpos(lower(opportunity.title), params.term) > 0 then 0.75::real
          when strpos(lower(company.trade_name), params.term) > 0 then 0.45::real
          else 0::real
        end
      ),
      opportunity.updated_at
    from public.opportunities as opportunity
    join public.companies as company
      on company.organization_id = opportunity.organization_id and company.id = opportunity.company_id
    cross join params
    where opportunity.organization_id = target_organization_id
      and (
        (
          setweight(to_tsvector('simple'::regconfig, opportunity.title), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(opportunity.product_service, '')), 'B') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(opportunity.description, '') || ' ' || coalesce(opportunity.loss_reason, '')), 'C')
        ) @@ params.ts_query
        or strpos(lower(opportunity.title || ' ' || company.trade_name), params.term) > 0
      )

    union all

    select
      'task',
      task.id,
      task.title,
      concat_ws(
        ' · ',
        'Tarefa',
        coalesce(direct_company.trade_name, lead_company.trade_name, opportunity_company.trade_name),
        task.status
      ),
      '/tarefas/' || task.id::text,
      greatest(
        ts_rank_cd(
          setweight(to_tsvector('simple'::regconfig, task.title), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(task.description, '') || ' ' || task.type), 'B'),
          params.ts_query
        ),
        case
          when lower(task.title) like params.term || '%' then 1.2::real
          when strpos(lower(task.title), params.term) > 0 then 0.7::real
          when strpos(lower(coalesce(direct_company.trade_name, lead_company.trade_name, opportunity_company.trade_name, '')), params.term) > 0 then 0.4::real
          else 0::real
        end
      ),
      task.updated_at
    from public.tasks as task
    left join public.companies as direct_company
      on direct_company.organization_id = task.organization_id and direct_company.id = task.company_id
    left join public.leads as related_lead
      on related_lead.organization_id = task.organization_id and related_lead.id = task.lead_id
    left join public.companies as lead_company
      on lead_company.organization_id = related_lead.organization_id and lead_company.id = related_lead.company_id
    left join public.opportunities as related_opportunity
      on related_opportunity.organization_id = task.organization_id and related_opportunity.id = task.opportunity_id
    left join public.companies as opportunity_company
      on opportunity_company.organization_id = related_opportunity.organization_id and opportunity_company.id = related_opportunity.company_id
    cross join params
    where task.organization_id = target_organization_id
      and (
        (
          setweight(to_tsvector('simple'::regconfig, task.title), 'A') ||
          setweight(to_tsvector('simple'::regconfig, coalesce(task.description, '') || ' ' || task.type), 'B')
        ) @@ params.ts_query
        or strpos(
          lower(
            task.title || ' ' ||
            coalesce(direct_company.trade_name, lead_company.trade_name, opportunity_company.trade_name, '')
          ),
          params.term
        ) > 0
      )
  )
  select
    matches.entity_type,
    matches.entity_id,
    matches.title,
    matches.subtitle,
    matches.action_path,
    matches.rank,
    matches.updated_at
  from matches
  order by matches.rank desc, matches.updated_at desc
  limit least(greatest(coalesce(result_limit, 25), 1), 50);
$$;

revoke all on function public.search_global(uuid, text, integer)
from public, anon, service_role;
grant execute on function public.search_global(uuid, text, integer) to authenticated;
