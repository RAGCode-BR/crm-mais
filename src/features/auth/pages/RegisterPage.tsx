import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, Lock, Mail, MailCheck, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

import { useAuth } from '../useAuth'
import { type RegisterInput, registerSchema } from '../auth.schemas'
import { getAuthErrorMessage, signUp } from '../auth.service'
import { AuthNotice } from '../components/AuthNotice'
import { LoginBrandPanel } from '../components/LoginBrandPanel'

export function RegisterPage() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)
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
        setSentEmail(values.email)
      }
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error))
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950 lg:grid lg:grid-cols-[43%_57%]">
      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="w-full max-w-[28rem]">
          <BrandLogo className="mb-10 w-28 sm:w-32" />

          {sentEmail ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <MailCheck aria-hidden="true" className="size-6" />
                </span>
                <h1 className="mt-4 text-xl font-semibold text-slate-950">Confira seu e-mail</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enviamos um link de confirmação para <strong>{sentEmail}</strong>. Abra-o para
                  ativar sua conta e depois faça login.
                </p>
              </div>
              <Link
                className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.02] transition-colors hover:bg-slate-50"
                to="/login"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Comece agora
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
                  Crie sua conta
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Seu perfil pode participar de mais de uma organização, cada uma com seus próprios
                  dados e permissões.
                </p>
              </div>

              <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
                {status === 'unconfigured' ? (
                  <AuthNotice message="Configure as variáveis públicas do Supabase para habilitar o cadastro." />
                ) : null}
                {submitError ? <AuthNotice message={submitError} /> : null}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="fullName">
                    Nome completo
                  </label>
                  <div className="relative">
                    <UserRound
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      aria-describedby={form.formState.errors.fullName ? 'fullName-error' : undefined}
                      aria-invalid={Boolean(form.formState.errors.fullName)}
                      autoComplete="name"
                      className="h-11 border-slate-200 bg-white pl-10 shadow-sm shadow-slate-950/[0.02] focus-visible:ring-blue-500"
                      id="fullName"
                      placeholder="Como podemos te chamar"
                      {...form.register('fullName')}
                    />
                  </div>
                  {form.formState.errors.fullName ? (
                    <p className="mt-2 text-sm text-red-600" id="fullName-error" role="alert">
                      {form.formState.errors.fullName.message}
                    </p>
                  ) : null}
                </div>

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
                      aria-describedby={
                        form.formState.errors.password ? 'password-error' : 'password-hint'
                      }
                      aria-invalid={Boolean(form.formState.errors.password)}
                      autoComplete="new-password"
                      className="h-11 border-slate-200 bg-white px-10 shadow-sm shadow-slate-950/[0.02] focus-visible:ring-blue-500"
                      id="password"
                      placeholder="Crie uma senha"
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
                  ) : (
                    <p className="mt-2 text-xs text-slate-400" id="password-hint">
                      Use pelo menos 8 caracteres.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="confirmPassword"
                  >
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      aria-describedby={
                        form.formState.errors.confirmPassword ? 'confirmPassword-error' : undefined
                      }
                      aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                      autoComplete="new-password"
                      className="h-11 border-slate-200 bg-white px-10 shadow-sm shadow-slate-950/[0.02] focus-visible:ring-blue-500"
                      id="confirmPassword"
                      placeholder="Repita a senha"
                      type={isConfirmVisible ? 'text' : 'password'}
                      {...form.register('confirmPassword')}
                    />
                    <button
                      aria-label={isConfirmVisible ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={() => setIsConfirmVisible((visible) => !visible)}
                      type="button"
                    >
                      {isConfirmVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword ? (
                    <p className="mt-2 text-sm text-red-600" id="confirmPassword-error" role="alert">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>

                <Button
                  className="h-11 w-full rounded-lg bg-blue-600 font-semibold shadow-sm shadow-blue-700/20 hover:bg-blue-700 hover:opacity-100 focus-visible:ring-blue-500"
                  disabled={form.formState.isSubmitting || status === 'unconfigured'}
                  type="submit"
                >
                  {form.formState.isSubmitting ? <Spinner label="Criando conta" /> : null}
                  {form.formState.isSubmitting ? 'Criando conta...' : 'Criar conta'}
                  {!form.formState.isSubmitting ? <ArrowRight className="size-4" /> : null}
                </Button>
              </form>

              <div aria-hidden="true" className="my-7 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">ou</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <p className="text-center text-sm text-slate-500">
                Já possui conta?{' '}
                <Link
                  className="font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline"
                  to="/login"
                >
                  Entrar
                </Link>
              </p>

              <p className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck aria-hidden="true" className="size-4" /> Seus dados estão protegidos e
                seguros.
              </p>
            </>
          )}
        </div>
      </section>
      <LoginBrandPanel />
    </main>
  )
}
