import { z } from 'zod'

const optionalEmail = z.union([z.literal(''), z.email('Informe um e-mail válido.')])
const optionalUrl = z.union([z.literal(''), z.url('Informe uma URL completa e válida.')])
const requiredText = (label: string) => z.string().trim().min(1, `${label} é obrigatório.`)

export const companySchema = z.object({
  tradeName: requiredText('Nome fantasia'),
  legalName: z.string(),
  taxId: z.string(),
  industry: z.string(),
  companySize: z.string(),
  employeeCount: z.number().int().min(0).nullable(),
  website: optionalUrl,
  phone: z.string(),
  email: optionalEmail,
  city: z.string(),
  state: z.string(),
  countryCode: z.string().trim().length(2, 'Use o código do país com 2 letras.'),
  notes: z.string(),
  ownerMemberId: z.string(),
  leadSourceId: z.string(),
  status: z.enum(['prospect', 'active', 'inactive', 'archived']),
})

export const contactSchema = z.object({
  companyId: requiredText('Empresa'),
  firstName: requiredText('Nome'),
  lastName: z.string(),
  jobTitle: z.string(),
  department: z.string(),
  phone: z.string(),
  whatsapp: z.string(),
  email: optionalEmail,
  linkedinUrl: optionalUrl,
  isPrimary: z.boolean(),
  notes: z.string(),
})

export const leadSchema = z
  .object({
    name: requiredText('Nome'),
    companyId: z.string(),
    contactId: z.string(),
    ownerMemberId: z.string(),
    leadSourceId: z.string(),
    email: optionalEmail,
    phone: z.string(),
    status: z.enum([
      'new',
      'researching',
      'contacted',
      'qualified',
      'unqualified',
      'converted',
      'archived',
    ]),
    temperature: z.enum(['cold', 'warm', 'hot']),
    score: z.number().int().min(0, 'O score mínimo é 0.').max(100, 'O score máximo é 100.'),
    nextAction: z.string(),
    nextContactAt: z.string(),
    notes: z.string(),
  })
  .refine((data) => !data.contactId || data.companyId, {
    path: ['companyId'],
    message: 'Selecione a empresa do contato.',
  })

export const normalizeEmail = (value: string) => value.trim().toLowerCase()
export const normalizeDigits = (value: string) => value.replace(/\D/g, '')
export const emptyToNull = (value: string) => value.trim() || null
export const safeSearch = (value: string) =>
  value
    .trim()
    .replace(/[,%()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
