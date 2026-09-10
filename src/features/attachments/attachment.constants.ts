export const ATTACHMENTS_BUCKET = 'crm-private-attachments'
export const ATTACHMENT_MAX_SIZE = 20 * 1024 * 1024

export const ATTACHMENT_MIME_TYPES = [
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
  'text/plain',
] as const

export const ATTACHMENT_ACCEPT = ATTACHMENT_MIME_TYPES.join(',')
