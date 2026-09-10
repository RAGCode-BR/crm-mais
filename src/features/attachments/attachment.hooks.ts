import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AttachmentRecord, AttachmentTarget } from './attachment.types'
import {
  createAttachmentDownloadUrl,
  deleteAttachment,
  listAttachments,
  uploadAttachment,
} from './attachment.service'

const attachmentKey = (target: AttachmentTarget) => [
  'attachments',
  target.organizationId,
  target.entityType,
  target.entityId,
]

export const useAttachments = (target: AttachmentTarget) =>
  useQuery({
    queryKey: attachmentKey(target),
    queryFn: () => listAttachments(target),
    enabled: Boolean(target.organizationId && target.entityId),
  })

export function useUploadAttachment(target: AttachmentTarget, membershipId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(target, membershipId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attachmentKey(target) }),
  })
}

export function useDeleteAttachment(target: AttachmentTarget) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachment: AttachmentRecord) => deleteAttachment(attachment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attachmentKey(target) }),
  })
}

export const downloadAttachment = createAttachmentDownloadUrl
