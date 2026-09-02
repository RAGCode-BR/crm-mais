import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

import { useAuth } from '../useAuth'
import { type ResetPasswordInput, resetPasswordSchema } from '../auth.schemas'
import { getAuthErrorMessage, signOut, updatePassword } from '../auth.service'
import { AuthFormField } from '../components/AuthFormField'
import { AuthLayout } from '../components/AuthLayout'
import { AuthNotice } from '../components/AuthNotice'

export function ResetPasswordPage() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { confirmPassword: '', password: '' },
  })

  async function handleSubmit(values: ResetPasswordInput) {
    setSubmitError(null)

    try {
      await updatePassword(values.password)
      await signOut()
      navigate('/login', {
        replace: true,
        state: { message: 'Senha atualizada. Entre novamente com sua nova senha.' },
      })
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error))
    }
  }

  return (
    <AuthLayout
      title="Defina uma nova senha"
      description="Escolha uma senha com pelo menos oito caracteres."
      footer={
        <Link className="font-medium text-primary hover:underline" to="/login">
          Voltar para o login
        </Link>
      }
    >
      {status === 'unauthenticated' || status === 'unconfigured' ? (
        <AuthNotice message="Este link é inválido ou expirou. Solicite uma nova recuperação de senha." />
      ) : (
        <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
          {submitError ? <AuthNotice message={submitError} /> : null}
          <AuthFormField
            autoComplete="new-password"
            error={form.formState.errors.password?.message}
            label="Nova senha"
            type="password"
            {...form.register('password')}
          />
          <AuthFormField
            autoComplete="new-password"
            error={form.formState.errors.confirmPassword?.message}
            label="Confirmar nova senha"
            type="password"
            {...form.register('confirmPassword')}
          />
          <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? <Spinner label="Atualizando senha" /> : null}
            Atualizar senha
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
