-- BLOCO 4: configurable pipelines, opportunity dispositions and tracked stage moves.

alter table public.opportunities
  drop constraint opportunities_status_check;

alter table public.opportunities
  add constraint opportunities_status_check
  check (status in (
    'open', 'no_response', 'discarded', 'lost', 'reactivate_later', 'won'
  ));

alter table public.opportunities
  drop constraint opportunities_closed_at_check;

alter table public.opportunities
  add constraint opportunities_closed_at_check
  check (
    (status in ('open', 'no_response', 'reactivate_later') and closed_at is null)
    or (status in ('discarded', 'lost', 'won') and closed_at is not null)
  );

create or replace function private.create_default_pipeline(
  target_organization_id uuid,
  target_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  pipeline_id uuid;
begin
  select id into pipeline_id
  from public.pipelines
  where organization_id = target_organization_id
    and is_default
  order by created_at
  limit 1;

  if pipeline_id is not null then
    return pipeline_id;
  end if;

  insert into public.pipelines (
    organization_id, name, description, is_default, created_by
  ) values (
    target_organization_id,
    'Pipeline Comercial',
    'Fluxo comercial padrão para prospecção e vendas.',
    true,
    target_created_by
  )
  returning id into pipeline_id;

  insert into public.pipeline_stages (
    organization_id, pipeline_id, name, position, default_probability,
    is_closed, is_won, is_lost, created_by
  ) values
    (target_organization_id, pipeline_id, 'Novo Lead', 1, 10, false, false, false, target_created_by),
    (target_organization_id, pipeline_id, 'Pesquisa', 2, 15, false, false, false, target_created_by),
    (target_organization_id, pipeline_id, 'Contato Inicial', 3, 25, false, false, false, target_created_by),
    (target_organization_id, pipeline_id, 'Contato Realizado', 4, 35, false, false, false, target_created_by),
    (target_organization_id, pipeline_id, 'Qualificação', 5, 50, false, false, false, target_created_by),
    (target_organization_id, pipeline_id, 'Reunião Agendada', 6, 65, false, false, false, target_created_by),
    (target_organization_id, pipeline_id, 'Proposta', 7, 80, false, false, false, target_created_by),
    (target_organization_id, pipeline_id, 'Negociação', 8, 90, false, false, false, target_created_by),
    (target_organization_id, pipeline_id, 'Ganho', 9, 100, true, true, false, target_created_by);

  return pipeline_id;
end;
$$;

revoke all on function private.create_default_pipeline(uuid, uuid)
  from public, anon, authenticated, service_role;

do $$
declare
  organization_record record;
begin
  for organization_record in
    select id, created_by
    from public.organizations
    where not exists (
      select 1 from public.pipelines
      where pipelines.organization_id = organizations.id
    )
  loop
    perform private.create_default_pipeline(
      organization_record.id,
      organization_record.created_by
    );
  end loop;
end;
$$;

create or replace function private.bootstrap_default_pipeline()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.create_default_pipeline(new.id, new.created_by);
  return new;
end;
$$;

revoke all on function private.bootstrap_default_pipeline()
  from public, anon, authenticated, service_role;

create trigger organizations_create_default_pipeline
after insert on public.organizations
for each row execute function private.bootstrap_default_pipeline();

create or replace function private.prevent_untracked_stage_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.stage_id is distinct from old.stage_id
    or new.pipeline_id is distinct from old.pipeline_id
  ) and coalesce(current_setting('crm.stage_change_tracked', true), '') <> 'true' then
    raise exception 'opportunity stage changes must use move_opportunity()'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger opportunities_require_tracked_stage_change
before update of pipeline_id, stage_id on public.opportunities
for each row execute function private.prevent_untracked_stage_change();

