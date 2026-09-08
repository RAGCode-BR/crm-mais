-- Block 8: productivity-oriented prospecting lists.
create table public.prospecting_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  description text,
  owner_member_id uuid,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint prospecting_lists_organization_id_id_key unique (organization_id, id),
  constraint prospecting_lists_owner_member_fkey
    foreign key (organization_id, owner_member_id)
    references public.organization_members (organization_id, id)
);

create table public.prospecting_list_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  list_id uuid not null,
  company_id uuid,
  lead_id uuid,
  assigned_member_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'contacted', 'qualified', 'discarded')),
  last_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint prospecting_list_items_organization_id_id_key unique (organization_id, id),
  constraint prospecting_list_items_list_fkey
    foreign key (organization_id, list_id)
    references public.prospecting_lists (organization_id, id) on delete cascade,
  constraint prospecting_list_items_company_fkey
    foreign key (organization_id, company_id)
    references public.companies (organization_id, id),
  constraint prospecting_list_items_lead_fkey
    foreign key (organization_id, lead_id)
    references public.leads (organization_id, id),
  constraint prospecting_list_items_assigned_member_fkey
    foreign key (organization_id, assigned_member_id)
    references public.organization_members (organization_id, id),
  constraint prospecting_list_items_single_entity_check
    check (num_nonnulls(company_id, lead_id) = 1)
);

create index prospecting_lists_organization_updated_idx
  on public.prospecting_lists (organization_id, updated_at desc)
  where status <> 'archived';
create index prospecting_lists_owner_idx
  on public.prospecting_lists (organization_id, owner_member_id)
  where owner_member_id is not null and status <> 'archived';
create index prospecting_lists_created_by_idx
  on public.prospecting_lists (created_by)
  where created_by is not null;
create index prospecting_list_items_list_status_idx
  on public.prospecting_list_items (organization_id, list_id, status, created_at desc);
create index prospecting_list_items_assignee_idx
  on public.prospecting_list_items (organization_id, assigned_member_id, status)
  where assigned_member_id is not null;
create unique index prospecting_list_items_company_key
  on public.prospecting_list_items (organization_id, list_id, company_id)
  where company_id is not null;
create unique index prospecting_list_items_lead_key
  on public.prospecting_list_items (organization_id, list_id, lead_id)
  where lead_id is not null;
create index prospecting_list_items_company_idx
  on public.prospecting_list_items (organization_id, company_id)
  where company_id is not null;
create index prospecting_list_items_lead_idx
  on public.prospecting_list_items (organization_id, lead_id)
  where lead_id is not null;
create index prospecting_list_items_created_by_idx
  on public.prospecting_list_items (created_by)
  where created_by is not null;

create trigger prospecting_lists_set_updated_at
before update on public.prospecting_lists
for each row execute function private.set_updated_at();
create trigger prospecting_list_items_set_updated_at
before update on public.prospecting_list_items
for each row execute function private.set_updated_at();

create trigger prospecting_lists_set_authenticated_creator
before insert on public.prospecting_lists
for each row execute function private.set_authenticated_creator();
create trigger prospecting_list_items_set_authenticated_creator
before insert on public.prospecting_list_items
for each row execute function private.set_authenticated_creator();

create trigger prospecting_lists_protect_tenant_identity
before update on public.prospecting_lists
for each row execute function private.protect_tenant_identity();
create trigger prospecting_list_items_protect_tenant_identity
before update on public.prospecting_list_items
for each row execute function private.protect_tenant_identity();

alter table public.prospecting_lists enable row level security;
alter table public.prospecting_lists force row level security;
alter table public.prospecting_list_items enable row level security;
alter table public.prospecting_list_items force row level security;

create policy prospecting_lists_select_member
on public.prospecting_lists for select to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales', 'viewer']
)));
create policy prospecting_lists_insert_sales
on public.prospecting_lists for insert to authenticated
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales']
)));
create policy prospecting_lists_update_sales
on public.prospecting_lists for update to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales']
)))
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales']
)));
create policy prospecting_lists_delete_manager
on public.prospecting_lists for delete to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager']
)));

create policy prospecting_list_items_select_member
on public.prospecting_list_items for select to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales', 'viewer']
)));
create policy prospecting_list_items_insert_sales
on public.prospecting_list_items for insert to authenticated
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales']
)));
create policy prospecting_list_items_update_sales
on public.prospecting_list_items for update to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales']
)))
with check ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales']
)));
create policy prospecting_list_items_delete_sales
on public.prospecting_list_items for delete to authenticated
using ((select private.has_organization_role(
  organization_id, array['owner', 'admin', 'manager', 'sales']
)));

revoke all on table public.prospecting_lists, public.prospecting_list_items
from public, anon;
grant select, insert, update on table public.prospecting_lists to authenticated;
grant delete on table public.prospecting_lists to authenticated;
grant select, insert, update, delete on table public.prospecting_list_items to authenticated;

revoke all on table public.prospecting_lists, public.prospecting_list_items
  from public, anon;
grant select, insert, update, delete on table
  public.prospecting_lists, public.prospecting_list_items
to authenticated;
