-- Histórico de ações recomendadas pela ativação do condomínio
create table if not exists public.organization_activation_alert_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  alert_type text not null,
  action_label text not null,
  acted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.organization_activation_alert_actions enable row level security;

create policy "organization members can view activation actions"
on public.organization_activation_alert_actions for select
using (public.is_org_member(organization_id));

create policy "organization members can insert activation actions"
on public.organization_activation_alert_actions for insert
with check (public.is_org_member(organization_id) and acted_by = auth.uid());

create or replace function public.record_activation_alert_action(
  p_organization_id uuid,
  p_alert_type text,
  p_action_label text
)
returns public.organization_activation_alert_actions
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.organization_activation_alert_actions;
begin
  if not public.is_org_member(p_organization_id) then
    raise exception 'Sem acesso ao condomínio';
  end if;
  insert into public.organization_activation_alert_actions(organization_id, alert_type, action_label, acted_by)
  values (p_organization_id, p_alert_type, p_action_label, auth.uid())
  returning * into v_row;
  return v_row;
end;
$$;

grant execute on function public.record_activation_alert_action(uuid,text,text) to authenticated;
