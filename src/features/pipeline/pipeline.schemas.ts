import { z } from 'zod'

export const stageSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'Informe o nome da etapa.').max(80),
    probability: z.number().int().min(0).max(100),
    isWon: z.boolean(),
    isLost: z.boolean(),
  })
  .refine((stage) => !(stage.isWon && stage.isLost), {
    message: 'Uma etapa não pode ser ganha e perdida ao mesmo tempo.',
    path: ['isWon'],
  })

export const pipelineSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome do pipeline.').max(120),
    description: z.string().trim().max(500),
    isDefault: z.boolean(),
    isActive: z.boolean(),
    stages: z.array(stageSchema).min(1, 'Adicione pelo menos uma etapa.').max(100),
  })
  .refine((pipeline) => !pipeline.isDefault || pipeline.isActive, {
    message: 'O pipeline padrão precisa permanecer ativo.',
    path: ['isActive'],
  })

export const opportunitySchema = z
  .object({
    title: z.string().trim().min(1, 'Informe o título.').max(160),
    companyId: z.string().min(1, 'Selecione a empresa.'),
    contactId: z.string(),
    leadId: z.string(),
    ownerMemberId: z.string(),
    pipelineId: z.string().min(1, 'Selecione o pipeline.'),
    stageId: z.string().min(1, 'Selecione a etapa.'),
    leadSourceId: z.string(),
    status: z.enum(['open', 'no_response', 'discarded', 'lost', 'reactivate_later', 'won']),
    estimatedValue: z.number().min(0, 'O valor não pode ser negativo.'),
    probability: z.number().int().min(0).max(100),
    expectedCloseDate: z.string(),
    productService: z.string().trim().max(160),
    description: z.string().trim().max(5000),
    lossReason: z.string().trim().max(250),
    closedAt: z.string(),
  })
  .refine((data) => data.status !== 'lost' || data.lossReason.trim().length > 0, {
    message: 'Informe o motivo da perda.',
    path: ['lossReason'],
  })
  .refine((data) => !data.contactId || data.companyId, {
    message: 'Selecione a empresa do contato.',
    path: ['companyId'],
  })

export const quickOpportunitySchema = z.object({
  companyName: z.string().trim().min(1, 'Informe o nome da empresa.').max(160),
  responsibleName: z.string().trim().max(160),
  contactPhone: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, '').length <= 30, 'Use no máximo 30 dígitos.'),
  estimatedValue: z.number('Informe um valor.').min(0, 'O valor não pode ser negativo.'),
  probability: z
    .number('Informe a probabilidade.')
    .int('Use um número inteiro.')
    .min(0, 'Use um valor entre 0 e 100.')
    .max(100, 'Use um valor entre 0 e 100.'),
  productService: z.string().trim().max(160),
  description: z.string().trim().max(5000),
})

export const responsibleSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do responsável.').max(160),
  jobTitle: z.string().trim().max(120),
  phone: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, '').length <= 30, 'Use no máximo 30 dígitos.'),
})
