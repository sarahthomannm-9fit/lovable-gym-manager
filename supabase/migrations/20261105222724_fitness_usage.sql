create function public.condominium_fitness_usage(p_org uuid)
returns table (periodo integer, moradores bigint, retornaram bigint, sessoes bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not app_private.org_role(p_org, array['sindico','admin','manager']) then
    raise exception 'Condomínio indisponível para este perfil' using errcode = '42501';
  end if;
  return query
  with by_resident as (
    select session.aluno_id,
      count(*) filter (where session.completed_at >= now() - interval '7 days') as sessions_7,
      count(distinct session.data) filter (where session.completed_at >= now() - interval '7 days') as days_7,
      count(*) as sessions_30,
      count(distinct session.data) as days_30
    from public.workout_sessions session
    join public.treinos workout on workout.id = session.treino_id
      and workout.aluno_id = session.aluno_id
    where workout.organization_id = p_org and session.status = 'concluido'
      and session.completed_at between now() - interval '30 days' and now()
    group by session.aluno_id
  )
  select 7, count(*) filter (where sessions_7 > 0), count(*) filter (where days_7 >= 2),
    coalesce(sum(sessions_7),0)::bigint from by_resident
  union all
  select 30, count(*), count(*) filter (where days_30 >= 2),
    coalesce(sum(sessions_30),0)::bigint from by_resident;
end;
$$;

revoke all on function public.condominium_fitness_usage(uuid) from public, anon;
grant execute on function public.condominium_fitness_usage(uuid) to authenticated;
create function public.coach_fitness_followup(p_org uuid)
returns table (aluno_id uuid, aluno_nome text, treino_nome text, ultima_sessao timestamptz, sessoes_concluidas bigint, acompanhamento text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not app_private.org_role(p_org, array['professor','admin','manager']) then
    raise exception 'Condomínio indisponível para este perfil' using errcode = '42501';
  end if;
  return query
  select student.id, student.nome::text, workout.nome::text, activity.last_session, activity.completions,
    case
      when activity.completions = 0 then 'sem_primeira'
      when activity.last_session <= now() - interval '14 days' then 'sem_retorno'
      else 'recente'
    end
  from public.alunos student
  join lateral (
    select t.id, t.nome
    from public.treinos t
    where t.aluno_id = student.id and t.organization_id = p_org and t.status = 'ativo'
      and t.data_inicio <= (now() at time zone 'America/Sao_Paulo')::date
      and (t.data_fim is null or t.data_fim >= (now() at time zone 'America/Sao_Paulo')::date)
      and exists (select 1 from public.workout_publications pub where pub.treino_id = t.id)
    order by t.data_inicio desc, t.created_at desc, t.id
    limit 1
  ) workout on true
  left join lateral (
    select max(s.completed_at) as last_session, count(*) as completions
    from public.workout_sessions s
    where s.treino_id = workout.id and s.aluno_id = student.id and s.status = 'concluido' and s.completed_at is not null
  ) activity on true
  where student.organization_id = p_org
    and app_private.student_role(student.id, array['professor','admin','manager'])
  order by activity.last_session nulls first, student.nome, student.id;
end;
$$;

revoke all on function public.coach_fitness_followup(uuid) from public, anon;
grant execute on function public.coach_fitness_followup(uuid) to authenticated;
