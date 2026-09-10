import { createClient } from 'npm:@supabase/supabase-js@2.114.0'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.114.0'

import type { EdgeDatabase } from '../_shared/database.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const roles = new Set(['owner', 'admin', 'manager', 'sales', 'viewer'])

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

async function findUserByEmail(admin: SupabaseClient<EdgeDatabase>, email: string) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    const match = data.users.find((item) => item.email?.toLowerCase() === email)
    if (match) return match
    if (data.users.length < 100) return undefined
  }
  throw new Error('Limite de usuários atingido durante a busca do convite.')
}

Deno.serve(async (request: Request) => {
  const requestId = crypto.randomUUID()
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  try {
    const authorization = request.headers.get('Authorization')
    const url = Deno.env.get('SUPABASE_URL')
    const publicKey = publishableKey()
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!authorization || !url || !publicKey || !serviceKey)
      return json({ error: 'Serviço não configurado.' }, 503)

    const token = authorization.replace(/^Bearer\s+/i, '')
    const caller = createClient<EdgeDatabase>(url, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: authData, error: authError } = await caller.auth.getUser(token)
    if (authError || !authData.user) return json({ error: 'Sessão inválida.' }, 401)

    const body = (await request.json()) as Record<string, unknown>
    const organizationId = typeof body.organizationId === 'string' ? body.organizationId : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const role = typeof body.role === 'string' ? body.role : ''
    const teamId = typeof body.teamId === 'string' ? body.teamId : null
    if (
      !uuid.test(organizationId) ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      !roles.has(role) ||
      (teamId && !uuid.test(teamId))
    )
      return json({ error: 'Dados do convite inválidos.' }, 400)

    const { data: membership, error: membershipError } = await caller
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('profile_id', authData.user.id)
      .eq('status', 'active')
      .single()
    const callerRole = typeof membership?.role === 'string' ? membership.role : ''
    if (membershipError || !membership || !['owner', 'admin'].includes(callerRole))
      return json({ error: 'Você não pode gerenciar usuários desta organização.' }, 403)
    if (role === 'owner' && callerRole !== 'owner')
      return json({ error: 'Somente proprietários podem adicionar outro proprietário.' }, 403)

    const admin = createClient<EdgeDatabase>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    if (teamId) {
      const { data: team } = await admin
        .from('teams')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('id', teamId)
        .single()
      if (!team) return json({ error: 'Equipe inválida.' }, 400)
    }

    let user = await findUserByEmail(admin, email)
    let invited = false
    if (!user) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: email.split('@')[0] },
      })
      if (error) throw error
      user = data.user
      invited = true
    }

    const { data: existingMember, error: existingMemberError } = await admin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('profile_id', user.id)
      .maybeSingle()
    if (existingMemberError) throw existingMemberError
    if (existingMember?.role === 'owner' && callerRole !== 'owner')
      return json({ error: 'Administradores não podem alterar proprietários.' }, 403)

    const { error: memberError } = await admin.from('organization_members').upsert(
      {
        organization_id: organizationId,
        profile_id: user.id,
        team_id: teamId,
        role,
        status: 'active',
        joined_at: new Date().toISOString(),
        created_by: authData.user.id,
      },
      { onConflict: 'organization_id,profile_id' },
    )
    if (memberError) throw memberError
    return json({ invited, userId: user.id })
  } catch (error) {
    console.error(`[invite-member:${requestId}]`, error)
    return json({ error: 'Não foi possível enviar o convite.', requestId }, 500)
  }
})
