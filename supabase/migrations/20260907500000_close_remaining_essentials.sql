-- Fechamento dos itens essenciais restantes
create table if not exists public.protocol_versions (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null,
  version integer not null default 1,
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(protocol_id, version)
);

alter table public.protocol_versions enable row level security;
create policy "protocol versions org access" on public.protocol_versions for select using (auth.uid() is not null);

create or replace function public.transfer_aluno_organization(p_aluno_id uuid, p_target_organization_id uuid)
returns public.alunos
language plpgsql security definer set search_path=public
as $$
declare v_row public.alunos;
begin
  update public.alunos set organization_id = p_target_organization_id where id = p_aluno_id returning * into v_row;
  if v_row.id is null then raise exception 'Aluno não encontrado'; end if;
  return v_row;
end;
$$;

create or replace function public.organization_operational_monitoring(p_organization_id uuid)
returns jsonb
language sql security definer set search_path=public
as $$
  select jsonb_build_object(
    'organization_id', p_organization_id,
    'checked_at', now(),
    'status', case when exists(select 1 from public.alunos where organization_id=p_organization_id and status='ativo') then 'online' else 'needs_activation' end,
    'active_residents', (select count(*) from public.alunos where organization_id=p_organization_id and status='ativo'),
    'open_alerts', (select count(*) from public.organization_activation_alert_actions where organization_id=p_organization_id and resolved_at is null)
  );
$$;

grant execute on function public.transfer_aluno_organization(uuid,uuid) to authenticated;
grant execute on function public.organization_operational_monitoring(uuid) to authenticated;
