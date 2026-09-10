-- Uploads and metadata inserts are separate API calls. Allow an uploader to
-- clean up only an orphan object if the metadata insert fails; linked files
-- still require a management role to remove.
drop policy if exists crm_attachments_delete_manager on storage.objects;
create policy crm_attachments_delete_manager
on storage.objects for delete
to authenticated
using (
  bucket_id = 'crm-private-attachments'
  and (
    (select private.has_organization_role(
      private.storage_path_organization_id(name),
      array['owner', 'admin', 'manager']
    ))
    or (
      owner_id = (select auth.uid()::text)
      and not exists (
        select 1
        from public.attachments as attachment
        where attachment.storage_bucket = bucket_id
          and attachment.storage_path = name
      )
    )
  )
);
