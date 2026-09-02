import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schemas'

describe('auth schemas', () => {
  it('accepts valid login and recovery inputs', () => {
    expect(
      loginSchema.safeParse({ email: 'user@example.com', password: 'secure123' }).success,
    ).toBe(true)
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })

  it('rejects invalid emails and short passwords', () => {
    expect(loginSchema.safeParse({ email: 'invalid', password: '123' }).success).toBe(false)
  })

  it('requires matching passwords for registration and reset', () => {
    expect(
      registerSchema.safeParse({
        confirmPassword: 'different123',
        email: 'user@example.com',
        fullName: 'Usuário Teste',
        password: 'secure123',
      }).success,
    ).toBe(false)
    expect(
      resetPasswordSchema.safeParse({
        confirmPassword: 'different123',
        password: 'secure123',
      }).success,
    ).toBe(false)
  })
})
