import { z } from 'zod'

export const activitySchema = z.object({
  type: z.enum(['call', 'whatsapp', 'email', 'meeting', 'note', 'proposal']),
  subject: z.string().trim().min(1, 'Informe o assunto.').max(160, 'Use no máximo 160 caracteres.'),
  description: z.string().trim().max(5000, 'Use no máximo 5000 caracteres.'),
  occurredAt: z.string().min(1, 'Informe a data e hora.'),
  companyId: z.string(),
  contactId: z.string(),
  leadId: z.string(),
  opportunityId: z.string(),
})
