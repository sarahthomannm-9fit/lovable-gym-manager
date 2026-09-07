alter table public.organization_activation_alert_actions
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references auth.users(id);

create or replace function public.resolve_activation_alert_action(p_action_id uuid)
returns public.organization_activation_alert_actions
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.organization_activation_alert_actions;
begin
  update public.organization_activation_alert_actions a
  set resolved_at = now(), resolved_by = auth.uid()
  where a.id = p_action_id
    and public.is_org_member(a.organization_id)
  returning a.* into v_row;
  if v_row.id is null then raise exception 'Ação não encontrada ou sem acesso'; end if;
  return v_row;
end;
$$;

grant execute on function public.resolve_activation_alert_action(uuid) to authenticated;
