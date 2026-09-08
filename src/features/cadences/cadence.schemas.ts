import { z } from 'zod'

const cadenceStepSchema = z.object({
  dayNumber: z.number().int().min(1, 'O dia deve ser igual ou maior que 1.').max(365),
  type: z.enum(['call', 'whatsapp', 'email', 'meeting', 'follow_up', 'general']),
  title: z.string().trim().min(3, 'Informe um título para a etapa.').max(160),
  description: z.string().trim().max(1000),
})

export const cadenceSchema = z
  .object({
    name: z.string().trim().min(3, 'Informe um nome com pelo menos 3 caracteres.').max(120),
    description: z.string().trim().max(500),
    status: z.enum(['draft', 'active', 'paused', 'archived']),
    steps: z.array(cadenceStepSchema).min(1, 'Adicione pelo menos uma etapa.').max(30),
  })
  .superRefine(({ steps }, context) => {
    steps.forEach((step, index) => {
      if (index > 0 && step.dayNumber < steps[index - 1]!.dayNumber)
        context.addIssue({
          code: 'custom',
          message: 'Os dias devem seguir ordem crescente.',
          path: ['steps', index, 'dayNumber'],
        })
    })
  })

export type CadenceFormValues = z.infer<typeof cadenceSchema>
