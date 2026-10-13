create or replace function public.dashboard_sindico(p_org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if (select auth.uid()) is null or p_org_id is null then
    raise exception 'Acesso não autorizado' using errcode = '42501';
  end if;

  if not (select public.is_admin(auth.uid())) and not exists (
    select 1 from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = (select auth.uid())
      and om.papel in ('admin', 'manager', 'sindico', 'professor')
  ) then
    raise exception 'Organização não autorizada' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'alunos_ativos', (
      select count(*) from public.alunos
      where organization_id = p_org_id and lifecycle_status = 'ativo'
    ),
    'receita_mes', (
      select coalesce(sum(p.valor), 0)
      from public.pagamentos p join public.alunos a on a.id = p.aluno_id
      where a.organization_id = p_org_id
        and p.data_pagamento >= date_trunc('month', now()) and p.status = 'pago'
    ),
    'inadimplentes', (
      select count(distinct p.aluno_id)
      from public.pagamentos p join public.alunos a on a.id = p.aluno_id
      where a.organization_id = p_org_id
        and p.status = 'pendente' and p.data_vencimento < current_date
    ),
    'valor_inadimplencia', (
      select coalesce(sum(p.valor), 0)
      from public.pagamentos p join public.alunos a on a.id = p.aluno_id
      where a.organization_id = p_org_id
        and p.status = 'pendente' and p.data_vencimento < current_date
    ),
    'aulas_hoje', (
      select count(*) from public.aulas
      where organization_id = p_org_id and data_aula = current_date
        and status <> 'cancelada'
    ),
    'ocupacao_media', (
      select round(avg(inscritos_atual::numeric / nullif(capacidade_maxima, 0) * 100), 1)
      from public.aulas
      where organization_id = p_org_id and data_aula >= current_date - 30
        and status <> 'cancelada'
    ),
    'status', case when exists (
      select 1 from public.pagamentos p join public.alunos a on a.id = p.aluno_id
      where a.organization_id = p_org_id
        and p.status = 'pendente' and p.data_vencimento < current_date
    ) then 'atencao' else 'saudavel' end
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.dashboard_sindico(uuid) from public, anon;
grant execute on function public.dashboard_sindico(uuid) to authenticated;

