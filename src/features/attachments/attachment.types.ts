import type { Attachment } from '@/types/database/system'

export type AttachmentEntityType = 'company' | 'lead' | 'opportunity' | 'activity'

export type AttachmentTarget = {
  entityId: string
  entityType: AttachmentEntityType
  organizationId: string
}

export type AttachmentRecord = Attachment
