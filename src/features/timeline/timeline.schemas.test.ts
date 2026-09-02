import { describe, expect, it } from 'vitest'
import { activitySchema } from './timeline.schemas'

describe('timeline activity validation', () => {
  it('accepts supported manual activities', () => {
    expect(
      activitySchema.safeParse({
        type: 'whatsapp',
        subject: 'Contato realizado',
        description: '',
        occurredAt: '2026-09-02T10:00',
        companyId: '',
        contactId: '',
        leadId: '',
        opportunityId: '',
      }).success,
    ).toBe(true)
  })

  it('does not allow clients to manually create protected history types', () => {
    expect(
      activitySchema.safeParse({
        type: 'stage_change',
        subject: 'Movido',
        description: '',
        occurredAt: '2026-09-02T10:00',
        companyId: '',
        contactId: '',
        leadId: '',
        opportunityId: '',
      }).success,
    ).toBe(false)
  })
})
