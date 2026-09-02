import { supabase } from '@/lib/supabase/client'

function requireSupabase() {
  if (!supabase) {
    throw new Error('A conexão pública com o Supabase ainda não foi configurada.')
  }

  return supabase
}

export async function signIn(email: string, password: string) {
  const { error } = await requireSupabase().auth.signInWithPassword({ email, password })

  if (error) throw error
}

export async function signUp(fullName: string, email: string, password: string) {
  const { data, error } = await requireSupabase().auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: window.location.origin,
    },
  })

  if (error) throw error

  return data.session !== null
}

export async function requestPasswordReset(email: string) {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  })

  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await requireSupabase().auth.updateUser({ password })

  if (error) throw error
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut()

  if (error) throw error
}

export function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Não foi possível concluir a solicitação.'

  const message = error.message.toLowerCase()

  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (message.includes('user already registered')) return 'Este e-mail já está cadastrado.'
  if (message.includes('password')) return 'A senha informada não atende aos requisitos.'

  return error.message
}
