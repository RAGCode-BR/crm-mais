import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

import { useAuth } from '../useAuth'
import { type LoginInput, loginSchema } from '../auth.schemas'
import { getAuthErrorMessage, signIn } from '../auth.service'
import { AuthFormField } from '../components/AuthFormField'
import { AuthLayout } from '../components/AuthLayout'
import { AuthNotice } from '../components/AuthNotice'

type LoginLocationState = {
  from?: string
  message?: string
}

export function LoginPage() {
  const { status } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const locationState = location.state as LoginLocationState | null
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function handleSubmit(values: LoginInput) {
    setSubmitError(null)

    try {
      await signIn(values.email, values.password)
      navigate(locationState?.from ?? '/', { replace: true })
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error))
    }
  }

  return (
    <AuthLayout
      title="Entre na sua conta"
      description="Acesse suas organizações e continue o trabalho comercial."
      footer={
        <>
          Ainda não possui conta?{' '}
          <Link className="font-medium text-primary hover:underline" to="/cadastro">
            Criar conta
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
        {status === 'unconfigured' ? (
          <AuthNotice message="Configure as variáveis públicas do Supabase para habilitar o acesso." />
        ) : null}
        {locationState?.message ? (
          <AuthNotice message={locationState.message} tone="success" />
        ) : null}
        {submitError ? <AuthNotice message={submitError} /> : null}

        <AuthFormField
          autoComplete="email"
          error={form.formState.errors.email?.message}
          label="E-mail"
          type="email"
          {...form.register('email')}
        />
        <div>
          <AuthFormField
            autoComplete="current-password"
            error={form.formState.errors.password?.message}
            label="Senha"
            type="password"
            {...form.register('password')}
          />
          <div className="mt-2 text-right">
            <Link className="text-sm text-primary hover:underline" to="/recuperar-senha">
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={form.formState.isSubmitting || status === 'unconfigured'}
          type="submit"
        >
          {form.formState.isSubmitting ? <Spinner label="Entrando" /> : null}
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}
