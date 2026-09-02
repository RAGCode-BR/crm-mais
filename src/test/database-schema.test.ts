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
      ) values (
        '40000000-0000-4000-8000-000000000001',
        '${organizationAId}',
        '30000000-0000-4000-8000-000000000001',
        'New',
        0
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
    expect(policies.rows[0]?.count).toBe(71)
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

  it('enforces lifecycle consistency for opportunities and tasks', async () => {
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

    await expect(
      database.exec(`
        insert into public.tasks (
          organization_id,
          title,
          status
        ) values (
          '10000000-0000-4000-8000-000000000001',
          'Invalid completed task',
          'completed'
        );
      `),
    ).rejects.toThrow(/tasks_completed_at_check/i)
  })
})
