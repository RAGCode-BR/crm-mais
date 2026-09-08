import { z } from 'zod'

export const aiResponseSchema = z.object({
  title: z.string().min(1),
  answer: z.string().min(1),
  evidence: z.array(z.string()),
  suggestedActions: z.array(
    z.object({
      label: z.string().min(1),
      path: z.string().regex(/^\//),
      reason: z.string().min(1),
      requiresConfirmation: z.literal(true),
    }),
  ),
  generatedAt: z.iso.datetime(),
  provider: z.string().min(1),
  model: z.string().min(1),
})
