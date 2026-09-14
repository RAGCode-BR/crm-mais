import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Mail, MailCheck, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

import { type ForgotPasswordInput, forgotPasswordSchema } from '../auth.schemas'
import { getAuthErrorMessage, requestPasswordReset } from '../auth.service'
import { AuthNotice } from '../components/AuthNotice'
import { LoginBrandPanel } from '../components/LoginBrandPanel'

export function ForgotPasswordPage() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function handleSubmit(values: ForgotPasswordInput) {
    setSubmitError(null)

    try {
      await requestPasswordReset(values.email)
      setSentEmail(values.email)
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
                  Se <strong>{sentEmail}</strong> estiver cadastrado, você receberá um link seguro
                  para definir uma nova senha.
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
                  Recuperar acesso
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
                  Recupere seu acesso
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Informe o e-mail da sua conta e enviaremos um link seguro para definir uma nova
                  senha.
                </p>
              </div>

              <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
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

                <Button
                  className="h-11 w-full rounded-lg bg-blue-600 font-semibold shadow-sm shadow-blue-700/20 hover:bg-blue-700 hover:opacity-100 focus-visible:ring-blue-500"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  {form.formState.isSubmitting ? <Spinner label="Enviando" /> : null}
                  {form.formState.isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
                  {!form.formState.isSubmitting ? <ArrowRight className="size-4" /> : null}
                </Button>
              </form>

              <div aria-hidden="true" className="my-7 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">ou</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <p className="text-center text-sm text-slate-500">
                Lembrou sua senha?{' '}
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
