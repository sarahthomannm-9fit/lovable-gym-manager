create function public.fitness_delivery_readiness(p_org uuid)
returns table (etapa integer, criterio text, quantidade bigint, proximo_passo text)
language plpgsql stable security definer set search_path = '' as $$
declare baseline jsonb;
begin
  -- The existing readiness RPC also checks the caller and condominium type.
  baseline := public.organization_operation_readiness(p_org);
  return query
  with original as (
    select entry->>'key' as key, (entry->>'count')::bigint as amount
    from jsonb_array_elements(baseline->'checks') entry
  ), recent_days as (
    select session.aluno_id, count(distinct session.data) as days
    from public.workout_sessions session
    join public.treinos workout on workout.id=session.treino_id and workout.aluno_id=session.aluno_id
    join public.alunos student on student.id=session.aluno_id and student.organization_id=p_org
    where workout.organization_id=p_org and session.status='concluido' and coalesce(session.completion_kind,'complete')='complete'
      and session.completed_at between now()-interval '30 days' and now()
    group by session.aluno_id
  )
  select * from (values
    (1,'Moradores ativos com acesso',coalesce((select amount from original where key='residents'),0),
      'Teste o QR da academia e confirme a entrada de um morador.'),
    (2,'Professores vinculados e ativos',coalesce((select amount from original where key='coach'),0),
      'Vincule um professor ativo e homologue um caso elegível e um encaminhamento.'),
    (3,'Infraestrutura aprovada',coalesce((select amount from original where key='facilities'),0),
      'Confira o inventário e os exercícios disponíveis na academia.'),
    (3,'Protocolos iniciantes com exercícios',(
      select count(*) from public.workout_protocol_templates t
      where t.ativo and t.nivel='iniciante' and (t.organization_id is null or t.organization_id=p_org)
        and case when jsonb_typeof(t.estrutura->'exercicios')='array'
          then jsonb_array_length(t.estrutura->'exercicios') between 3 and 100
            and not exists (
              select 1 from jsonb_array_elements(t.estrutura->'exercicios') item
              where not exists (
                select 1 from public.exercicios_biblioteca e
                where e.id::text=item->>'exercicio_id' and e.ativo
                  and (e.organization_id is null or e.organization_id=p_org)
              )
            )
          else false end
    ),'Peça ao professor para salvar um protocolo revisado a partir de um treino publicado.'),
    (3,'Moradores com treino liberado e vigente',coalesce((select amount from original where key='workout'),0),
      'Publique um plano pelo perfil de professor e confira no app do morador.'),
    (4,'Moradores com sessão concluída nos últimos 30 dias',(select count(*) from recent_days),
      'Valide o registro da primeira sessão e a atualização do acompanhamento do professor.'),
    (4,'Moradores que treinaram em pelo menos dois dias nos últimos 30 dias',(
      select count(*) from recent_days where days >= 2
    ),'Comprove o retorno em outro dia e confira os indicadores agregados do síndico.')
  ) as checks(phase,label,amount,next_step)
  order by checks.phase, checks.label;
end;
$$;

revoke all on function public.fitness_delivery_readiness(uuid) from public,anon;
grant execute on function public.fitness_delivery_readiness(uuid) to authenticated;
