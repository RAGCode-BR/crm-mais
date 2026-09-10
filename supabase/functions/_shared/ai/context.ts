import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.114.0'
import type { EdgeDatabase } from '../database.ts'

type EdgeClient = SupabaseClient<EdgeDatabase>

function assertResults(results: Array<{ error: { message: string } | null }>) {
  const failure = results.find((result) => result.error)
  if (failure?.error) throw new Error(failure.error.message)
}

export async function loadCompanyContext(
  db: EdgeClient,
  organizationId: string,
  companyId: string,
) {
  const [company, contacts, opportunities, tasks, activities, notes] = await Promise.all([
    db
      .from('companies')
      .select('id,trade_name,legal_name,industry,company_size,status,notes,created_at,updated_at')
      .eq('organization_id', organizationId)
      .eq('id', companyId)
      .maybeSingle(),
    db
      .from('contacts')
      .select('id,first_name,last_name,job_title,department,is_primary,notes,created_at')
      .eq('organization_id', organizationId)
      .eq('company_id', companyId)
      .is('archived_at', null)
      .limit(30),
    db
      .from('opportunities')
      .select(
        'id,title,status,estimated_value,probability,expected_close_date,product_service,description,loss_reason,created_at,updated_at',
      )
      .eq('organization_id', organizationId)
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })
      .limit(40),
    db
      .from('tasks')
      .select(
        'id,title,description,priority,status,type,due_at,completed_at,opportunity_id,created_at',
      )
      .eq('organization_id', organizationId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('activities')
      .select('id,type,subject,description,occurred_at,opportunity_id')
      .eq('organization_id', organizationId)
      .eq('company_id', companyId)
      .order('occurred_at', { ascending: false })
      .limit(80),
    db
      .from('notes')
      .select('id,content,created_at,opportunity_id,contact_id,lead_id')
      .eq('organization_id', organizationId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])
  assertResults([company, contacts, opportunities, tasks, activities, notes])
  if (!company.data) throw new Error('Empresa não encontrada ou acesso não autorizado.')
  return {
    company: company.data,
    contacts: contacts.data ?? [],
    opportunities: opportunities.data ?? [],
    tasks: tasks.data ?? [],
    timeline: activities.data ?? [],
    notes: notes.data ?? [],
    allowedPaths: [`/empresas/${companyId}`, '/tarefas/nova', '/oportunidades'],
  }
}

export async function loadCommercialContext(db: EdgeClient, organizationId: string) {
  const periodEnd = new Date().toISOString().slice(0, 10)
  const start = new Date()
  start.setUTCDate(start.getUTCDate() - 180)
  const periodStart = start.toISOString().slice(0, 10)
  const [recommendations, scores, opportunities, tasks, activities, companies, losses] =
    await Promise.all([
      db.rpc('get_commercial_recommendations', { target_organization_id: organizationId }),
      db.rpc('get_lead_scoring_overview', { target_organization_id: organizationId }),
      db
        .from('opportunities')
        .select(
          'id,title,company_id,status,estimated_value,probability,expected_close_date,product_service,loss_reason,created_at,updated_at',
        )
        .eq('organization_id', organizationId)
        .order('estimated_value', { ascending: false })
        .limit(80),
      db
        .from('tasks')
        .select('id,title,company_id,lead_id,opportunity_id,priority,status,type,due_at,created_at')
        .eq('organization_id', organizationId)
        .in('status', ['pending', 'in_progress'])
        .order('due_at', { ascending: true, nullsFirst: false })
        .limit(80),
      db
        .from('activities')
        .select('id,company_id,lead_id,opportunity_id,type,subject,occurred_at')
        .eq('organization_id', organizationId)
        .order('occurred_at', { ascending: false })
        .limit(100),
      db
        .from('companies')
        .select('id,trade_name,industry,status,created_at,updated_at')
        .eq('organization_id', organizationId)
        .is('archived_at', null)
        .limit(100),
      db.rpc('get_loss_analysis', {
        target_organization_id: organizationId,
        period_start: periodStart,
        period_end: periodEnd,
        target_owner_member_id: null,
        target_team_id: null,
        target_lead_source_id: null,
        target_industry: null,
        target_product_service: null,
        target_pipeline_id: null,
      }),
    ])
  assertResults([recommendations, scores, opportunities, tasks, activities, companies, losses])
  return {
    generatedAt: new Date().toISOString(),
    analysisPeriod: { periodStart, periodEnd },
    recommendations: Array.isArray(recommendations.data) ? recommendations.data.slice(0, 80) : [],
    leadScores: Array.isArray(scores.data) ? scores.data.slice(0, 100) : [],
    opportunities: opportunities.data ?? [],
    openTasks: tasks.data ?? [],
    recentActivities: activities.data ?? [],
    companies: companies.data ?? [],
    lossAnalysis: losses.data,
    allowedPathPrefixes: ['/leads/', '/empresas/', '/oportunidades/', '/tarefas/'],
  }
}
