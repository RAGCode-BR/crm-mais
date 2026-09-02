import { z } from 'zod'

const supabaseEnvironmentSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})

const parsedEnvironment = supabaseEnvironmentSchema.safeParse(import.meta.env)

export const supabaseConfig = parsedEnvironment.success ? parsedEnvironment.data : null
export const isSupabaseConfigured = supabaseConfig !== null
