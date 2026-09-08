import { dashboardPeriodSchema } from './dashboard.schemas'

describe('dashboardPeriodSchema', () => {
  it('accepts a valid commercial period', () => {
    expect(dashboardPeriodSchema.safeParse({ from: '2026-08-01', to: '2026-09-03' }).success).toBe(
      true,
    )
  })

  it('rejects inverted and excessively long periods', () => {
    expect(dashboardPeriodSchema.safeParse({ from: '2026-09-03', to: '2026-08-01' }).success).toBe(
      false,
    )
    expect(dashboardPeriodSchema.safeParse({ from: '2025-01-01', to: '2026-09-03' }).success).toBe(
      false,
    )
  })
})