create or replace function public.move_opportunity(
  opportunity_id uuid,
  target_stage_id uuid,
  target_loss_reason text default null
)
returns public.opportunities
language plpgsql
security invoker
set search_path = ''
as $$
declare
  opportunity_record public.opportunities%rowtype;
  source_stage public.pipeline_stages%rowtype;
  target_stage public.pipeline_stages%rowtype;
  actor_member_id uuid;
  next_status text;
  next_closed_at timestamptz;
  result public.opportunities%rowtype;
begin
  select * into opportunity_record
  from public.opportunities
  where id = opportunity_id;

  if not found then
    raise exception 'opportunity not found' using errcode = 'P0002';
  end if;

  select * into source_stage
  from public.pipeline_stages
  where id = opportunity_record.stage_id
    and organization_id = opportunity_record.organization_id;

  select * into target_stage
  from public.pipeline_stages
  where id = target_stage_id
    and organization_id = opportunity_record.organization_id;

  if not found then
    raise exception 'target stage not found' using errcode = 'P0002';
  end if;

  if target_stage.id = opportunity_record.stage_id then
    return opportunity_record;
  end if;

  if target_stage.is_won then
    next_status := 'won';
    next_closed_at := now();
  elsif target_stage.is_lost then
    next_status := 'lost';
    next_closed_at := now();
    if coalesce(nullif(btrim(target_loss_reason), ''), opportunity_record.loss_reason) is null then
      raise exception 'loss reason is required for a lost stage' using errcode = '23514';
    end if;
  else
    next_status := 'open';
    next_closed_at := null;
  end if;

  select id into actor_member_id
  from public.organization_members
  where organization_id = opportunity_record.organization_id
    and profile_id = auth.uid()
    and status = 'active'
  limit 1;

  perform set_config('crm.stage_change_tracked', 'true', true);

  update public.opportunities
  set pipeline_id = target_stage.pipeline_id,
      stage_id = target_stage.id,
      status = next_status,
      probability = target_stage.default_probability,
      closed_at = next_closed_at,
      loss_reason = case
        when next_status = 'lost' then coalesce(nullif(btrim(target_loss_reason), ''), opportunities.loss_reason)
        else null
      end
  where id = opportunity_record.id
  returning * into result;

  insert into public.activities (
    organization_id, company_id, contact_id, lead_id, opportunity_id,
    actor_member_id, type, subject, description, metadata
  ) values (
    opportunity_record.organization_id,
    opportunity_record.company_id,
    opportunity_record.contact_id,
    opportunity_record.lead_id,
    opportunity_record.id,
    actor_member_id,
    'stage_change',
    source_stage.name || ' → ' || target_stage.name,
    'Oportunidade movida entre etapas do pipeline.',
    jsonb_build_object(
      'from_pipeline_id', source_stage.pipeline_id,
      'from_stage_id', source_stage.id,
      'from_stage_name', source_stage.name,
      'to_pipeline_id', target_stage.pipeline_id,
      'to_stage_id', target_stage.id,
      'to_stage_name', target_stage.name
    )
  );

  return result;
end;
$$;

revoke all on function public.move_opportunity(uuid, uuid, text)
  from public, anon;
grant execute on function public.move_opportunity(uuid, uuid, text)
  to authenticated;

