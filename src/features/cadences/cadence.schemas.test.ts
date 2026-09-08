import { describe, expect, it } from 'vitest'

import { cadenceSchema } from './cadence.schemas'

describe('cadence schema', () => {
  it('accepts an ordered multichannel cadence', () => {
    expect(
      cadenceSchema.safeParse({
        name: 'Novos clientes',
        description: '',
        status: 'active',
        steps: [
          { dayNumber: 1, type: 'email', title: 'E-mail inicial', description: '' },
          { dayNumber: 2, type: 'whatsapp', title: 'WhatsApp', description: '' },
        ],
      }).success,
    ).toBe(true)
  })

  it('rejects steps whose days move backwards', () => {
    expect(
      cadenceSchema.safeParse({
        name: 'Inválida',
        description: '',
        status: 'draft',
        steps: [
          { dayNumber: 4, type: 'call', title: 'Ligação', description: '' },
          { dayNumber: 2, type: 'email', title: 'E-mail', description: '' },
        ],
      }).success,
    ).toBe(false)
  })
})
