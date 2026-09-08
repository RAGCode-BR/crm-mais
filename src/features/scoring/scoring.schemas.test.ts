import { scoringRuleSchema } from './scoring.schemas'

describe('scoringRuleSchema', () => {
  it('accepts configurable positive and negative rules', () => {
    expect(
      scoringRuleSchema.safeParse({
        name: 'Sem atividade',
        description: '',
        ruleType: 'inactivity_days_min',
        conditionValue: '15',
        points: -15,
        isActive: true,
      }).success,
    ).toBe(true)
  })
  it('rejects a nonnumeric inactivity threshold', () => {
    expect(
      scoringRuleSchema.safeParse({
        name: 'Sem atividade',
        description: '',
        ruleType: 'inactivity_days_min',
        conditionValue: 'quinze',
        points: -15,
        isActive: true,
      }).success,
    ).toBe(false)
  })
})
