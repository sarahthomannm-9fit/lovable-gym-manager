-- Orquestração dos workflows do Gym Manager
create table if not exists public.agent_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  workflow_key text not null,
  trigger_key text not null,
  status text not null default 'queued' check (status in ('queued','running','waiting_human','completed','failed','cancelled')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  created_by uuid references auth.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_workflow_runs(id) on delete cascade,
  agent_id text not null,
  task_key text not null,
  sequence integer not null default 0,
  status text not null default 'queued' check (status in ('queued','running','waiting_human','completed','failed','skipped')),
  requires_approval boolean not null default false,
  approval_role text,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.agent_workflow_runs enable row level security;
alter table public.agent_workflow_tasks enable row level security;

create policy "workflow runs org access" on public.agent_workflow_runs
for select using (organization_id is null or public.is_org_member(organization_id));

create policy "workflow tasks org access" on public.agent_workflow_tasks
for select using (exists (
  select 1 from public.agent_workflow_runs r
  where r.id = run_id and (r.organization_id is null or public.is_org_member(r.organization_id))
));

create or replace function public.start_agent_workflow(
  p_organization_id uuid,
  p_workflow_key text,
  p_trigger_key text,
  p_input jsonb default '{}'::jsonb
)
returns public.agent_workflow_runs
language plpgsql security definer set search_path=public
as $$
declare v_run public.agent_workflow_runs;
begin
  if p_organization_id is not null and not public.is_org_member(p_organization_id) then
    raise exception 'Sem acesso ao condomínio';
  end if;
  insert into public.agent_workflow_runs(organization_id, workflow_key, trigger_key, input, created_by)
  values (p_organization_id, p_workflow_key, p_trigger_key, coalesce(p_input, '{}'::jsonb), auth.uid())
  returning * into v_run;
  return v_run;
end;
$$;

grant execute on function public.start_agent_workflow(uuid,text,text,jsonb) to authenticated;
