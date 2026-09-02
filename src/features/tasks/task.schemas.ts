import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título.'),
  description: z.string(),
  assignedMemberId: z.string().min(1, 'Selecione o responsável.'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  type: z.enum(['call', 'whatsapp', 'email', 'meeting', 'follow_up', 'general']),
  dueAt: z.string().min(1, 'Informe o vencimento.'),
  companyId: z.string(),
  contactId: z.string(),
  leadId: z.string(),
  opportunityId: z.string(),
})
