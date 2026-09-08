import { z } from 'zod'

export const scoringRuleSchema = z
  .object({
    name: z.string().trim().min(3, 'Informe um nome com pelo menos 3 caracteres.').max(120),
    description: z.string().trim().max(500),
    ruleType: z.enum([
      'lead_status',
      'lead_temperature',
      'company_industry',
      'company_employee_min',
      'activity_type_exists',
      'inactivity_days_min',
    ]),
    conditionValue: z.string().trim().min(1, 'Informe a condição da regra.').max(120),
    points: z
      .number()
      .int()
      .min(-100)
      .max(100)
      .refine((value) => value !== 0, 'A pontuação não pode ser zero.'),
    isActive: z.boolean(),
  })
  .superRefine(({ conditionValue, ruleType }, context) => {
    if (
      (ruleType === 'company_employee_min' || ruleType === 'inactivity_days_min') &&
      !/^\d+$/.test(conditionValue)
    )
      context.addIssue({
        code: 'custom',
        message: 'Informe um número inteiro igual ou maior que zero.',
        path: ['conditionValue'],
      })
  })
