-- Permanently deletes a company and everything that depends on it in a single
-- transaction. Contacts and opportunities require a company, so they cannot
-- outlive it; leads tied to the company or its contacts are removed through
-- delete_lead with their own dependency trees. Storage object locations are
-- returned for the client to delete.
create or replace function public.delete_company(target_company_id uuid)
returns table (storage_bucket text, storage_path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  contact_ids uuid[];
  opportunity_ids uuid[];
  activity_ids uuid[];
  task_ids uuid[];
  target_lead_id uuid;
begin
  select company.organization_id
    into target_organization_id
  from public.companies as company
  where company.id = target_company_id
  for update;

  if target_organization_id is null
    or not private.has_organization_role(
      target_organization_id,
      array['owner', 'admin', 'manager']
    ) then
    raise exception 'Empresa não encontrada ou sem permissão para excluir.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(contact.id), '{}')
    into contact_ids
  from public.contacts as contact
  where contact.organization_id = target_organization_id
    and contact.company_id = target_company_id;

  for target_lead_id in
    select lead.id
    from public.leads as lead
    where lead.organization_id = target_organization_id
      and (lead.company_id = target_company_id or lead.contact_id = any (contact_ids))
  loop
    return query
    select file.storage_bucket, file.storage_path
    from public.delete_lead(target_lead_id) as file;
  end loop;

  select coalesce(array_agg(opportunity.id), '{}')
    into opportunity_ids
  from public.opportunities as opportunity
  where opportunity.organization_id = target_organization_id
    and (
      opportunity.company_id = target_company_id
      or opportunity.contact_id = any (contact_ids)
    );

  select coalesce(array_agg(activity.id), '{}')
    into activity_ids
  from public.activities as activity
  where activity.organization_id = target_organization_id
    and (
      activity.company_id = target_company_id
      or activity.contact_id = any (contact_ids)
      or activity.opportunity_id = any (opportunity_ids)
    );

  select coalesce(array_agg(task.id), '{}')
    into task_ids
  from public.tasks as task
  where task.organization_id = target_organization_id
    and (
      task.company_id = target_company_id
      or task.contact_id = any (contact_ids)
      or task.opportunity_id = any (opportunity_ids)
    );

  -- return query only appends rows; execution continues with the deletes.
  return query
  select attachment.storage_bucket, attachment.storage_path
  from public.attachments as attachment
  where attachment.organization_id = target_organization_id
    and (
      attachment.company_id = target_company_id
      or attachment.opportunity_id = any (opportunity_ids)
      or attachment.activity_id = any (activity_ids)
    );

  delete from public.entity_tags as tag
  where tag.organization_id = target_organization_id
    and (
      tag.company_id = target_company_id
      or tag.contact_id = any (contact_ids)
      or tag.opportunity_id = any (opportunity_ids)
      or tag.activity_id = any (activity_ids)
      or tag.task_id = any (task_ids)
    );

  delete from public.attachments as attachment
  where attachment.organization_id = target_organization_id
    and (
      attachment.company_id = target_company_id
      or attachment.opportunity_id = any (opportunity_ids)
      or attachment.activity_id = any (activity_ids)
    );

  delete from public.notes as note
  where note.organization_id = target_organization_id
    and (
      note.company_id = target_company_id
      or note.contact_id = any (contact_ids)
      or note.opportunity_id = any (opportunity_ids)
    );

  delete from public.tasks as task
  where task.organization_id = target_organization_id
    and task.id = any (task_ids);

  delete from public.activities as activity
  where activity.organization_id = target_organization_id
    and activity.id = any (activity_ids);

  delete from public.prospecting_list_items as item
  where item.organization_id = target_organization_id
    and item.company_id = target_company_id;

  delete from public.opportunities as opportunity
  where opportunity.organization_id = target_organization_id
    and opportunity.id = any (opportunity_ids);

  delete from public.notifications as notification
  where notification.organization_id = target_organization_id
    and notification.related_entity_id = any (
      array[target_company_id] || contact_ids || opportunity_ids || activity_ids || task_ids
    );

  delete from public.contacts as contact
  where contact.organization_id = target_organization_id
    and contact.id = any (contact_ids);

  delete from public.companies as company
  where company.id = target_company_id;
end;
$$;

revoke all on function public.delete_company(uuid) from public, anon;
grant execute on function public.delete_company(uuid) to authenticated;
