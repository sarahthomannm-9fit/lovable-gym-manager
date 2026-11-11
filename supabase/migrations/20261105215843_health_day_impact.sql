create function public.health_day_impact(p_event uuid)
returns table (
  dias integer, presentes bigint, janela_completa bigint, contas_vinculadas bigint, triagens_enviadas bigint,
  moradores_com_treino bigint,
  moradores_com_sessao bigint, moradores_com_retorno bigint, sessoes_concluidas bigint
)
language plpgsql stable security definer set search_path = '' as $$
declare event_org uuid;
begin
  select organization_id into event_org from public.eventos_condominio where id = p_event;
  if event_org is null or not app_private.org_role(event_org, array['sindico','admin','manager']) then
    raise exception 'Evento indisponível para este perfil' using errcode = '42501';
  end if;

  return query
  with cohort as (
    select registration.aluno_id, registration.checkin_at, student.user_id is not null as has_account
    from public.health_day_inscricoes registration
    join public.alunos student on student.id = registration.aluno_id and student.organization_id = event_org
    where registration.evento_id = p_event and registration.status = 'checkin'
      and registration.checkin_at is not null
  ), windows as (
    select periods.days, cohort.aluno_id, cohort.checkin_at, cohort.has_account,
      cohort.checkin_at + make_interval(hours => periods.days * 24) as window_end
    from (values (7), (30)) periods(days)
    left join cohort on true
  ), activity as (
    select w.days, w.aluno_id, w.window_end, w.has_account,
      exists (
        select 1 from public.anamnese_respostas form
        where form.aluno_id = w.aluno_id and form.status in ('preenchido', 'aprovado')
          and form.preenchido_em >= w.checkin_at and form.preenchido_em < w.window_end
      ) as screened,
      exists (
        select 1 from public.workout_publications publication
        join public.treinos workout on workout.id = publication.treino_id
        where workout.aluno_id = w.aluno_id and workout.organization_id = event_org
          and publication.created_at >= w.checkin_at and publication.created_at < w.window_end
      ) as published,
      (select count(*) from public.workout_sessions session
        join public.treinos workout on workout.id = session.treino_id
        where session.aluno_id = w.aluno_id and workout.aluno_id = w.aluno_id
          and workout.organization_id = event_org and session.status = 'concluido'
          and session.completed_at >= w.checkin_at and session.completed_at < w.window_end
      ) as completions,
      (select count(distinct session.data) from public.workout_sessions session
        join public.treinos workout on workout.id = session.treino_id
        where session.aluno_id = w.aluno_id and workout.aluno_id = w.aluno_id
          and workout.organization_id = event_org and session.status = 'concluido'
          and session.completed_at >= w.checkin_at and session.completed_at < w.window_end
      ) as active_days
    from windows w
  )
  select a.days, count(a.aluno_id), count(*) filter (where a.window_end <= now()),
    count(*) filter (where a.has_account), count(*) filter (where a.screened),
    count(*) filter (where a.published),
    count(*) filter (where a.completions > 0), count(*) filter (where a.active_days > 1),
    coalesce(sum(a.completions), 0)::bigint
  from activity a group by a.days order by a.days;
end;
$$;

revoke all on function public.health_day_impact(uuid) from public, anon;
grant execute on function public.health_day_impact(uuid) to authenticated;
