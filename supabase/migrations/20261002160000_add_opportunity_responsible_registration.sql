-- Quick opportunities may start without the client's responsible person. After
-- the first contact, this registers that person as a contact of the
-- opportunity's company (reusing one with the same name) and links it.
create or replace function public.register_opportunity_responsible(
  target_opportunity_id uuid,
  responsible_name text,
  job_title text,
  contact_phone text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  normalized_responsible text := nullif(btrim(responsible_name), '');
  normalized_job_title text := nullif(btrim(job_title), '');
  normalized_phone text := nullif(regexp_replace(coalesce(contact_phone, ''), '\D', '', 'g'), '');
  target_organization_id uuid;
  target_company_id uuid;
  current_contact_id uuid;
  target_contact_id uuid;
begin
  select opportunity.organization_id, opportunity.company_id, opportunity.contact_id
    into target_organization_id, target_company_id, current_contact_id
  from public.opportunities as opportunity
  where opportunity.id = target_opportunity_id
  for update;

  if target_organization_id is null
    or not private.has_organization_role(
      target_organization_id,
      array['owner', 'admin', 'manager', 'sales']
    ) then
    raise exception 'Oportunidade não encontrada ou sem permissão para editar.'
      using errcode = '42501';
  end if;
  if current_contact_id is not null then
    raise exception 'Esta oportunidade já possui um responsável.' using errcode = '22023';
  end if;
  if normalized_responsible is null then
    raise exception 'Informe o nome do responsável.' using errcode = '22023';
  end if;
  if length(normalized_phone) > 30 then
    raise exception 'Use no máximo 30 dígitos no telefone.' using errcode = '22023';
  end if;

  select contact.id
    into target_contact_id
  from public.contacts as contact
  where contact.organization_id = target_organization_id
    and contact.company_id = target_company_id
    and contact.archived_at is null
    and lower(btrim(concat_ws(' ', contact.first_name, contact.last_name)))
      = lower(normalized_responsible)
  order by contact.created_at
  limit 1;

  if target_contact_id is null then
    insert into public.contacts (
      organization_id, company_id, first_name, last_name, job_title, phone
    )
    values (
      target_organization_id,
      target_company_id,
      split_part(normalized_responsible, ' ', 1),
      nullif(
        btrim(substr(normalized_responsible, length(split_part(normalized_responsible, ' ', 1)) + 1)),
        ''
      ),
      normalized_job_title,
      normalized_phone
    )
    returning id into target_contact_id;
  else
    update public.contacts as contact
    set
      phone = coalesce(contact.phone, normalized_phone),
      job_title = coalesce(contact.job_title, normalized_job_title)
    where contact.id = target_contact_id;
  end if;

  update public.opportunities as opportunity
  set contact_id = target_contact_id
  where opportunity.id = target_opportunity_id;

  return target_contact_id;
end;
$$;

revoke all on function public.register_opportunity_responsible(uuid, text, text, text)
from public, anon;
grant execute on function public.register_opportunity_responsible(uuid, text, text, text)
to authenticated;
