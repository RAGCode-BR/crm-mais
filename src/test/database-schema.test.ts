// @vitest-environment node
/// <reference types="node" />

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'

const migrationsPath = path.resolve(process.cwd(), 'supabase/migrations')

const expectedTables = [
  'activities',
  'attachments',
  'audit_logs',
  'cadence_enrollments',
  'cadence_steps',
  'cadences',
  'commercial_recommendation_rules',
  'companies',
  'contacts',
  'entity_tags',
  'lead_score_results',
  'lead_scoring_rules',
  'lead_sources',
  'leads',
  'loss_reasons',
  'notes',
  'notification_preferences',
  'notifications',
  'opportunities',
  'organization_members',
  'organizations',
  'pipeline_stages',
  'pipelines',
  'profiles',
  'prospecting_list_items',
  'prospecting_lists',
  'tags',
  'tasks',
  'teams',
]

const userAId = '00000000-0000-4000-8000-000000000001'
const userBId = '00000000-0000-4000-8000-000000000002'
const viewerAId = '00000000-0000-4000-8000-000000000003'
const managerAId = '00000000-0000-4000-8000-000000000004'
const organizationAId = '10000000-0000-4000-8000-000000000001'
const organizationBId = '10000000-0000-4000-8000-000000000002'

async function authenticateAs(database: PGlite, userId: string) {
  await database.exec(`
    select set_config('request.jwt.claim.sub', '${userId}', false);
    set role authenticated;
  `)
}

async function resetAuthentication(database: PGlite) {
  await database.exec(`
    reset role;
    reset request.jwt.claim.sub;
  `)
}

