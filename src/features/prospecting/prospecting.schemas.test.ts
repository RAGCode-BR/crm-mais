import { describe, expect, it } from 'vitest'

import { bulkActivitySchema, prospectingListSchema } from './prospecting.schemas'

describe('prospecting schemas', () => {
  it('validates a prospecting list', () => {
    expect(
      prospectingListSchema.parse({
        name: 'Construção civil — São Paulo',
        description: 'Empresas para abordagem no trimestre.',
        ownerMemberId: '',
      }).name,
    ).toBe('Construção civil — São Paulo')
  })

  it('rejects an empty bulk activity subject', () => {
    expect(
      bulkActivitySchema.safeParse({ type: 'call', subject: ' ', description: '' }).success,
    ).toBe(false)
  })
})
