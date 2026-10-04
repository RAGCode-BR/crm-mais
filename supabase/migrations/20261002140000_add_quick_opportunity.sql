-- Creates an opportunity from a minimal form in one transaction. The company
-- and contact are matched by name (case-insensitive) and created only when no
-- active record exists. Runs as the caller, so RLS and the usual triggers apply.
create or replace function public.create_quick_opportunity(
  target_organization_id uuid,
  company_name text,
  contact_name text,
  target_owner_member_id uuid,
  estimated_value numeric,
  probability smallint,
  product_service text,
  description text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  normalized_company text := nullif(btrim(company_name), '');
  normalized_contact text := nullif(btrim(contact_name), '');
  normalized_product text := nullif(btrim(product_service), '');
  target_company_id uuid;
  company_label text;
  target_contact_id uuid;
  target_pipeline_id uuid;
  target_stage_id uuid;
  stage_probability smallint;
  created_opportunity_id uuid;
begin
  if normalized_company is null then
    raise exception 'Informe o nome da empresa.' using errcode = '22023';
  end if;

  select pipeline.id
    into target_pipeline_id
  from public.pipelines as pipeline
  where pipeline.organization_id = target_organization_id
    and pipeline.is_active
  order by pipeline.is_default desc, pipeline.created_at
  limit 1;

  select stage.id, stage.default_probability
    into target_stage_id, stage_probability
  from public.pipeline_stages as stage
  where stage.organization_id = target_organization_id
    and stage.pipeline_id = target_pipeline_id
    and not stage.is_closed
  order by stage.position
  limit 1;

  if target_stage_id is null then
    raise exception 'Crie um pipeline ativo com uma etapa aberta antes de cadastrar oportunidades.'
      using errcode = '22023';
  end if;

  select company.id, company.trade_name
    into target_company_id, company_label
  from public.companies as company
  where company.organization_id = target_organization_id
    and company.archived_at is null
    and lower(btrim(company.trade_name)) = lower(normalized_company)
  order by company.created_at
  limit 1;

  if target_company_id is null then
    insert into public.companies (organization_id, trade_name, owner_member_id)
    values (target_organization_id, normalized_company, target_owner_member_id)
    returning id, trade_name into target_company_id, company_label;
  end if;

  if normalized_contact is not null then
    select contact.id
      into target_contact_id
    from public.contacts as contact
    where contact.organization_id = target_organization_id
      and contact.company_id = target_company_id
      and contact.archived_at is null
      and lower(btrim(concat_ws(' ', contact.first_name, contact.last_name)))
        = lower(normalized_contact)
    order by contact.created_at
    limit 1;

    if target_contact_id is null then
      insert into public.contacts (organization_id, company_id, first_name, last_name)
      values (
        target_organization_id,
        target_company_id,
        split_part(normalized_contact, ' ', 1),
        nullif(btrim(substr(normalized_contact, length(split_part(normalized_contact, ' ', 1)) + 1)), '')
      )
      returning id into target_contact_id;
    end if;
  end if;

  insert into public.opportunities (
    organization_id,
    title,
    company_id,
    contact_id,
    owner_member_id,
    pipeline_id,
    stage_id,
    status,
    estimated_value,
    probability,
    product_service,
    description
  )
  values (
    target_organization_id,
    case
      when normalized_product is null then company_label
      else company_label || ' - ' || normalized_product
    end,
    target_company_id,
    target_contact_id,
    target_owner_member_id,
    target_pipeline_id,
    target_stage_id,
    'open',
    coalesce(estimated_value, 0),
    coalesce(probability, stage_probability),
    normalized_product,
    nullif(btrim(description), '')
  )
  returning id into created_opportunity_id;

  return created_opportunity_id;
end;
$$;

revoke all on function public.create_quick_opportunity(
  uuid, text, text, uuid, numeric, smallint, text, text
) from public, anon;
grant execute on function public.create_quick_opportunity(
  uuid, text, text, uuid, numeric, smallint, text, text
) to authenticated;
