import { supabase } from '@/lib/supabase/client'
import type { AttachmentRecord, AttachmentTarget } from './attachment.types'
import { ATTACHMENTS_BUCKET } from './attachment.constants'
import {
  attachmentEntityConfig,
  sanitizeFileName,
  validateAttachmentFile,
} from './attachment.utils'

const attachmentColumns =
  'id,organization_id,company_id,lead_id,opportunity_id,activity_id,uploaded_by_member_id,storage_bucket,storage_path,file_name,mime_type,size_bytes,created_at,updated_at,created_by'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

export async function listAttachments(target: AttachmentTarget): Promise<AttachmentRecord[]> {
  const config = attachmentEntityConfig[target.entityType]
  const { data, error } = await client()
    .from('attachments')
    .select(attachmentColumns)
    .eq('organization_id', target.organizationId)
    .eq(config.column, target.entityId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as AttachmentRecord[]
}

export async function uploadAttachment(target: AttachmentTarget, membershipId: string, file: File) {
  const validationError = validateAttachmentFile(file)
  if (validationError) throw new Error(validationError)
  const config = attachmentEntityConfig[target.entityType]
  const storagePath = `${target.organizationId}/${config.folder}/${target.entityId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
  const storage = client().storage.from(ATTACHMENTS_BUCKET)
  const { error: uploadError } = await storage.upload(storagePath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const entityIds = {
    company_id: config.column === 'company_id' ? target.entityId : null,
    lead_id: config.column === 'lead_id' ? target.entityId : null,
    opportunity_id: config.column === 'opportunity_id' ? target.entityId : null,
    activity_id: config.column === 'activity_id' ? target.entityId : null,
  }
  const { data, error } = await client()
    .from('attachments')
    .insert({
      organization_id: target.organizationId,
      uploaded_by_member_id: membershipId,
      storage_bucket: ATTACHMENTS_BUCKET,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      ...entityIds,
    })
    .select(attachmentColumns)
    .single()
  if (error) {
    await storage.remove([storagePath])
    throw error
  }
  return data as unknown as AttachmentRecord
}

export async function createAttachmentDownloadUrl(attachment: AttachmentRecord) {
  const { data, error } = await client()
    .storage.from(attachment.storage_bucket)
    .createSignedUrl(attachment.storage_path, 60, { download: attachment.file_name })
  if (error) throw error
  return data.signedUrl
}

export async function deleteAttachment(attachment: AttachmentRecord) {
  const { error } = await client()
    .from('attachments')
    .delete()
    .eq('organization_id', attachment.organization_id)
    .eq('id', attachment.id)
  if (error) throw error

  const { error: storageError } = await client()
    .storage.from(attachment.storage_bucket)
    .remove([attachment.storage_path])
  if (storageError) {
    throw new Error(
      'O registro foi removido, mas o arquivo aguarda limpeza no armazenamento. Tente novamente mais tarde.',
    )
  }
}
