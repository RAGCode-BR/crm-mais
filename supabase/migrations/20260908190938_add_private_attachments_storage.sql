-- Sensitive commercial documents live in a private bucket. Access to every
-- object is derived from the organization UUID in the first path segment.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'crm-private-attachments',
  'crm-private-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.storage_path_organization_id(object_name text)
returns uuid
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  first_segment text;
begin
  first_segment := split_part(object_name, '/', 1);
  if first_segment !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then
    return null;
  end if;
  return first_segment::uuid;
end;
$$;

revoke all on function private.storage_path_organization_id(text)
  from public, anon, authenticated, service_role;
grant execute on function private.storage_path_organization_id(text) to authenticated;

drop policy if exists crm_attachments_select_member on storage.objects;
create policy crm_attachments_select_member
on storage.objects for select
to authenticated
using (
  bucket_id = 'crm-private-attachments'
  and (select private.has_organization_role(
    private.storage_path_organization_id(name),
    array['owner', 'admin', 'manager', 'sales', 'viewer']
  ))
);

drop policy if exists crm_attachments_insert_sales on storage.objects;
create policy crm_attachments_insert_sales
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'crm-private-attachments'
  and (select private.has_organization_role(
    private.storage_path_organization_id(name),
    array['owner', 'admin', 'manager', 'sales']
  ))
);

drop policy if exists crm_attachments_delete_manager on storage.objects;
create policy crm_attachments_delete_manager
on storage.objects for delete
to authenticated
using (
  bucket_id = 'crm-private-attachments'
  and (select private.has_organization_role(
    private.storage_path_organization_id(name),
    array['owner', 'admin', 'manager']
  ))
);

-- Attachment metadata is immutable. Files are replaced by creating a new
-- object, and removal stays restricted to management in both tables.
drop policy if exists attachments_update_sales on public.attachments;
revoke update on table public.attachments from authenticated;

create or replace function private.validate_attachment_storage_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  entity_type text;
  entity_id uuid;
  expected_prefix text;
  current_member_id uuid;
begin
  if new.company_id is not null then
    entity_type := 'companies';
    entity_id := new.company_id;
  elsif new.lead_id is not null then
    entity_type := 'leads';
    entity_id := new.lead_id;
  elsif new.opportunity_id is not null then
    entity_type := 'opportunities';
    entity_id := new.opportunity_id;
  elsif new.activity_id is not null then
    entity_type := 'activities';
    entity_id := new.activity_id;
  else
    raise exception 'Attachment must reference a supported entity.';
  end if;

  expected_prefix := new.organization_id::text || '/' || entity_type || '/' || entity_id::text || '/';
  if new.storage_bucket <> 'crm-private-attachments'
    or left(new.storage_path, length(expected_prefix)) <> expected_prefix
    or length(new.storage_path) <= length(expected_prefix)
  then
    raise exception 'Attachment storage path does not match its organization and entity.';
  end if;

  if tg_op = 'INSERT' then
    select member.id
      into current_member_id
    from public.organization_members as member
    where member.organization_id = new.organization_id
      and member.profile_id = (select auth.uid())
      and member.status = 'active'
    limit 1;

    if current_member_id is null then
      raise exception 'An active organization membership is required.';
    end if;
    new.uploaded_by_member_id := current_member_id;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_attachment_storage_metadata()
  from public, anon, authenticated, service_role;

create trigger attachments_validate_storage_metadata
before insert or update on public.attachments
for each row execute function private.validate_attachment_storage_metadata();
