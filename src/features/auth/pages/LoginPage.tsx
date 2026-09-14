import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { BrandLogo } from '@/components/shared/BrandLogo'

import { useAuth } from '../useAuth'
import { type LoginInput, loginSchema } from '../auth.schemas'
import { getAuthErrorMessage, signIn } from '../auth.service'
import { AuthNotice } from '../components/AuthNotice'
import { LoginBrandPanel } from '../components/LoginBrandPanel'

type LoginLocationState = {
  from?: string
  message?: string
}

export function LoginPage() {
  const { status } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
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
    <main className="min-h-screen bg-white text-slate-950 lg:grid lg:grid-cols-[43%_57%]">
      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="w-full max-w-[28rem]">
          <BrandLogo className="mb-10 w-28 sm:w-32" />

          <div className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Bem-vindo de volta
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
              Entre na sua conta
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Acesse sua organização e continue suas atividades comerciais.
            </p>
          </div>

          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            {status === 'unconfigured' ? (
              <AuthNotice message="Configure as variáveis públicas do Supabase para habilitar o acesso." />
            ) : null}
            {locationState?.message ? (
              <AuthNotice message={locationState.message} tone="success" />
            ) : null}
            {submitError ? <AuthNotice message={submitError} /> : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <Input
                  aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
                  aria-invalid={Boolean(form.formState.errors.email)}
                  autoComplete="email"
                  className="h-11 border-slate-200 bg-white pl-10 shadow-sm shadow-slate-950/[0.02] focus-visible:ring-blue-500"
                  id="email"
                  placeholder="nome@empresa.com"
                  type="email"
                  {...form.register('email')}
                />
              </div>
              {form.formState.errors.email ? (
                <p className="mt-2 text-sm text-red-600" id="email-error" role="alert">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <Input
                  aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
                  aria-invalid={Boolean(form.formState.errors.password)}
                  autoComplete="current-password"
                  className="h-11 border-slate-200 bg-white px-10 shadow-sm shadow-slate-950/[0.02] focus-visible:ring-blue-500"
                  id="password"
                  placeholder="Digite sua senha"
                  type={isPasswordVisible ? 'text' : 'password'}
                  {...form.register('password')}
                />
                <button
                  aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  type="button"
                >
                  {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.password ? (
                <p className="mt-2 text-sm text-red-600" id="password-error" role="alert">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-xs text-slate-500">
                Sua sessão permanece ativa neste dispositivo.
              </span>
              <Link
                className="shrink-0 font-medium text-blue-700 transition-colors hover:text-blue-800 hover:underline"
                to="/recuperar-senha"
              >
                Esqueci minha senha
              </Link>
            </div>

            <Button
              className="h-11 w-full rounded-lg bg-blue-600 font-semibold shadow-sm shadow-blue-700/20 hover:bg-blue-700 hover:opacity-100 focus-visible:ring-blue-500"
              disabled={form.formState.isSubmitting || status === 'unconfigured'}
              type="submit"
            >
              {form.formState.isSubmitting ? <Spinner label="Entrando" /> : null}
              {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
              {!form.formState.isSubmitting ? <ArrowRight className="size-4" /> : null}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">ou</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-500">
            Ainda não possui conta?{' '}
            <Link
              className="font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline"
              to="/cadastro"
            >
              Criar conta
            </Link>
          </p>

          <p className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck aria-hidden="true" className="size-4" /> Seus dados estão protegidos e
            seguros.
          </p>
        </div>
      </section>
      <LoginBrandPanel />
    </main>
  )
}
