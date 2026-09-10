import { z } from 'zod'

export const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe o nome da organização.')
    .max(120, 'Use no máximo 120 caracteres.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Informe um identificador.')
    .max(80, 'Use no máximo 80 caracteres.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens.'),
})

export type OrganizationInput = z.infer<typeof organizationSchema>

export function createOrganizationSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
