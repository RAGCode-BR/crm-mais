import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título.').max(160, 'Use no máximo 160 caracteres.'),
  description: z.string().trim().max(5000, 'Use no máximo 5000 caracteres.'),
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
