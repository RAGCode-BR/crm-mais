import { z } from 'zod'

export const activitySchema = z.object({
  type: z.enum(['call', 'whatsapp', 'email', 'meeting', 'note', 'proposal']),
  subject: z.string().trim().min(1, 'Informe o assunto.'),
  description: z.string(),
  occurredAt: z.string().min(1, 'Informe a data e hora.'),
  companyId: z.string(),
  contactId: z.string(),
  leadId: z.string(),
  opportunityId: z.string(),
})
