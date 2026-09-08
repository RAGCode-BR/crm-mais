import { z } from 'zod'

export const prospectingListSchema = z.object({
  name: z.string().trim().min(3, 'Informe um nome com pelo menos 3 caracteres.').max(120),
  description: z.string().trim().max(500, 'Use no máximo 500 caracteres.'),
  ownerMemberId: z.string(),
})

export const bulkActivitySchema = z.object({
  type: z.enum(['call', 'whatsapp', 'email', 'meeting', 'note']),
  subject: z.string().trim().min(3, 'Informe o assunto da ação.').max(160),
  description: z.string().trim().max(1000, 'Use no máximo 1000 caracteres.'),
})

export const prospectingSearchSchema = z.string().trim().max(100)

export type ProspectingListFormValues = z.infer<typeof prospectingListSchema>
export type BulkActivityFormValues = z.infer<typeof bulkActivitySchema>
