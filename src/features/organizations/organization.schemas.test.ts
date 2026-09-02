import { createOrganizationSlug, organizationSchema } from './organization.schemas'

describe('organization schema', () => {
  it('creates a normalized slug from a display name', () => {
    expect(createOrganizationSlug('Clínica São José & Filhos')).toBe('clinica-sao-jose-filhos')
  })

  it('accepts safe identifiers and rejects uppercase or repeated separators', () => {
    expect(organizationSchema.safeParse({ name: 'Empresa ABC', slug: 'empresa-abc' }).success).toBe(
      true,
    )
    expect(
      organizationSchema.safeParse({ name: 'Empresa ABC', slug: 'Empresa--ABC' }).success,
    ).toBe(false)
  })
})