create or replace function public.save_pipeline_configuration(
  target_organization_id uuid,
  target_pipeline_id uuid,
  pipeline_name text,
  pipeline_description text,
  pipeline_is_default boolean,
  pipeline_is_active boolean,
  stages jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_pipeline_id uuid;
  stage_item jsonb;
  saved_stage_id uuid;
  kept_stage_ids uuid[] := '{}'::uuid[];
  stage_position integer := 0;
begin
  if not private.has_organization_role(
    target_organization_id,
    array['owner', 'admin', 'manager']
  ) then
    raise exception 'insufficient pipeline management permission' using errcode = '42501';
  end if;

  if length(btrim(pipeline_name)) = 0 then
    raise exception 'pipeline name is required' using errcode = '23514';
  end if;

  if jsonb_typeof(stages) <> 'array'
    or jsonb_array_length(stages) = 0
    or jsonb_array_length(stages) > 100 then
    raise exception 'pipeline must have between 1 and 100 stages' using errcode = '23514';
  end if;

  if pipeline_is_default then
    update public.pipelines
    set is_default = false
    where organization_id = target_organization_id
      and is_default
      and (target_pipeline_id is null or id <> target_pipeline_id);
  end if;

  if target_pipeline_id is null then
    insert into public.pipelines (
      organization_id, name, description, is_default, is_active
    ) values (
      target_organization_id,
      btrim(pipeline_name),
      nullif(btrim(pipeline_description), ''),
      pipeline_is_default,
      pipeline_is_active
    ) returning id into saved_pipeline_id;
  else
    update public.pipelines
    set name = btrim(pipeline_name),
        description = nullif(btrim(pipeline_description), ''),
        is_default = pipeline_is_default,
        is_active = pipeline_is_active
    where id = target_pipeline_id
      and organization_id = target_organization_id
    returning id into saved_pipeline_id;

    if saved_pipeline_id is null then
      raise exception 'pipeline not found' using errcode = 'P0002';
    end if;

    update public.pipeline_stages as pipeline_stage
    set position = temporary_stage.position,
        name = pipeline_stage.name || ' [configuring ' || pipeline_stage.id || ']'
    from (
      select id, (20000 + row_number() over (order by position))::smallint as position
      from public.pipeline_stages
      where pipeline_id = saved_pipeline_id
    ) as temporary_stage
    where pipeline_stage.id = temporary_stage.id;
  end if;

  for stage_item in select value from jsonb_array_elements(stages)
  loop
    stage_position := stage_position + 1;

    if length(btrim(coalesce(stage_item ->> 'name', ''))) = 0 then
      raise exception 'stage name is required' using errcode = '23514';
    end if;

    if coalesce((stage_item ->> 'probability')::integer, -1) not between 0 and 100 then
      raise exception 'stage probability must be between 0 and 100' using errcode = '23514';
    end if;

    saved_stage_id := nullif(stage_item ->> 'id', '')::uuid;

    if saved_stage_id is null then
      insert into public.pipeline_stages (
        organization_id, pipeline_id, name, position, default_probability,
        is_closed, is_won, is_lost
      ) values (
        target_organization_id,
        saved_pipeline_id,
        btrim(stage_item ->> 'name'),
        stage_position,
        (stage_item ->> 'probability')::smallint,
        coalesce((stage_item ->> 'isWon')::boolean, false)
          or coalesce((stage_item ->> 'isLost')::boolean, false),
        coalesce((stage_item ->> 'isWon')::boolean, false),
        coalesce((stage_item ->> 'isLost')::boolean, false)
      ) returning id into saved_stage_id;
    else
      update public.pipeline_stages
      set name = btrim(stage_item ->> 'name'),
          position = stage_position,
          default_probability = (stage_item ->> 'probability')::smallint,
          is_won = coalesce((stage_item ->> 'isWon')::boolean, false),
          is_lost = coalesce((stage_item ->> 'isLost')::boolean, false),
          is_closed = coalesce((stage_item ->> 'isWon')::boolean, false)
            or coalesce((stage_item ->> 'isLost')::boolean, false)
      where id = saved_stage_id
        and pipeline_id = saved_pipeline_id
        and organization_id = target_organization_id;

      if not found then
        raise exception 'pipeline stage not found' using errcode = 'P0002';
      end if;
    end if;

    kept_stage_ids := array_append(kept_stage_ids, saved_stage_id);
  end loop;

  delete from public.pipeline_stages
  where pipeline_id = saved_pipeline_id
    and not (id = any(kept_stage_ids));

  return saved_pipeline_id;
end;
$$;

revoke all on function public.save_pipeline_configuration(
  uuid, uuid, text, text, boolean, boolean, jsonb
) from public, anon;
grant execute on function public.save_pipeline_configuration(
  uuid, uuid, text, text, boolean, boolean, jsonb
) to authenticated;
