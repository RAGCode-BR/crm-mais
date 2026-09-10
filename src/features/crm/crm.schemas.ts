import { z } from 'zod'

const optionalEmail = z.union([
  z.literal(''),
  z.email('Informe um e-mail válido.').max(254, 'Use no máximo 254 caracteres.'),
])
const optionalUrl = z.union([
  z.literal(''),
  z.url('Informe uma URL completa e válida.').max(2048, 'Use no máximo 2048 caracteres.'),
])
const requiredText = (label: string, maximum = 120) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(maximum, `Use no máximo ${maximum} caracteres.`)
const text = (maximum: number) =>
  z.string().trim().max(maximum, `Use no máximo ${maximum} caracteres.`)

export const companySchema = z.object({
  tradeName: requiredText('Nome fantasia'),
  legalName: text(160),
  taxId: text(32),
  industry: text(120),
  companySize: text(50),
  employeeCount: z.number().int().min(0).nullable(),
  website: optionalUrl,
  phone: text(30),
  email: optionalEmail,
  city: text(100),
  state: text(100),
  countryCode: z.string().trim().length(2, 'Use o código do país com 2 letras.'),
  notes: text(5000),
  ownerMemberId: z.string(),
  leadSourceId: z.string(),
  status: z.enum(['prospect', 'active', 'inactive', 'archived']),
})

export const contactSchema = z.object({
  companyId: requiredText('Empresa'),
  firstName: requiredText('Nome', 80),
  lastName: text(120),
  jobTitle: text(120),
  department: text(120),
  phone: text(30),
  whatsapp: text(30),
  email: optionalEmail,
  linkedinUrl: optionalUrl,
  isPrimary: z.boolean(),
  notes: text(5000),
})

export const leadSchema = z
  .object({
    name: requiredText('Nome', 120),
    companyId: z.string(),
    contactId: z.string(),
    ownerMemberId: z.string(),
    leadSourceId: z.string(),
    email: optionalEmail,
    phone: text(30),
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
    nextAction: text(500),
    nextContactAt: z.string(),
    notes: text(5000),
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
