import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

import { type ForgotPasswordInput, forgotPasswordSchema } from '../auth.schemas'
import { getAuthErrorMessage, requestPasswordReset } from '../auth.service'
import { AuthFormField } from '../components/AuthFormField'
import { AuthLayout } from '../components/AuthLayout'
import { AuthNotice } from '../components/AuthNotice'

export function ForgotPasswordPage() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function handleSubmit(values: ForgotPasswordInput) {
    setSubmitError(null)

    try {
      await requestPasswordReset(values.email)
      setSent(true)
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error))
    }
  }

  return (
    <AuthLayout
      title="Recupere seu acesso"
      description="Enviaremos um link seguro para você definir uma nova senha."
      footer={
        <Link className="font-medium text-primary hover:underline" to="/login">
          Voltar para o login
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
        {sent ? (
          <AuthNotice
            message="Se o e-mail estiver cadastrado, você receberá as instruções de recuperação."
            tone="success"
          />
        ) : null}
        {submitError ? <AuthNotice message={submitError} /> : null}

        <AuthFormField
          autoComplete="email"
          error={form.formState.errors.email?.message}
          label="E-mail"
          type="email"
          {...form.register('email')}
        />
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? <Spinner label="Enviando" /> : null}
          Enviar link de recuperação
        </Button>
      </form>
    </AuthLayout>
  )
}
