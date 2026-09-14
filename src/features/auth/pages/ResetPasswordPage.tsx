import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

import { useAuth } from '../useAuth'
import { type ResetPasswordInput, resetPasswordSchema } from '../auth.schemas'
import { getAuthErrorMessage, signOut, updatePassword } from '../auth.service'
import { AuthNotice } from '../components/AuthNotice'
import { LoginBrandPanel } from '../components/LoginBrandPanel'

export function ResetPasswordPage() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)
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

  const linkIsInvalid = status === 'unauthenticated' || status === 'unconfigured'

  return (
    <main className="min-h-screen bg-white text-slate-950 lg:grid lg:grid-cols-[43%_57%]">
      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="w-full max-w-[28rem]">
          <BrandLogo className="mb-10 w-28 sm:w-32" />

          {linkIsInvalid ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-700">
                  <AlertTriangle aria-hidden="true" className="size-6" />
                </span>
                <h1 className="mt-4 text-xl font-semibold text-slate-950">
                  Link inválido ou expirado
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Solicite uma nova recuperação de senha para continuar.
                </p>
              </div>
              <Link
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 transition-colors hover:bg-blue-700"
                to="/recuperar-senha"
              >
                Solicitar novo link
              </Link>
              <p className="text-center text-sm text-slate-500">
                <Link
                  className="font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline"
                  to="/login"
                >
                  Voltar para o login
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Nova senha
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
                  Defina uma nova senha
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Escolha uma senha com pelo menos 8 caracteres.
                </p>
              </div>

              <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
                {submitError ? <AuthNotice message={submitError} /> : null}

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="password"
                  >
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      aria-describedby={
                        form.formState.errors.password ? 'password-error' : undefined
                      }
                      aria-invalid={Boolean(form.formState.errors.password)}
                      autoComplete="new-password"
                      className="h-11 border-slate-200 bg-white px-10 shadow-sm shadow-slate-950/[0.02] focus-visible:ring-blue-500"
                      id="password"
                      placeholder="Crie uma nova senha"
                      type={isPasswordVisible ? 'text' : 'password'}
                      {...form.register('password')}
                    />
                    <button
                      aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={() => setIsPasswordVisible((visible) => !visible)}
                      type="button"
                    >
                      {isPasswordVisible ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {form.formState.errors.password ? (
                    <p className="mt-2 text-sm text-red-600" id="password-error" role="alert">
                      {form.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="confirmPassword"
                  >
                    Confirmar nova senha
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
                      placeholder="Repita a nova senha"
                      type={isConfirmVisible ? 'text' : 'password'}
                      {...form.register('confirmPassword')}
                    />
                    <button
                      aria-label={isConfirmVisible ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={() => setIsConfirmVisible((visible) => !visible)}
                      type="button"
                    >
                      {isConfirmVisible ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword ? (
                    <p
                      className="mt-2 text-sm text-red-600"
                      id="confirmPassword-error"
                      role="alert"
                    >
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>

                <Button
                  className="h-11 w-full rounded-lg bg-blue-600 font-semibold shadow-sm shadow-blue-700/20 hover:bg-blue-700 hover:opacity-100 focus-visible:ring-blue-500"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  {form.formState.isSubmitting ? <Spinner label="Atualizando senha" /> : null}
                  {form.formState.isSubmitting ? 'Atualizando...' : 'Atualizar senha'}
                  {!form.formState.isSubmitting ? <ArrowRight className="size-4" /> : null}
                </Button>
              </form>

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
