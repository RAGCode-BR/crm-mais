create table public.loss_reasons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint loss_reasons_organization_id_id_key unique (organization_id, id)
);

create unique index loss_reasons_organization_name_key
on public.loss_reasons (organization_id, lower(name));

create index loss_reasons_organization_active_name_idx
on public.loss_reasons (organization_id, is_active, name);

create index loss_reasons_created_by_idx
on public.loss_reasons (created_by);

create trigger loss_reasons_set_updated_at
before update on public.loss_reasons
for each row execute function private.set_updated_at();

create trigger loss_reasons_set_authenticated_creator
before insert on public.loss_reasons
for each row execute function private.set_authenticated_creator();

create trigger loss_reasons_protect_tenant_identity
before update on public.loss_reasons
for each row execute function private.protect_tenant_identity();

alter table public.loss_reasons enable row level security;

create policy loss_reasons_select_member
on public.loss_reasons for select to authenticated
using (
  (select private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager', 'sales', 'viewer']
  ))
);

create policy loss_reasons_insert_manager
on public.loss_reasons for insert to authenticated
with check (
  (select private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']
  ))
);

create policy loss_reasons_update_manager
on public.loss_reasons for update to authenticated
using (
  (select private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']
  ))
)
with check (
  (select private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']
  ))
);

create policy loss_reasons_delete_manager
on public.loss_reasons for delete to authenticated
using (
  (select private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']
  ))
);

revoke all on table public.loss_reasons from public, anon;
grant select, insert, update, delete on table public.loss_reasons to authenticated;

create trigger loss_reasons_capture_audit_log
after insert or update or delete on public.loss_reasons
for each row execute function private.capture_audit_log();

insert into public.loss_reasons (organization_id, name, description, created_by)
select organization.id, reason.name, reason.description, organization.created_by
from public.organizations as organization
cross join (
  values
    ('Preço', 'Condição comercial ou orçamento incompatível.'),
    ('Concorrente', 'O cliente escolheu outra solução.'),
    ('Sem prioridade', 'A iniciativa deixou de ser prioridade.'),
    ('Sem resposta', 'Não houve retorno após as tentativas de contato.'),
    ('Fora do perfil', 'A oportunidade não atende ao perfil comercial.')
) as reason(name, description)
on conflict do nothing;

create or replace function private.seed_organization_loss_reasons()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.loss_reasons (organization_id, name, description, created_by)
  values
    (new.id, 'Preço', 'Condição comercial ou orçamento incompatível.', new.created_by),
    (new.id, 'Concorrente', 'O cliente escolheu outra solução.', new.created_by),
    (new.id, 'Sem prioridade', 'A iniciativa deixou de ser prioridade.', new.created_by),
    (new.id, 'Sem resposta', 'Não houve retorno após as tentativas de contato.', new.created_by),
    (new.id, 'Fora do perfil', 'A oportunidade não atende ao perfil comercial.', new.created_by);
  return new;
end;
$$;

revoke all on function private.seed_organization_loss_reasons()
from public, anon, authenticated, service_role;

create trigger organizations_seed_loss_reasons
after insert on public.organizations
for each row execute function private.seed_organization_loss_reasons();
