import { describe, expect, it } from 'vitest'

import {
  catalogItemSchema,
  inviteMemberSchema,
  organizationSettingsSchema,
  profileSettingsSchema,
} from './settings.schemas'

describe('settings schemas', () => {
  it('normalizes organization and invitation inputs', () => {
    expect(organizationSettingsSchema.parse({ name: ' ACME ', slug: 'acme-br ' })).toEqual({
      name: 'ACME',
      slug: 'acme-br',
    })
    expect(
      inviteMemberSchema.parse({ email: 'USER@EXAMPLE.COM', role: 'sales', teamId: '' }).email,
    ).toBe('user@example.com')
  })

  it('rejects invalid catalog colors and elevated unknown roles', () => {
    expect(
      catalogItemSchema.safeParse({ name: 'Tag', description: '', color: 'blue' }).success,
    ).toBe(false)
    expect(
      inviteMemberSchema.safeParse({ email: 'a@example.com', role: 'superadmin', teamId: '' })
        .success,
    ).toBe(false)
  })

  it('accepts only supported personal preferences', () => {
    expect(
      profileSettingsSchema.safeParse({
        full_name: 'Ana Lima',
        phone: null,
        timezone: 'UTC',
        locale: 'pt-BR',
      }).success,
    ).toBe(true)
    expect(
      profileSettingsSchema.safeParse({
        full_name: 'Ana Lima',
        phone: null,
        timezone: 'Invalid',
        locale: 'pt-BR',
      }).success,
    ).toBe(false)
  })
})