describe('CRM database migrations', () => {
  const database = new PGlite()

  beforeAll(async () => {
    await database.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create schema auth;
      create schema storage;
      create table auth.users (
        id uuid primary key,
        email text,
        raw_user_meta_data jsonb not null default '{}'::jsonb
      );
      create function auth.uid()
      returns uuid
      language sql
      stable
      as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      grant usage on schema auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;

      create table storage.buckets (
        id text primary key,
        name text not null,
        public boolean not null default false,
        file_size_limit bigint,
        allowed_mime_types text[]
      );
      create table storage.objects (
        id bigint generated always as identity primary key,
        bucket_id text not null references storage.buckets (id),
        name text not null,
        owner_id text
      );
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated;
      grant select, insert, update, delete on storage.objects to authenticated;
    `)

    const migrationFiles = (await readdir(migrationsPath))
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort()

    for (const migrationFile of migrationFiles) {
      const migration = await readFile(path.join(migrationsPath, migrationFile), 'utf8')
      await database.exec(migration)
    }

    await database.exec(`
      insert into auth.users (id, email, raw_user_meta_data) values
        ('${userAId}', 'owner-a@example.com', '{"full_name":"Owner A"}'),
        ('${userBId}', 'sales-b@example.com', '{"full_name":"Sales B"}'),
        ('${viewerAId}', 'viewer-a@example.com', '{"full_name":"Viewer A"}'),
        ('${managerAId}', 'manager-a@example.com', '{"full_name":"Manager A"}');

      insert into public.organizations (id, name, slug) values
        ('${organizationAId}', 'Organization A', 'organization-a'),
        ('${organizationBId}', 'Organization B', 'organization-b');

      insert into public.organization_members (
        id,
        organization_id,
        profile_id,
        role,
        status,
        joined_at
      ) values
        (
          '11000000-0000-4000-8000-000000000001',
          '${organizationAId}',
          '${userAId}',
          'owner',
          'active',
          now()
        ),
        (
          '11000000-0000-4000-8000-000000000002',
          '${organizationBId}',
          '${userBId}',
          'sales',
          'active',
          now()
        ),
        (
          '11000000-0000-4000-8000-000000000003',
          '${organizationAId}',
          '${viewerAId}',
          'viewer',
          'active',
          now()
        ),
        (
          '11000000-0000-4000-8000-000000000004',
          '${organizationAId}',
          '${managerAId}',
          'manager',
          'active',
          now()
        );

      insert into public.companies (id, organization_id, trade_name) values
        (
          '20000000-0000-4000-8000-000000000001',
          '${organizationAId}',
          'Company A'
        ),
        (
          '20000000-0000-4000-8000-000000000002',
          '${organizationBId}',
          'Company B'
        );

      delete from public.pipeline_stages
      where organization_id in ('${organizationAId}', '${organizationBId}');
      delete from public.pipelines
      where organization_id in ('${organizationAId}', '${organizationBId}');

      insert into public.pipelines (id, organization_id, name, is_default) values
        (
          '30000000-0000-4000-8000-000000000001',
          '${organizationAId}',
          'Sales',
          true
        );

      insert into public.pipeline_stages (
        id,
        organization_id,
        pipeline_id,
        name,
        position
      ) values
        (
          '40000000-0000-4000-8000-000000000001',
          '${organizationAId}',
          '30000000-0000-4000-8000-000000000001',
          'New',
          0
        ),
        (
          '40000000-0000-4000-8000-000000000002',
          '${organizationAId}',
          '30000000-0000-4000-8000-000000000001',
          'Qualified',
          1
        );
    `)
  }, 30_000)

  afterAll(async () => {
    await database.close()
  })

  it('creates exactly the planned core tables', async () => {
    const result = await database.query<{ tablename: string }>(`
      select tablename
      from pg_tables
      where schemaname = 'public'
      order by tablename;
    `)

    expect(result.rows.map(({ tablename }) => tablename)).toEqual(expectedTables)
  })

  it('enables RLS and installs operation-specific policies', async () => {
    const tablesWithoutRls = await database.query<{ relname: string }>(`
      select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and not c.relrowsecurity;
    `)
    const policies = await database.query<{ schemaname: string; count: number }>(`
      select schemaname, count(*)::int as count
      from pg_policies
      where schemaname in ('public', 'storage')
      group by schemaname
      order by schemaname;
    `)

    expect(tablesWithoutRls.rows).toEqual([])
    expect(policies.rows).toEqual([
      { schemaname: 'public', count: 104 },
      { schemaname: 'storage', count: 3 },
    ])
  })

  it('keeps anon blocked and exposes read access only to authenticated users', async () => {
    const result = await database.query<{
      anon_has_access: boolean
      authenticated_can_read: boolean
    }>(`
      select
        bool_or(has_table_privilege('anon', format('public.%I', tablename), 'select'))
          as anon_has_access,
        bool_and(has_table_privilege('authenticated', format('public.%I', tablename), 'select'))
          as authenticated_can_read
      from pg_tables
      where schemaname = 'public';
    `)

    expect(result.rows[0]).toEqual({
      anon_has_access: false,
      authenticated_can_read: true,
    })
  })

  it('exposes the dashboard RPC only to authenticated users', async () => {
    const privileges = await database.query<{
      anon_can_execute: boolean
      authenticated_can_execute: boolean
    }>(`
      select
        has_function_privilege(
          'anon',
          'public.get_commercial_dashboard(uuid,timestamptz,timestamptz,uuid,uuid,uuid,text,text,uuid)',
          'execute'
        ) as anon_can_execute,
        has_function_privilege(
          'authenticated',
          'public.get_commercial_dashboard(uuid,timestamptz,timestamptz,uuid,uuid,uuid,text,text,uuid)',
          'execute'
        ) as authenticated_can_execute;
    `)

    expect(privileges.rows[0]).toEqual({
      anon_can_execute: false,
      authenticated_can_execute: true,
    })
  })

  it('installs updated_at triggers for every mutable table', async () => {
    const result = await database.query<{ count: number }>(`
      select count(*)::int as count
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and not t.tgisinternal
        and t.tgname like '%_set_updated_at';
    `)

    expect(result.rows[0]?.count).toBe(27)
  })

  it('indexes every foreign-key column set', async () => {
    const result = await database.query<{ constraint_name: string; table_name: string }>(`
      select
        c.conname as constraint_name,
        c.conrelid::regclass::text as table_name
      from pg_constraint c
      where c.contype = 'f'
        and c.connamespace = 'public'::regnamespace
        and not exists (
          select 1
          from pg_index i
          where i.indrelid = c.conrelid
            and i.indisvalid
            and (
              select array_agg(index_column order by position)
              from unnest(i.indkey::smallint[])
                with ordinality as indexed_columns(index_column, position)
              where position <= cardinality(c.conkey)
            ) = c.conkey
        )
      order by table_name, constraint_name;
    `)

    expect(result.rows).toEqual([])
  })

  it('creates a profile automatically for every auth user', async () => {
    const result = await database.query<{ full_name: string }>(`
      select full_name
      from public.profiles
      where id = '${userAId}';
    `)

    expect(result.rows[0]?.full_name).toBe('Owner A')
  })

  it('isolates organization data even when a request targets another tenant', async () => {
    await authenticateAs(database, userAId)

    try {
      const organizations = await database.query<{ id: string }>(`
        select id from public.organizations order by id;
      `)
      const companies = await database.query<{ trade_name: string }>(`
        select trade_name from public.companies order by trade_name;
      `)

      expect(organizations.rows.map(({ id }) => id)).toEqual([organizationAId])
      expect(companies.rows.map(({ trade_name }) => trade_name)).toEqual(['Company A'])

      await expect(
        database.exec(`
          insert into public.companies (organization_id, trade_name)
          values ('${organizationBId}', 'Cross-tenant company');
        `),
      ).rejects.toThrow(/row-level security/i)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('blocks cross-tenant reads, updates and deletes for every critical CRM entity', async () => {
    const contactId = '22000000-0000-4000-8000-000000000098'
    const leadId = '21000000-0000-4000-8000-000000000098'
    const pipelineId = '30000000-0000-4000-8000-000000000098'
    const stageId = '40000000-0000-4000-8000-000000000098'
    const opportunityId = '50000000-0000-4000-8000-000000000098'
    const taskId = '60000000-0000-4000-8000-000000000098'

    await database.exec(`
      insert into public.contacts (id, organization_id, company_id, first_name)
      values ('${contactId}', '${organizationBId}', '20000000-0000-4000-8000-000000000002', 'Private B');
      insert into public.leads (id, organization_id, company_id, contact_id, name)
      values ('${leadId}', '${organizationBId}', '20000000-0000-4000-8000-000000000002', '${contactId}', 'Private B lead');
      insert into public.pipelines (id, organization_id, name)
      values ('${pipelineId}', '${organizationBId}', 'Private B pipeline');
      insert into public.pipeline_stages (id, organization_id, pipeline_id, name, position)
      values ('${stageId}', '${organizationBId}', '${pipelineId}', 'Private B stage', 1);
      insert into public.opportunities (
        id, organization_id, title, company_id, contact_id, lead_id, pipeline_id, stage_id
      ) values (
        '${opportunityId}', '${organizationBId}', 'Private B opportunity',
        '20000000-0000-4000-8000-000000000002', '${contactId}', '${leadId}',
        '${pipelineId}', '${stageId}'
      );
      insert into public.tasks (id, organization_id, lead_id, title)
      values ('${taskId}', '${organizationBId}', '${leadId}', 'Private B task');
    `)

    await authenticateAs(database, userAId)
    try {
      for (const [table, id] of [
        ['companies', '20000000-0000-4000-8000-000000000002'],
        ['contacts', contactId],
        ['leads', leadId],
        ['opportunities', opportunityId],
        ['tasks', taskId],
      ]) {
        const hidden = await database.query<{ count: number }>(`
          select count(*)::int as count from public.${table} where id = '${id}';
        `)
        expect(hidden.rows[0]?.count).toBe(0)
        await database.exec(`update public.${table} set updated_at = now() where id = '${id}';`)
        await database.exec(`delete from public.${table} where id = '${id}';`)
      }
    } finally {
      await resetAuthentication(database)
    }

    const preserved = await database.query<{ count: number }>(`
      select (
        (select count(*) from public.companies where id = '20000000-0000-4000-8000-000000000002') +
        (select count(*) from public.contacts where id = '${contactId}') +
        (select count(*) from public.leads where id = '${leadId}') +
        (select count(*) from public.opportunities where id = '${opportunityId}') +
        (select count(*) from public.tasks where id = '${taskId}')
      )::int as count;
    `)
    expect(preserved.rows[0]?.count).toBe(5)
  })

  it('creates the first owner membership in the same organization transaction', async () => {
    await authenticateAs(database, userAId)

    try {
      const organizationId = '10000000-0000-4000-8000-000000000003'

      await database.exec(`
        insert into public.organizations (id, name, slug)
        values ('${organizationId}', 'Organization C', 'organization-c');
      `)
      const membership = await database.query<{ role: string; status: string }>(`
        select role, status
        from public.organization_members
        where organization_id = '${organizationId}';
      `)

      expect(membership.rows).toEqual([{ role: 'owner', status: 'active' }])
    } finally {
      await resetAuthentication(database)
    }
  })

  it('isolates tasks between organizations at the database boundary', async () => {
    await authenticateAs(database, userBId)
    try {
      await database.exec(`
        insert into public.tasks (
          id, organization_id, assigned_member_id, title, due_at
        ) values (
          '60000000-0000-4000-8000-000000000003',
          '${organizationBId}',
          '11000000-0000-4000-8000-000000000002',
          'Private organization B task',
          now() + interval '1 day'
        );
      `)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userAId)
    try {
      const hidden = await database.query<{ count: number }>(`
        select count(*)::int as count
        from public.tasks
        where id = '60000000-0000-4000-8000-000000000003';
      `)
      expect(hidden.rows[0]?.count).toBe(0)

      await expect(
        database.exec(`
          insert into public.tasks (
            organization_id, assigned_member_id, title, due_at
          ) values (
            '${organizationBId}',
            '11000000-0000-4000-8000-000000000002',
            'Cross-tenant task',
            now() + interval '1 day'
          );
        `),
      ).rejects.toThrow(/row-level security/i)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('enforces viewer, sales and manager write permissions', async () => {
    await authenticateAs(database, viewerAId)

    try {
      await expect(
        database.exec(`
          insert into public.companies (organization_id, trade_name)
          values ('${organizationAId}', 'Viewer company');
        `),
      ).rejects.toThrow(/row-level security/i)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)

    try {
      await database.exec(`
        insert into public.companies (id, organization_id, trade_name)
        values (
          '20000000-0000-4000-8000-000000000003',
          '${organizationBId}',
          'Sales company'
        );
        delete from public.companies
        where id = '20000000-0000-4000-8000-000000000003';
      `)
      const remaining = await database.query<{ count: number }>(`
        select count(*)::int as count
        from public.companies
        where id = '20000000-0000-4000-8000-000000000003';
      `)

      expect(remaining.rows[0]?.count).toBe(1)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, managerAId)

    try {
      await database.exec(`
        insert into public.companies (id, organization_id, trade_name)
        values (
          '20000000-0000-4000-8000-000000000004',
          '${organizationAId}',
          'Manager company'
        );
        delete from public.companies
        where id = '20000000-0000-4000-8000-000000000004';
      `)
      const remaining = await database.query<{ count: number }>(`
        select count(*)::int as count
        from public.companies
        where id = '20000000-0000-4000-8000-000000000004';
      `)

      expect(remaining.rows[0]?.count).toBe(0)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('prevents removal of the last active organization owner', async () => {
    await authenticateAs(database, userAId)

    try {
      await expect(
        database.exec(`
          delete from public.organization_members
          where id = '11000000-0000-4000-8000-000000000001';
        `),
      ).rejects.toThrow(/at least one active owner/i)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('rejects a cross-organization relationship at the database boundary', async () => {
    await expect(
      database.exec(`
        insert into public.contacts (
          organization_id,
          company_id,
          first_name
        ) values (
          '10000000-0000-4000-8000-000000000002',
          '20000000-0000-4000-8000-000000000001',
          'Invalid Contact'
        );
      `),
    ).rejects.toThrow(/foreign key constraint/i)
  })

  it('provides non-unique duplicate lookup indexes for CRM warnings', async () => {
    const indexes = await database.query<{ indexname: string }>(`
      select indexname
      from pg_indexes
      where schemaname = 'public'
        and indexname in ('companies_phone_idx', 'contacts_whatsapp_idx')
      order by indexname;
    `)

    expect(indexes.rows.map(({ indexname }) => indexname)).toEqual([
      'companies_phone_idx',
      'contacts_whatsapp_idx',
    ])
  })

  it('bootstraps the nine-stage commercial pipeline for a new organization', async () => {
    await database.exec(`
      insert into public.organizations (id, name, slug)
      values (
        '10000000-0000-4000-8000-000000000009',
        'Pipeline bootstrap',
        'pipeline-bootstrap'
      );
    `)
    const pipeline = await database.query<{ count: number; stages: number }>(`
      select count(distinct pipelines.id)::int as count,
             count(pipeline_stages.id)::int as stages
      from public.pipelines
      join public.pipeline_stages on pipeline_stages.pipeline_id = pipelines.id
      where pipelines.organization_id = '10000000-0000-4000-8000-000000000009'
        and pipelines.is_default;
    `)

    expect(pipeline.rows[0]).toEqual({ count: 1, stages: 9 })
  })

  it('blocks untracked stage updates and records atomic pipeline movements', async () => {
    await authenticateAs(database, userAId)
    try {
      await database.exec(`
        insert into public.opportunities (
          id, organization_id, title, company_id, pipeline_id, stage_id
        ) values (
          '50000000-0000-4000-8000-000000000001',
          '${organizationAId}',
          'Tracked opportunity',
          '20000000-0000-4000-8000-000000000001',
          '30000000-0000-4000-8000-000000000001',
          '40000000-0000-4000-8000-000000000001'
        );
      `)

      await expect(
        database.exec(`
          update public.opportunities
          set stage_id = '40000000-0000-4000-8000-000000000002'
          where id = '50000000-0000-4000-8000-000000000001';
        `),
      ).rejects.toThrow(/must use move_opportunity/i)

      await database.exec(`
        select public.move_opportunity(
          '50000000-0000-4000-8000-000000000001',
          '40000000-0000-4000-8000-000000000002',
          null
        );
      `)
      const result = await database.query<{ activities: number; stage_id: string }>(`
        select opportunities.stage_id::text,
               count(activities.id)::int as activities
        from public.opportunities
        left join public.activities
          on activities.opportunity_id = opportunities.id
          and activities.type = 'stage_change'
        where opportunities.id = '50000000-0000-4000-8000-000000000001'
        group by opportunities.stage_id;
      `)

      expect(result.rows[0]).toEqual({
        activities: 1,
        stage_id: '40000000-0000-4000-8000-000000000002',
      })
    } finally {
      await resetAuthentication(database)
    }
  })

  it('saves a multi-stage pipeline configuration atomically for managers', async () => {
    await authenticateAs(database, managerAId)
    try {
      const saved = await database.query<{ pipeline_id: string }>(`
        select public.save_pipeline_configuration(
          '${organizationAId}',
          null,
          'Enterprise',
          'Pipeline de contas estratégicas',
          false,
          true,
          '[
            {"name":"Descoberta","probability":20,"isWon":false,"isLost":false},
            {"name":"Ganho","probability":100,"isWon":true,"isLost":false}
          ]'::jsonb
        )::text as pipeline_id;
      `)
      const stages = await database.query<{ count: number }>(`
        select count(*)::int as count
        from public.pipeline_stages
        where pipeline_id = '${saved.rows[0]?.pipeline_id}';
      `)

      expect(stages.rows[0]?.count).toBe(2)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('automatically records lead, assignment, task and opportunity outcome events', async () => {
    await authenticateAs(database, userAId)
    try {
      await database.exec(`
        insert into public.leads (
          id, organization_id, name, company_id
        ) values (
          '21000000-0000-4000-8000-000000000001',
          '${organizationAId}',
          'Automatic timeline lead',
          '20000000-0000-4000-8000-000000000001'
        );

        update public.leads
        set owner_member_id = '11000000-0000-4000-8000-000000000004'
        where id = '21000000-0000-4000-8000-000000000001';

        insert into public.tasks (
          id, organization_id, lead_id, title
        ) values (
          '60000000-0000-4000-8000-000000000001',
          '${organizationAId}',
          '21000000-0000-4000-8000-000000000001',
          'Follow-up automático'
        );

        update public.tasks
        set status = 'completed', completed_at = now()
        where id = '60000000-0000-4000-8000-000000000001';

        insert into public.opportunities (
          id, organization_id, title, company_id, pipeline_id, stage_id
        ) values (
          '50000000-0000-4000-8000-000000000002',
          '${organizationAId}',
          'Automatic outcome opportunity',
          '20000000-0000-4000-8000-000000000001',
          '30000000-0000-4000-8000-000000000001',
          '40000000-0000-4000-8000-000000000001'
        );

        update public.opportunities
        set status = 'won', closed_at = now()
        where id = '50000000-0000-4000-8000-000000000002';

        update public.opportunities
        set status = 'lost', loss_reason = 'Preço', closed_at = now()
        where id = '50000000-0000-4000-8000-000000000002';
      `)

      const events = await database.query<{ event: string; count: number }>(`
        select metadata ->> 'event' as event, count(*)::int as count
        from public.activities
        where organization_id = '${organizationAId}'
          and metadata ->> 'event' in (
          'lead_created', 'assignment_changed', 'task_created',
          'task_completed', 'opportunity_won'
          , 'opportunity_lost'
        )
        group by metadata ->> 'event'
        order by event;
      `)

      expect(events.rows).toEqual([
        { count: 1, event: 'assignment_changed' },
        { count: 1, event: 'lead_created' },
        { count: 1, event: 'opportunity_lost' },
        { count: 1, event: 'opportunity_won' },
        { count: 1, event: 'task_completed' },
        { count: 1, event: 'task_created' },
      ])
    } finally {
      await resetAuthentication(database)
    }
  })

  it('keeps timeline activities append-only for authenticated roles', async () => {
    const privileges = await database.query<{ can_delete: boolean; can_update: boolean }>(`
      select
        has_table_privilege('authenticated', 'public.activities', 'delete') as can_delete,
        has_table_privilege('authenticated', 'public.activities', 'update') as can_update;
    `)
    expect(privileges.rows[0]).toEqual({ can_delete: false, can_update: false })

    await authenticateAs(database, managerAId)
    try {
      await expect(
        database.exec(`
          update public.activities
          set subject = 'History rewritten';
        `),
      ).rejects.toThrow(/permission denied/i)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('calculates dashboard metrics without bypassing organization RLS', async () => {
    const dashboardOrganizationId = '10000000-0000-4000-8000-000000000004'
    await authenticateAs(database, userAId)
    try {
      await database.exec(`
        insert into public.organizations (id, name, slug)
        values ('${dashboardOrganizationId}', 'Dashboard Organization', 'dashboard-organization');

        insert into public.lead_sources (id, organization_id, name)
        values (
          '70000000-0000-4000-8000-000000000001',
          '${dashboardOrganizationId}',
          'Indicação'
        );

        insert into public.companies (id, organization_id, trade_name, industry)
        values (
          '20000000-0000-4000-8000-000000000010',
          '${dashboardOrganizationId}',
          'Dashboard Company',
          'Tecnologia'
        );

        insert into public.leads (
          id, organization_id, company_id, owner_member_id, lead_source_id, name, status
        ) values (
          '21000000-0000-4000-8000-000000000010',
          '${dashboardOrganizationId}',
          '20000000-0000-4000-8000-000000000010',
          (select id from public.organization_members where organization_id = '${dashboardOrganizationId}'),
          '70000000-0000-4000-8000-000000000001',
          'Qualified dashboard lead',
          'qualified'
        );

        insert into public.activities (
          organization_id, company_id, actor_member_id, type, subject
        ) values
        (
          '${dashboardOrganizationId}',
          '20000000-0000-4000-8000-000000000010',
          (select id from public.organization_members where organization_id = '${dashboardOrganizationId}'),
          'meeting',
          'Dashboard meeting'
        ),
        (
          '${dashboardOrganizationId}',
          '20000000-0000-4000-8000-000000000010',
          (select id from public.organization_members where organization_id = '${dashboardOrganizationId}'),
          'proposal',
          'Dashboard proposal'
        );

        insert into public.opportunities (
          id, organization_id, title, company_id, owner_member_id, pipeline_id,
          stage_id, lead_source_id, status, estimated_value, probability, closed_at,
          product_service, loss_reason
        ) values
        (
          '50000000-0000-4000-8000-000000000010',
          '${dashboardOrganizationId}',
          'Won dashboard opportunity',
          '20000000-0000-4000-8000-000000000010',
          (select id from public.organization_members where organization_id = '${dashboardOrganizationId}'),
          (select id from public.pipelines where organization_id = '${dashboardOrganizationId}' limit 1),
          (select id from public.pipeline_stages where organization_id = '${dashboardOrganizationId}' order by position limit 1),
          '70000000-0000-4000-8000-000000000001',
          'won', 1000, 100, now(), 'CRM', null
        ),
        (
          '50000000-0000-4000-8000-000000000011',
          '${dashboardOrganizationId}',
          'Lost dashboard opportunity',
          '20000000-0000-4000-8000-000000000010',
          (select id from public.organization_members where organization_id = '${dashboardOrganizationId}'),
          (select id from public.pipelines where organization_id = '${dashboardOrganizationId}' limit 1),
          (select id from public.pipeline_stages where organization_id = '${dashboardOrganizationId}' order by position limit 1),
          '70000000-0000-4000-8000-000000000001',
          'lost', 500, 0, now(), 'CRM', 'Preço'
        ),
        (
          '50000000-0000-4000-8000-000000000012',
          '${dashboardOrganizationId}',
          'Open dashboard opportunity',
          '20000000-0000-4000-8000-000000000010',
          (select id from public.organization_members where organization_id = '${dashboardOrganizationId}'),
          (select id from public.pipelines where organization_id = '${dashboardOrganizationId}' limit 1),
          (select id from public.pipeline_stages where organization_id = '${dashboardOrganizationId}' order by position limit 1),
          '70000000-0000-4000-8000-000000000001',
          'open', 2000, 25, null, 'CRM', null
        );

        insert into public.tasks (
          organization_id, company_id, assigned_member_id, title, due_at
        ) values (
          '${dashboardOrganizationId}',
          '20000000-0000-4000-8000-000000000010',
          (select id from public.organization_members where organization_id = '${dashboardOrganizationId}'),
          'Overdue dashboard task',
          now() - interval '1 day'
        );
      `)

      const result = await database.query<{
        data: {
          metrics: Record<string, number>
          leadEvolution: Array<{ label: string; value: number }>
        }
      }>(`
        select public.get_commercial_dashboard(
          '${dashboardOrganizationId}',
          now() - interval '1 day',
          now() + interval '1 day'
        ) as data;
      `)
      expect(result.rows[0]?.data.metrics).toMatchObject({
        newLeads: 1,
        qualifiedLeads: 1,
        meetings: 1,
        proposals: 1,
        won: 1,
        lost: 1,
        conversionRate: 50,
        averageTicket: 1000,
        pipelineValue: 2000,
        salesForecast: 500,
        overdueTasks: 1,
      })
      expect(result.rows[0]?.data.leadEvolution.some(({ value }) => value === 1)).toBe(true)

      const salesReport = await database.query<{
        data: { metrics: Record<string, number>; funnel: unknown[]; stageTimes: unknown[] }
      }>(`
        select public.get_sales_report(
          '${dashboardOrganizationId}', now() - interval '1 day', now() + interval '1 day'
        ) as data;
      `)
      expect(salesReport.rows[0]?.data.metrics).toMatchObject({
        closedRevenue: 1000,
        openOpportunities: 1,
        averageTicket: 1000,
        pipelineValue: 2000,
        salesForecast: 500,
      })
      expect(salesReport.rows[0]?.data.funnel).toHaveLength(5)
      expect(salesReport.rows[0]?.data.stageTimes).toHaveLength(1)

      const lossAnalysis = await database.query<{
        data: {
          summary: Record<string, number>
          lossByReason: Array<{ label: string; value: number }>
          conversionByOwner: unknown[]
          conversionBySource: unknown[]
          conversionByIndustry: unknown[]
        }
      }>(`
        select public.get_loss_analysis(
          '${dashboardOrganizationId}', now() - interval '1 day', now() + interval '1 day'
        ) as data;
      `)
      expect(lossAnalysis.rows[0]?.data.summary).toMatchObject({
        won: 1,
        lost: 1,
        lostValue: 500,
        conversionRate: 50,
      })
      expect(lossAnalysis.rows[0]?.data.lossByReason).toContainEqual({ label: 'Preço', value: 1 })
      expect(lossAnalysis.rows[0]?.data.conversionByOwner).toHaveLength(1)
      expect(lossAnalysis.rows[0]?.data.conversionBySource).toHaveLength(1)
      expect(lossAnalysis.rows[0]?.data.conversionByIndustry).toHaveLength(1)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const isolated = await database.query<{ new_leads: number }>(`
        select (
          public.get_commercial_dashboard(
            '${dashboardOrganizationId}',
            now() - interval '1 day',
            now() + interval '1 day'
          ) -> 'metrics' ->> 'newLeads'
        )::int as new_leads;
      `)
      expect(isolated.rows[0]?.new_leads).toBe(0)
      const isolatedReports = await database.query<{ sales: number; losses: number }>(`
        select
          (public.get_sales_report(
            '${dashboardOrganizationId}', now() - interval '1 day', now() + interval '1 day'
          ) -> 'metrics' ->> 'closedRevenue')::int as sales,
          (public.get_loss_analysis(
            '${dashboardOrganizationId}', now() - interval '1 day', now() + interval '1 day'
          ) -> 'summary' ->> 'lost')::int as losses;
      `)
      expect(isolatedReports.rows[0]).toEqual({ sales: 0, losses: 0 })
    } finally {
      await resetAuthentication(database)
    }
  })

  it('enforces opportunity lifecycle consistency', async () => {
    await expect(
      database.exec(`
        insert into public.opportunities (
          organization_id,
          title,
          company_id,
          pipeline_id,
          stage_id,
          status,
          closed_at
        ) values (
          '10000000-0000-4000-8000-000000000001',
          'Invalid lost opportunity',
          '20000000-0000-4000-8000-000000000001',
          '30000000-0000-4000-8000-000000000001',
          '40000000-0000-4000-8000-000000000001',
          'lost',
          now()
        );
      `),
    ).rejects.toThrow(/opportunities_loss_reason_check/i)
  })

  it('keeps task completion timestamps consistent automatically', async () => {
    await database.exec(`
      insert into public.tasks (
        id,
        organization_id,
        title,
        status
      ) values (
        '60000000-0000-4000-8000-000000000002',
        '${organizationAId}',
        'Completed by lifecycle trigger',
        'completed'
      );
    `)

    const completed = await database.query<{ completed_at: string | null }>(`
      select completed_at::text
      from public.tasks
      where id = '60000000-0000-4000-8000-000000000002';
    `)
    expect(completed.rows[0]?.completed_at).not.toBeNull()

    await database.exec(`
      update public.tasks
      set status = 'pending'
      where id = '60000000-0000-4000-8000-000000000002';
    `)
    const reopened = await database.query<{ completed_at: string | null }>(`
      select completed_at::text
      from public.tasks
      where id = '60000000-0000-4000-8000-000000000002';
    `)
    expect(reopened.rows[0]?.completed_at).toBeNull()
  })

  it('isolates prospecting lists and enforces their entity constraints', async () => {
    await authenticateAs(database, userAId)
    try {
      await database.exec(`
        insert into public.prospecting_lists (
          id, organization_id, name, owner_member_id
        ) values (
          '80000000-0000-4000-8000-000000000001',
          '${organizationAId}',
          'Construction prospects',
          '11000000-0000-4000-8000-000000000001'
        );

        insert into public.prospecting_list_items (
          id, organization_id, list_id, company_id, assigned_member_id
        ) values (
          '81000000-0000-4000-8000-000000000001',
          '${organizationAId}',
          '80000000-0000-4000-8000-000000000001',
          '20000000-0000-4000-8000-000000000001',
          '11000000-0000-4000-8000-000000000001'
        );
      `)

      await expect(
        database.exec(`
          insert into public.prospecting_list_items (
            organization_id, list_id, company_id, lead_id
          ) values (
            '${organizationAId}',
            '80000000-0000-4000-8000-000000000001',
            '20000000-0000-4000-8000-000000000001',
            '21000000-0000-4000-8000-000000000001'
          );
        `),
      ).rejects.toThrow(/single_entity_check/i)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const isolated = await database.query<{ count: number }>(`
        select count(*)::int as count
        from public.prospecting_lists
        where id = '80000000-0000-4000-8000-000000000001';
      `)
      expect(isolated.rows[0]?.count).toBe(0)

      await database.exec(`
        insert into public.prospecting_lists (
          id, organization_id, name
        ) values (
          '80000000-0000-4000-8000-000000000002',
          '${organizationBId}',
          'Sales-owned list'
        );
        insert into public.prospecting_list_items (
          id, organization_id, list_id, company_id
        ) values (
          '81000000-0000-4000-8000-000000000002',
          '${organizationBId}',
          '80000000-0000-4000-8000-000000000002',
          '20000000-0000-4000-8000-000000000002'
        );
        delete from public.prospecting_list_items
        where id = '81000000-0000-4000-8000-000000000002';
      `)
      const removed = await database.query<{ count: number }>(`
        select count(*)::int as count
        from public.prospecting_list_items
        where id = '81000000-0000-4000-8000-000000000002';
      `)
      expect(removed.rows[0]?.count).toBe(0)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, viewerAId)
    try {
      await expect(
        database.exec(`
          insert into public.prospecting_lists (organization_id, name)
          values ('${organizationAId}', 'Viewer list');
        `),
      ).rejects.toThrow(/row-level security/i)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('schedules, pauses, resumes and completes an internal task cadence', async () => {
    const leadId = '21000000-0000-4000-8000-000000000090'
    const enrollmentId = '82000000-0000-4000-8000-000000000001'

    await authenticateAs(database, managerAId)
    try {
      await database.exec(`
        insert into public.leads (id, organization_id, name, email)
        values ('${leadId}', '${organizationAId}', 'Cadence lead', 'cadence@example.com');
      `)
      const saved = await database.query<{ cadence_id: string }>(`
        select public.save_cadence_configuration(
          '${organizationAId}',
          null,
          'Novos clientes',
          'Fluxo interno de validação',
          'active',
          '[
            {"dayNumber": 1, "type": "email", "title": "E-mail inicial"},
            {"dayNumber": 3, "type": "call", "title": "Ligação de acompanhamento"}
          ]'::jsonb
        )::text as cadence_id;
      `)
      const cadenceId = saved.rows[0]!.cadence_id

      await database.exec(`
        insert into public.cadence_enrollments (
          id, organization_id, cadence_id, lead_id, assigned_member_id
        ) values (
          '${enrollmentId}', '${organizationAId}', '${cadenceId}', '${leadId}',
          '11000000-0000-4000-8000-000000000004'
        );
      `)

      const firstTask = await database.query<{ count: number; type: string }>(`
        select count(*)::int as count, max(type) as type
        from public.tasks
        where cadence_enrollment_id = '${enrollmentId}' and status = 'pending';
      `)
      expect(firstTask.rows[0]).toMatchObject({ count: 1, type: 'email' })
      await expect(
        database.query(`select private.schedule_cadence_task('${enrollmentId}', false);`),
      ).rejects.toThrow(/permission denied/i)

      await database.query(`
        select public.set_cadence_enrollment_status('${enrollmentId}', 'paused');
      `)
      const paused = await database.query<{ status: string; task_status: string }>(`
        select e.status, max(t.status) as task_status
        from public.cadence_enrollments e
        join public.tasks t on t.cadence_enrollment_id = e.id
        where e.id = '${enrollmentId}'
        group by e.status;
      `)
      expect(paused.rows[0]).toMatchObject({ status: 'paused', task_status: 'cancelled' })

      await database.query(`
        select public.set_cadence_enrollment_status('${enrollmentId}', 'active');
      `)
      const resumed = await database.query<{ id: string }>(`
        select id::text
        from public.tasks
        where cadence_enrollment_id = '${enrollmentId}' and status = 'pending';
      `)
      expect(resumed.rows).toHaveLength(1)

      await database.exec(
        `update public.tasks set status = 'completed' where id = '${resumed.rows[0]!.id}';`,
      )
      const secondTask = await database.query<{ id: string; type: string }>(`
        select id::text, type
        from public.tasks
        where cadence_enrollment_id = '${enrollmentId}' and status = 'pending';
      `)
      expect(secondTask.rows).toHaveLength(1)
      expect(secondTask.rows[0]?.type).toBe('call')

      await database.exec(
        `update public.tasks set status = 'completed' where id = '${secondTask.rows[0]!.id}';`,
      )
      const completed = await database.query<{ status: string; completed_at: string | null }>(`
        select status, completed_at::text
        from public.cadence_enrollments
        where id = '${enrollmentId}';
      `)
      expect(completed.rows[0]?.status).toBe('completed')
      expect(completed.rows[0]?.completed_at).not.toBeNull()
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const isolated = await database.query<{ count: number }>(`
        select count(*)::int as count from public.cadences
        where organization_id = '${organizationAId}';
      `)
      expect(isolated.rows[0]?.count).toBe(0)
      await expect(
        database.query(`
          select public.set_cadence_enrollment_status('${enrollmentId}', 'paused');
        `),
      ).rejects.toThrow(/insufficient permissions/i)
      await expect(
        database.query(`
          select public.save_cadence_configuration(
            '${organizationBId}', null, 'Unauthorized cadence', '', 'active',
            '[{"dayNumber": 1, "type": "call", "title": "Call"}]'::jsonb
          );
        `),
      ).rejects.toThrow(/insufficient permissions/i)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('calculates explainable lead scores from configurable tenant rules', async () => {
    const companyId = '20000000-0000-4000-8000-000000000090'
    const leadId = '21000000-0000-4000-8000-000000000091'

    await authenticateAs(database, managerAId)
    try {
      await database.exec(`
        insert into public.companies (
          id, organization_id, trade_name, employee_count
        ) values (
          '${companyId}', '${organizationAId}', 'Scored Company', 100
        );
        insert into public.leads (
          id, organization_id, company_id, name, temperature, status
        ) values (
          '${leadId}', '${organizationAId}', '${companyId}',
          'Scored Lead', 'hot', 'new'
        );
        insert into public.activities (
          organization_id, lead_id, type, subject
        ) values
          ('${organizationAId}', '${leadId}', 'whatsapp', 'WhatsApp replied'),
          ('${organizationAId}', '${leadId}', 'meeting', 'Meeting completed');
      `)

      const initial = await database.query<{
        score: number
        classification: string
        breakdown_count: number
      }>(`
        select score, classification, jsonb_array_length(breakdown)::int as breakdown_count
        from public.lead_score_results
        where organization_id = '${organizationAId}' and lead_id = '${leadId}';
      `)
      expect(initial.rows[0]).toMatchObject({
        score: 80,
        classification: 'very_hot',
        breakdown_count: 4,
      })

      await database.exec(`
        insert into public.lead_scoring_rules (
          organization_id, name, rule_type, condition_value, points
        ) values (
          '${organizationAId}', 'Lead qualificado', 'lead_status', 'qualified', 5
        );
        update public.leads set status = 'qualified' where id = '${leadId}';
      `)
      const configured = await database.query<{ score: number }>(`
        select score from public.leads where id = '${leadId}';
      `)
      expect(configured.rows[0]?.score).toBe(85)

      const overview = await database.query<{ score: number; has_open_follow_up: boolean }>(`
        select score, has_open_follow_up
        from public.get_lead_scoring_overview('${organizationAId}')
        where lead_id = '${leadId}';
      `)
      expect(overview.rows[0]).toMatchObject({ score: 85, has_open_follow_up: false })
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const isolated = await database.query<{ count: number }>(`
        select count(*)::int as count from public.lead_scoring_rules
        where organization_id = '${organizationAId}';
      `)
      expect(isolated.rows[0]?.count).toBe(0)
      await expect(
        database.query(`select public.recalculate_organization_lead_scores('${organizationAId}');`),
      ).rejects.toThrow(/insufficient permissions/i)
      await expect(
        database.exec(`
          insert into public.lead_scoring_rules (
            organization_id, name, rule_type, condition_value, points
          ) values (
            '${organizationBId}', 'Sales rule', 'lead_status', 'new', 10
          );
        `),
      ).rejects.toThrow(/row-level security/i)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const isolated = await database.query<{ count: number }>(`
        select count(*)::int as count from public.lead_score_results
        where organization_id = '${organizationAId}';
      `)
      expect(isolated.rows[0]?.count).toBe(0)
      await expect(
        database.query(`select public.recalculate_organization_lead_scores('${organizationAId}');`),
      ).rejects.toThrow(/insufficient permissions/i)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, viewerAId)
    try {
      await expect(
        database.exec(`
          insert into public.lead_scoring_rules (
            organization_id, name, rule_type, condition_value, points
          ) values ('${organizationAId}', 'Viewer rule', 'lead_status', 'new', 5);
        `),
      ).rejects.toThrow(/row-level security/i)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('returns explainable next-action recommendations without crossing tenants', async () => {
    const staleLeadId = '21000000-0000-4000-8000-000000000092'
    const hotLeadId = '21000000-0000-4000-8000-000000000093'
    const stalledOpportunityId = '50000000-0000-4000-8000-000000000092'
    const closingOpportunityId = '50000000-0000-4000-8000-000000000093'
    const overdueTaskId = '60000000-0000-4000-8000-000000000092'

    await authenticateAs(database, managerAId)
    try {
      await database.exec(`
        insert into public.leads (
          id, organization_id, name, created_at, next_contact_at
        ) values (
          '${staleLeadId}', '${organizationAId}', 'Reactivation candidate',
          now() - interval '100 days', now() - interval '1 day'
        );
        insert into public.leads (
          id, organization_id, name, temperature
        ) values (
          '${hotLeadId}', '${organizationAId}', 'Hot lead without follow-up', 'hot'
        );
        insert into public.activities (organization_id, lead_id, type, subject)
        values
          ('${organizationAId}', '${hotLeadId}', 'whatsapp', 'WhatsApp response'),
          ('${organizationAId}', '${hotLeadId}', 'meeting', 'Meeting held');

        insert into public.tasks (
          id, organization_id, assigned_member_id, title, type, due_at
        ) values (
          '${overdueTaskId}', '${organizationAId}',
          '11000000-0000-4000-8000-000000000004',
          'Overdue recommendation task', 'follow_up', now() - interval '2 days'
        );

        insert into public.opportunities (
          id, organization_id, title, company_id, owner_member_id,
          pipeline_id, stage_id, status, created_at
        ) values (
          '${stalledOpportunityId}', '${organizationAId}', 'Stalled deal',
          '20000000-0000-4000-8000-000000000001',
          '11000000-0000-4000-8000-000000000004',
          (select id from public.pipelines where organization_id = '${organizationAId}' limit 1),
          (select id from public.pipeline_stages where organization_id = '${organizationAId}' order by position limit 1),
          'open', now() - interval '20 days'
        ), (
          '${closingOpportunityId}', '${organizationAId}', 'Closing deal',
          '20000000-0000-4000-8000-000000000001',
          '11000000-0000-4000-8000-000000000004',
          (select id from public.pipelines where organization_id = '${organizationAId}' limit 1),
          (select id from public.pipeline_stages where organization_id = '${organizationAId}' order by position limit 1),
          'open', now()
        );
        update public.opportunities
        set expected_close_date = current_date + 2
        where id = '${closingOpportunityId}';
      `)

      const recommendations = await database.query<{ rule_code: string; entity_id: string }>(`
        select rule_code, entity_id::text
        from public.get_commercial_recommendations('${organizationAId}')
        where entity_id in (
          '${staleLeadId}', '${hotLeadId}', '${stalledOpportunityId}',
          '${closingOpportunityId}', '${overdueTaskId}'
        );
      `)
      const codes = recommendations.rows.map(({ rule_code }) => rule_code)
      expect(codes).toEqual(
        expect.arrayContaining([
          'follow_up_due',
          'reactivate_lead',
          'high_score_no_task',
          'stalled_opportunity',
          'closing_soon',
          'overdue_follow_up',
        ]),
      )
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const isolated = await database.query<{ count: number }>(`
        select count(*)::int as count
        from public.get_commercial_recommendations('${organizationAId}');
      `)
      expect(isolated.rows[0]?.count).toBe(0)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('searches all commercial entities by relevance without crossing tenants', async () => {
    const companyId = '20000000-0000-4000-8000-000000000094'
    const contactId = '22000000-0000-4000-8000-000000000094'
    const leadId = '21000000-0000-4000-8000-000000000094'
    const opportunityId = '50000000-0000-4000-8000-000000000094'
    const taskId = '60000000-0000-4000-8000-000000000094'

    await authenticateAs(database, managerAId)
    try {
      await database.exec(`
        insert into public.companies (id, organization_id, trade_name, industry)
        values ('${companyId}', '${organizationAId}', 'Therapeutica', 'Saúde');

        insert into public.contacts (
          id, organization_id, company_id, first_name, last_name, job_title
        ) values (
          '${contactId}', '${organizationAId}', '${companyId}', 'João', 'Silva', 'Compras'
        );
        insert into public.leads (id, organization_id, company_id, contact_id, name)
        values (
          '${leadId}', '${organizationAId}', '${companyId}', '${contactId}',
          'Expansão Therapeutica'
        );
        insert into public.opportunities (
          id, organization_id, title, company_id, contact_id, lead_id,
          pipeline_id, stage_id, product_service
        ) values (
          '${opportunityId}', '${organizationAId}', 'Sistema de Estoque',
          '${companyId}', '${contactId}', '${leadId}',
          (select id from public.pipelines where organization_id = '${organizationAId}' limit 1),
          (select id from public.pipeline_stages where organization_id = '${organizationAId}' order by position limit 1),
          'ERP Therapeutica'
        );
        insert into public.tasks (
          id, organization_id, company_id, lead_id, opportunity_id, title
        ) values (
          '${taskId}', '${organizationAId}', '${companyId}', '${leadId}',
          '${opportunityId}', 'Follow-up Therapeutica'
        );
      `)

      const results = await database.query<{
        entity_type: string
        title: string
        action_path: string
      }>(`
        select entity_type, title, action_path
        from public.search_global('${organizationAId}', 'Thera', 25);
      `)
      expect(results.rows.map(({ entity_type }) => entity_type)).toEqual(
        expect.arrayContaining(['company', 'contact', 'lead', 'opportunity', 'task']),
      )
      expect(results.rows.every(({ action_path }) => action_path.startsWith('/'))).toBe(true)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const isolated = await database.query<{ count: number }>(`
        select count(*)::int as count
        from public.search_global('${organizationAId}', 'Therapeutica', 25);
      `)
      expect(isolated.rows[0]?.count).toBe(0)
    } finally {
      await resetAuthentication(database)
    }

    const privileges = await database.query<{ anon_execute: boolean }>(`
      select has_function_privilege(
        'anon', 'public.search_global(uuid,text,integer)', 'execute'
      ) as anon_execute;
    `)
    expect(privileges.rows[0]?.anon_execute).toBe(false)
  })

  it('creates private notifications and respects recipient preferences', async () => {
    const assignedLeadId = '21000000-0000-4000-8000-000000000095'
    const mutedLeadId = '21000000-0000-4000-8000-000000000096'
    const overdueTaskId = '60000000-0000-4000-8000-000000000095'
    const managerMemberId = '11000000-0000-4000-8000-000000000004'

    await authenticateAs(database, managerAId)
    try {
      await database.exec(`
        insert into public.leads (id, organization_id, name, owner_member_id)
        values (
          '${assignedLeadId}', '${organizationAId}', 'Assigned notification lead',
          '${managerMemberId}'
        );
        insert into public.tasks (
          id, organization_id, assigned_member_id, title, due_at
        ) values (
          '${overdueTaskId}', '${organizationAId}', '${managerMemberId}',
          'Overdue notification task', now() - interval '1 day'
        );
      `)

      const refreshed = await database.query<{ refresh_my_notifications: number }>(`
        select public.refresh_my_notifications('${organizationAId}');
      `)
      expect(refreshed.rows[0]?.refresh_my_notifications).toBeGreaterThanOrEqual(1)

      const notifications = await database.query<{ type: string; related_entity_id: string }>(`
        select type, related_entity_id::text
        from public.notifications
        where organization_id = '${organizationAId}'
          and recipient_member_id = '${managerMemberId}'
          and related_entity_id in ('${assignedLeadId}', '${overdueTaskId}');
      `)
      expect(notifications.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'lead_assigned', related_entity_id: assignedLeadId }),
          expect.objectContaining({ type: 'task_overdue', related_entity_id: overdueTaskId }),
        ]),
      )

      await database.exec(`
        insert into public.notification_preferences (
          organization_id, member_id, type, in_app_enabled
        ) values (
          '${organizationAId}', '${managerMemberId}', 'lead_assigned', false
        );
        insert into public.leads (id, organization_id, name, owner_member_id)
        values (
          '${mutedLeadId}', '${organizationAId}', 'Muted assignment', '${managerMemberId}'
        );
      `)
      const muted = await database.query<{ count: number }>(`
        select count(*)::int as count from public.notifications
        where related_entity_id = '${mutedLeadId}';
      `)
      expect(muted.rows[0]?.count).toBe(0)

      await database.exec(`
        update public.notifications set read_at = now()
        where organization_id = '${organizationAId}'
          and recipient_member_id = '${managerMemberId}';
      `)
      const unread = await database.query<{ count: number }>(`
        select count(*)::int as count from public.notifications
        where organization_id = '${organizationAId}'
          and recipient_member_id = '${managerMemberId}' and read_at is null;
      `)
      expect(unread.rows[0]?.count).toBe(0)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const isolated = await database.query<{ count: number }>(`
        select count(*)::int as count from public.notifications
        where organization_id = '${organizationAId}';
      `)
      expect(isolated.rows[0]?.count).toBe(0)
      await expect(
        database.query(`select public.refresh_my_notifications('${organizationAId}');`),
      ).rejects.toThrow(/insufficient permissions/i)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('isolates private attachments and validates organization paths', async () => {
    const path = `${organizationAId}/companies/20000000-0000-4000-8000-000000000001/proposal.pdf`

    const bucket = await database.query<{ public: boolean; file_size_limit: number }>(`
      select public, file_size_limit::int
      from storage.buckets
      where id = 'crm-private-attachments';
    `)
    expect(bucket.rows[0]).toEqual({ public: false, file_size_limit: 20 * 1024 * 1024 })

    await authenticateAs(database, managerAId)
    try {
      await database.exec(`
        insert into storage.objects (bucket_id, name, owner_id)
        values ('crm-private-attachments', '${path}', '${managerAId}');

        insert into public.attachments (
          organization_id, company_id, uploaded_by_member_id,
          storage_bucket, storage_path, file_name, mime_type, size_bytes
        ) values (
          '${organizationAId}', '20000000-0000-4000-8000-000000000001',
          '11000000-0000-4000-8000-000000000001',
          'crm-private-attachments', '${path}', 'proposal.pdf', 'application/pdf', 128
        );
      `)
      const metadata = await database.query<{ uploaded_by_member_id: string }>(`
        select uploaded_by_member_id::text from public.attachments where storage_path = '${path}';
      `)
      expect(metadata.rows[0]?.uploaded_by_member_id).toBe('11000000-0000-4000-8000-000000000004')
      await expect(
        database.exec(`
          insert into public.attachments (
            organization_id, company_id, uploaded_by_member_id,
            storage_bucket, storage_path, file_name, size_bytes
          ) values (
            '${organizationAId}', '20000000-0000-4000-8000-000000000001',
            '11000000-0000-4000-8000-000000000004',
            'crm-private-attachments',
            '${organizationBId}/companies/20000000-0000-4000-8000-000000000001/invalid.pdf',
            'invalid.pdf', 10
          );
        `),
      ).rejects.toThrow(/does not match/i)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const objects = await database.query<{ count: number }>(`
        select count(*)::int as count from storage.objects
        where bucket_id = 'crm-private-attachments';
      `)
      expect(objects.rows[0]?.count).toBe(0)
      await expect(
        database.exec(`
          insert into storage.objects (bucket_id, name, owner_id)
          values ('crm-private-attachments', '${path}-cross-tenant', '${userBId}');
        `),
      ).rejects.toThrow(/row-level security/i)

      const orphanPath = `${organizationBId}/companies/20000000-0000-4000-8000-000000000002/orphan.pdf`
      const linkedPath = `${organizationBId}/companies/20000000-0000-4000-8000-000000000002/linked.pdf`
      await database.exec(`
        insert into storage.objects (bucket_id, name, owner_id)
        values ('crm-private-attachments', '${orphanPath}', '${userBId}');
        delete from storage.objects where name = '${orphanPath}';

        insert into storage.objects (bucket_id, name, owner_id)
        values ('crm-private-attachments', '${linkedPath}', '${userBId}');
        insert into public.attachments (
          organization_id, company_id, uploaded_by_member_id,
          storage_bucket, storage_path, file_name, size_bytes
        ) values (
          '${organizationBId}', '20000000-0000-4000-8000-000000000002',
          '11000000-0000-4000-8000-000000000002',
          'crm-private-attachments', '${linkedPath}', 'linked.pdf', 10
        );
      `)
      await database.exec(`delete from storage.objects where name = '${linkedPath}';`)
      const linkedObject = await database.query<{ count: number }>(`
        select count(*)::int as count from storage.objects where name = '${linkedPath}';
      `)
      expect(linkedObject.rows[0]?.count).toBe(1)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, viewerAId)
    try {
      const objects = await database.query<{ count: number }>(`
        select count(*)::int as count from storage.objects
        where bucket_id = 'crm-private-attachments';
      `)
      expect(objects.rows[0]?.count).toBe(1)
      await expect(
        database.exec(`
          insert into storage.objects (bucket_id, name, owner_id)
          values ('crm-private-attachments', '${path}-viewer', '${viewerAId}');
        `),
      ).rejects.toThrow(/row-level security/i)
    } finally {
      await resetAuthentication(database)
    }
  })

  it('records sanitized append-only audit events without crossing tenants', async () => {
    const companyId = '20000000-0000-4000-8000-000000000097'

    await authenticateAs(database, managerAId)
    try {
      await database.exec(`
        insert into public.companies (
          id, organization_id, trade_name, legal_name, tax_id, email, phone, notes
        ) values (
          '${companyId}', '${organizationAId}', 'Audited Company', 'Audited Company Ltda.',
          '00.000.000/0001-00', 'private@example.com', '+55 11 99999-9999', 'Private note'
        );
        update public.companies
        set trade_name = 'Audited Company Updated', employee_count = 25
        where id = '${companyId}';
      `)

      const events = await database.query<{
        action: string
        previous_values: Record<string, unknown> | null
        new_values: Record<string, unknown> | null
        actor_member_id: string | null
      }>(`
        select action, previous_values, new_values, actor_member_id::text
        from public.audit_logs
        where organization_id = '${organizationAId}'
          and entity_type = 'companies'
          and entity_id = '${companyId}'
        order by created_at;
      `)
      expect(events.rows).toHaveLength(2)
      const insertEvent = events.rows.find((event) => event.action === 'insert')
      const updateEvent = events.rows.find((event) => event.action === 'update')
      expect(insertEvent).toMatchObject({
        action: 'insert',
        actor_member_id: '11000000-0000-4000-8000-000000000004',
        previous_values: null,
      })
      expect(insertEvent?.new_values).not.toHaveProperty('tax_id')
      expect(insertEvent?.new_values).not.toHaveProperty('email')
      expect(insertEvent?.new_values).not.toHaveProperty('phone')
      expect(insertEvent?.new_values).not.toHaveProperty('notes')
      expect(updateEvent).toMatchObject({
        action: 'update',
        previous_values: { employee_count: null, trade_name: 'Audited Company' },
        new_values: { employee_count: 25, trade_name: 'Audited Company Updated' },
      })

      await expect(
        database.exec(`
          insert into public.audit_logs (organization_id, entity_type, action)
          values ('${organizationAId}', 'companies', 'insert');
        `),
      ).rejects.toThrow(/permission denied/i)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const isolated = await database.query<{ count: number }>(`
        select count(*)::int as count from public.audit_logs
        where organization_id = '${organizationAId}' and entity_id = '${companyId}';
      `)
      expect(isolated.rows[0]?.count).toBe(0)
    } finally {
      await resetAuthentication(database)
    }

    const functionPrivilege = await database.query<{ executable: boolean }>(`
      select has_function_privilege(
        'authenticated', 'private.capture_audit_log()', 'execute'
      ) as executable;
    `)
    expect(functionPrivilege.rows[0]?.executable).toBe(false)
  })

  it('manages loss reasons by role without crossing organizations', async () => {
    await authenticateAs(database, managerAId)
    try {
      await database.exec(`
        insert into public.loss_reasons (organization_id, name, description)
        values ('${organizationAId}', 'Prazo', 'Prazo de implantação incompatível.');
      `)
      const ownReasons = await database.query<{ name: string }>(`
        select name from public.loss_reasons
        where organization_id = '${organizationAId}' and name = 'Prazo';
      `)
      expect(ownReasons.rows).toEqual([{ name: 'Prazo' }])
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, viewerAId)
    try {
      await expect(
        database.exec(`
        insert into public.loss_reasons (organization_id, name)
        values ('${organizationAId}', 'Sem verba');
      `),
      ).rejects.toThrow(/row-level security/i)
    } finally {
      await resetAuthentication(database)
    }

    await authenticateAs(database, userBId)
    try {
      const isolated = await database.query<{ count: number }>(`
        select count(*)::int as count from public.loss_reasons
        where organization_id = '${organizationAId}';
      `)
      expect(isolated.rows[0]?.count).toBe(0)
    } finally {
      await resetAuthentication(database)
    }
  })
})
