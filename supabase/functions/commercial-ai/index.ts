import { createClient } from 'npm:@supabase/supabase-js@2.114.0'

import type { EdgeDatabase } from '../_shared/database.ts'
import { loadCommercialContext, loadCompanyContext } from '../_shared/ai/context.ts'
import { buildPrompt, responseSchema } from '../_shared/ai/prompt.ts'
import { createAiProvider } from '../_shared/ai/provider.ts'
import type { AiMode } from '../_shared/ai/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const modes = new Set<AiMode>(['company_summary', 'commercial_assistant', 'next_best_action'])
const safeActionPath = /^\/(?:empresas|leads|oportunidades|tarefas)(?:\/|$)/

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function publishableKey() {
  const keys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')
  if (keys) return (JSON.parse(keys) as Record<string, string>).default
  return Deno.env.get('SUPABASE_ANON_KEY')
}

async function safetyIdentifier(userId: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (request: Request) => {
  const requestId = crypto.randomUUID()
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  try {
    const authorization = request.headers.get('Authorization')
    const url = Deno.env.get('SUPABASE_URL')
    const key = publishableKey()
    if (!authorization || !url || !key) return json({ error: 'Não autorizado.' }, 401)
    const token = authorization.replace(/^Bearer\s+/i, '')
    const db = createClient<EdgeDatabase>(url, key, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: authData, error: authError } = await db.auth.getUser(token)
    if (authError || !authData.user) return json({ error: 'Sessão inválida.' }, 401)

    const body = (await request.json()) as Record<string, unknown>
    const mode = body.mode as AiMode
    const organizationId = typeof body.organizationId === 'string' ? body.organizationId : ''
    const companyId = typeof body.companyId === 'string' ? body.companyId : ''
    const question = typeof body.question === 'string' ? body.question.trim() : undefined
    if (!modes.has(mode) || !uuid.test(organizationId))
      return json({ error: 'Solicitação inválida.' }, 400)
    if (mode === 'company_summary' && !uuid.test(companyId))
      return json({ error: 'Empresa inválida.' }, 400)
    if (mode === 'commercial_assistant' && (!question || question.length > 500))
      return json({ error: 'Informe uma pergunta com até 500 caracteres.' }, 400)

    const context =
      mode === 'company_summary'
        ? await loadCompanyContext(db, organizationId, companyId)
        : await loadCommercialContext(db, organizationId)
    const provider = createAiProvider()
    const prompt = buildPrompt(mode, context, question)
    const result = await provider.generate({
      ...prompt,
      schema: responseSchema,
      safetyIdentifier: await safetyIdentifier(authData.user.id),
    })
    const guidance = result.data as {
      title: string
      answer: string
      evidence: string[]
      suggestedActions: Array<{ label: string; path: string; reason: string }>
    }
    return json({
      ...guidance,
      suggestedActions: (guidance.suggestedActions ?? [])
        .filter(
          (action) =>
            typeof action.label === 'string' &&
            typeof action.reason === 'string' &&
            typeof action.path === 'string' &&
            safeActionPath.test(action.path) &&
            !action.path.startsWith('//'),
        )
        .map((action) => ({ ...action, requiresConfirmation: true })),
      generatedAt: new Date().toISOString(),
      provider: provider.name,
      model: result.model,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Falha inesperada na análise comercial.'
    const status = message.includes('não foi configurada') ? 503 : 500
    console.error(`[commercial-ai:${requestId}]`, error)
    return json(
      {
        error:
          status === 503
            ? 'O assistente comercial está temporariamente indisponível.'
            : 'Não foi possível concluir a análise comercial.',
        requestId,
      },
      status,
    )
  }
})
