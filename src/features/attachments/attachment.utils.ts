import { ATTACHMENT_MAX_SIZE, ATTACHMENT_MIME_TYPES } from './attachment.constants'
import type { AttachmentEntityType } from './attachment.types'

export const attachmentEntityConfig: Record<
  AttachmentEntityType,
  { column: 'company_id' | 'lead_id' | 'opportunity_id' | 'activity_id'; folder: string }
> = {
  company: { column: 'company_id', folder: 'companies' },
  lead: { column: 'lead_id', folder: 'leads' },
  opportunity: { column: 'opportunity_id', folder: 'opportunities' },
  activity: { column: 'activity_id', folder: 'activities' },
}

export function validateAttachmentFile(file: Pick<File, 'name' | 'size' | 'type'>) {
  if (!file.name.trim()) return 'O arquivo precisa ter um nome.'
  if (file.size <= 0) return 'O arquivo está vazio.'
  if (file.size > ATTACHMENT_MAX_SIZE) return 'O arquivo excede o limite de 20 MB.'
  if (!ATTACHMENT_MIME_TYPES.includes(file.type as (typeof ATTACHMENT_MIME_TYPES)[number])) {
    return 'Formato não permitido. Envie PDF, Office, imagem ou texto.'
  }
  return null
}

export function sanitizeFileName(fileName: string) {
  const normalized = fileName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const safe = normalized.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return safe || 'arquivo'
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
