import { OpenAiProvider } from './openai-provider.ts'
import type { AiProvider } from './types.ts'

export function createAiProvider(): AiProvider {
  const provider = (Deno.env.get('AI_PROVIDER') ?? 'openai').toLowerCase()
  if (provider === 'openai') {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    const model = Deno.env.get('OPENAI_MODEL')
    if (!apiKey || !model) {
      throw new Error(
        'A inteligência comercial ainda não foi configurada. Defina OPENAI_API_KEY e OPENAI_MODEL nos secrets do Supabase.',
      )
    }
    return new OpenAiProvider(apiKey, model)
  }
  throw new Error(`Provedor de IA não suportado: ${provider}.`)
}
