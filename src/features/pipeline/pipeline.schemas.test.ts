import { describe, expect, it } from 'vitest'
import { opportunitySchema, pipelineSchema } from './pipeline.schemas'

describe('pipeline validation', () => {
  it('accepts a configured pipeline', () => {
    expect(
      pipelineSchema.safeParse({
        name: 'Comercial',
        description: '',
        isDefault: true,
        isActive: true,
        stages: [{ name: 'Novo', probability: 10, isWon: false, isLost: false }],
      }).success,
    ).toBe(true)
  })

  it('rejects an empty pipeline and contradictory outcome stage', () => {
    expect(
      pipelineSchema.safeParse({
        name: '',
        description: '',
        isDefault: false,
        isActive: true,
        stages: [],
      }).success,
    ).toBe(false)
    expect(
      pipelineSchema.safeParse({
        name: 'X',
        description: '',
        isDefault: false,
        isActive: true,
        stages: [{ name: 'Final', probability: 100, isWon: true, isLost: true }],
      }).success,
    ).toBe(false)
  })

  it('requires a reason for a lost opportunity', () => {
    const base = {
      title: 'Contrato',
      companyId: 'company',
      contactId: '',
      leadId: '',
      ownerMemberId: '',
      pipelineId: 'pipeline',
      stageId: 'stage',
      leadSourceId: '',
      status: 'lost' as const,
      estimatedValue: 1000,
      probability: 0,
      expectedCloseDate: '',
      productService: '',
      description: '',
      lossReason: '',
      closedAt: '',
    }
    expect(opportunitySchema.safeParse(base).success).toBe(false)
    expect(opportunitySchema.safeParse({ ...base, lossReason: 'Preço' }).success).toBe(true)
  })
})
