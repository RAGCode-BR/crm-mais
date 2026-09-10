import { z } from 'zod'

const email = z.email('Informe um e-mail válido.').max(254, 'Use no máximo 254 caracteres.')
const password = z
  .string()
  .min(8, 'Use pelo menos 8 caracteres.')
  .max(128, 'Use no máximo 128 caracteres.')

export const loginSchema = z.object({
  email,
  password,
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Informe seu nome completo.')
      .max(120, 'Use no máximo 120 caracteres.'),
    email,
    password,
    confirmPassword: z.string().max(128, 'Use no máximo 128 caracteres.'),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().max(128, 'Use no máximo 128 caracteres.'),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
