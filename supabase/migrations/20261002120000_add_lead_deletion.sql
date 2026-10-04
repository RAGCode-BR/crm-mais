-- Permanently deletes a lead and every record that depends on it in a single
-- transaction. Foreign keys to leads are restrictive, so dependents are removed
-- explicitly, children before parents. Storage objects cannot be removed from
-- SQL safely, so their locations are returned for the client to delete.
create or replace function public.delete_lead(target_lead_id uuid)
returns table (storage_bucket text, storage_path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  opportunity_ids uuid[];
  enrollment_ids uuid[];
  activity_ids uuid[];
  task_ids uuid[];
begin
  select lead.organization_id
    into target_organization_id
  from public.leads as lead
  where lead.id = target_lead_id
  for update;

  if target_organization_id is null
    or not private.has_organization_role(
      target_organization_id,
      array['owner', 'admin', 'manager']
    ) then
    raise exception 'Lead não encontrado ou sem permissão para excluir.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(opportunity.id), '{}')
    into opportunity_ids
  from public.opportunities as opportunity
  where opportunity.organization_id = target_organization_id
    and opportunity.lead_id = target_lead_id;

  select coalesce(array_agg(enrollment.id), '{}')
    into enrollment_ids
  from public.cadence_enrollments as enrollment
  where enrollment.organization_id = target_organization_id
    and enrollment.lead_id = target_lead_id;

  select coalesce(array_agg(activity.id), '{}')
    into activity_ids
  from public.activities as activity
  where activity.organization_id = target_organization_id
    and (activity.lead_id = target_lead_id or activity.opportunity_id = any (opportunity_ids));

  select coalesce(array_agg(task.id), '{}')
    into task_ids
  from public.tasks as task
  where task.organization_id = target_organization_id
    and (
      task.lead_id = target_lead_id
      or task.opportunity_id = any (opportunity_ids)
      or task.cadence_enrollment_id = any (enrollment_ids)
    );

  -- return query only appends rows; execution continues with the deletes.
  return query
  select attachment.storage_bucket, attachment.storage_path
  from public.attachments as attachment
  where attachment.organization_id = target_organization_id
    and (
      attachment.lead_id = target_lead_id
      or attachment.opportunity_id = any (opportunity_ids)
      or attachment.activity_id = any (activity_ids)
    );

  delete from public.entity_tags as tag
  where tag.organization_id = target_organization_id
    and (
      tag.lead_id = target_lead_id
      or tag.opportunity_id = any (opportunity_ids)
      or tag.activity_id = any (activity_ids)
      or tag.task_id = any (task_ids)
    );

  delete from public.attachments as attachment
  where attachment.organization_id = target_organization_id
    and (
      attachment.lead_id = target_lead_id
      or attachment.opportunity_id = any (opportunity_ids)
      or attachment.activity_id = any (activity_ids)
    );

  delete from public.notes as note
  where note.organization_id = target_organization_id
    and (note.lead_id = target_lead_id or note.opportunity_id = any (opportunity_ids));

  delete from public.tasks as task
  where task.organization_id = target_organization_id
    and task.id = any (task_ids);

  delete from public.activities as activity
  where activity.organization_id = target_organization_id
    and activity.id = any (activity_ids);

  delete from public.cadence_enrollments as enrollment
  where enrollment.organization_id = target_organization_id
    and enrollment.id = any (enrollment_ids);

  delete from public.prospecting_list_items as item
  where item.organization_id = target_organization_id
    and item.lead_id = target_lead_id;

  delete from public.opportunities as opportunity
  where opportunity.organization_id = target_organization_id
    and opportunity.id = any (opportunity_ids);

  -- Activity deletion recalculates the lead score, which can raise new
  -- notifications, so notifications are cleared only after it.
  delete from public.notifications as notification
  where notification.organization_id = target_organization_id
    and notification.related_entity_id = any (
      array[target_lead_id] || opportunity_ids || activity_ids || task_ids
    );

  delete from public.leads as lead
  where lead.id = target_lead_id;
end;
$$;

revoke all on function public.delete_lead(uuid) from public, anon;
grant execute on function public.delete_lead(uuid) to authenticated;
