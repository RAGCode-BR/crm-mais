import { z } from 'zod'

export const organizationSettingsSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da organização.').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})

export const catalogItemSchema = z.object({
  name: z.string().trim().min(2, 'Informe um nome.').max(100),
  description: z.string().trim().max(500),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
})

export const inviteMemberSchema = z.object({
  email: z.email('Informe um e-mail válido.').trim().toLowerCase().max(254),
  role: z.enum(['owner', 'admin', 'manager', 'sales', 'viewer']),
  teamId: z.union([z.uuid(), z.literal('')]),
})

export const profileSettingsSchema = z.object({
  full_name: z.string().trim().min(2, 'Informe seu nome.').max(120),
  phone: z.string().trim().max(30).nullable(),
  timezone: z.enum(['America/Sao_Paulo', 'America/Manaus', 'America/Rio_Branco', 'UTC']),
  locale: z.enum(['pt-BR', 'en-US', 'es']),
})
