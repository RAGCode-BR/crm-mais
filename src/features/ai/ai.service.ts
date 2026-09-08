import { supabase } from '@/lib/supabase/client'

import { aiResponseSchema } from './ai.schemas'
import type { AiRequest, AiResponse } from './ai.types'

export async function requestCommercialAi(request: AiRequest): Promise<AiResponse> {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  const { data, error } = await supabase.functions.invoke('commercial-ai', { body: request })
  if (error) {
    const context = 'context' in error ? error.context : undefined
    if (context instanceof Response) {
      const payload = (await context.json().catch(() => null)) as { error?: string } | null
      if (payload?.error) throw new Error(payload.error)
    }
    throw error
  }
  const parsed = aiResponseSchema.safeParse(data)
  if (!parsed.success) throw new Error('A resposta da inteligência comercial é inválida.')
  return parsed.data
}
