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
  'companies',
  'contacts',
  'entity_tags',
  'lead_sources',
  'leads',
  'notes',
  'notifications',
  'opportunities',
  'organization_members',
  'organizations',
  'pipeline_stages',
  'pipelines',
  'profiles',
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
    const policies = await database.query<{ count: number }>(`
      select count(*)::int as count
      from pg_policies
      where schemaname = 'public';
    `)

    expect(tablesWithoutRls.rows).toEqual([])
    expect(policies.rows[0]?.count).toBe(69)
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

    expect(result.rows[0]?.count).toBe(17)
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
})
