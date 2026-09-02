import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

import { useAuth } from '../useAuth'
import { type RegisterInput, registerSchema } from '../auth.schemas'
import { getAuthErrorMessage, signUp } from '../auth.service'
import { AuthFormField } from '../components/AuthFormField'
import { AuthLayout } from '../components/AuthLayout'
import { AuthNotice } from '../components/AuthNotice'

export function RegisterPage() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { confirmPassword: '', email: '', fullName: '', password: '' },
  })

  async function handleSubmit(values: RegisterInput) {
    setSubmitError(null)

    try {
      const hasSession = await signUp(values.fullName, values.email, values.password)

      if (hasSession) {
        navigate('/organizacoes', { replace: true })
      } else {
        setConfirmationSent(true)
      }
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error))
    }
  }

  return (
    <AuthLayout
      title="Crie sua conta"
      description="Seu perfil será criado com segurança e poderá participar de mais de uma organização."
      footer={
        <>
          Já possui conta?{' '}
          <Link className="font-medium text-primary hover:underline" to="/login">
            Entrar
          </Link>
        </>
      }
    >
      {confirmationSent ? (
        <div className="space-y-5">
          <AuthNotice
            message="Cadastro realizado. Confira seu e-mail para confirmar a conta e depois faça login."
            tone="success"
          />
          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
            to="/login"
          >
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
          {status === 'unconfigured' ? (
            <AuthNotice message="Configure as variáveis públicas do Supabase para habilitar o cadastro." />
          ) : null}
          {submitError ? <AuthNotice message={submitError} /> : null}

          <AuthFormField
            autoComplete="name"
            error={form.formState.errors.fullName?.message}
            label="Nome completo"
            {...form.register('fullName')}
          />
          <AuthFormField
            autoComplete="email"
            error={form.formState.errors.email?.message}
            label="E-mail"
            type="email"
            {...form.register('email')}
          />
          <AuthFormField
            autoComplete="new-password"
            error={form.formState.errors.password?.message}
            label="Senha"
            type="password"
            {...form.register('password')}
          />
          <AuthFormField
            autoComplete="new-password"
            error={form.formState.errors.confirmPassword?.message}
            label="Confirmar senha"
            type="password"
            {...form.register('confirmPassword')}
          />

          <Button
            className="w-full"
            disabled={form.formState.isSubmitting || status === 'unconfigured'}
            type="submit"
          >
            {form.formState.isSubmitting ? <Spinner label="Criando conta" /> : null}
            Criar conta
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
