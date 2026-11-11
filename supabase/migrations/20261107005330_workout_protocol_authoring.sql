create function public.create_protocol_from_workout(p_workout uuid, p_name text, p_goal text, p_level text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  workout public.treinos;
  protocol_id uuid;
  exercises jsonb;
  structure jsonb;
  session_count integer;
  protocol_name text := btrim(coalesce(p_name, ''));
begin
  select * into workout from public.treinos where id=p_workout;
  if workout.id is null or not app_private.student_matches(workout.aluno_id, workout.organization_id)
    or not app_private.student_role(workout.aluno_id, array['admin','manager','professor']) then
    raise exception 'Treino indisponível para este perfil' using errcode='42501';
  end if;
  if length(protocol_name) not between 2 and 120
    or p_goal is null or p_goal not in ('Força','Postural e mobilidade','Cardio','Hipertrofia','Emagrecimento','Funcional')
    or p_level is null or p_level not in ('iniciante','intermediário','avançado') then
    raise exception 'Confira o nome, o objetivo e o nível do protocolo';
  end if;
  if not exists (select 1 from public.workout_publications where treino_id=workout.id) then
    raise exception 'Escolha um treino publicado pelo editor';
  end if;

  select jsonb_agg(jsonb_build_object(
      'exercicio_id', item.exercicio_id, 'dia_semana', item.dia_semana,
      'series', item.series, 'repeticoes', item.repeticoes, 'descanso_seg', item.descanso_seg
    ) order by item.ordem, item.id), count(distinct item.dia_semana)
  into exercises, session_count
  from public.plano_exercicios item
  join public.exercicios_biblioteca exercise on exercise.id=item.exercicio_id and exercise.ativo
    and (exercise.organization_id is null or exercise.organization_id=workout.organization_id)
  where item.plano_treino_id=workout.plano_treino_id and item.semana=1;
  if coalesce(jsonb_array_length(exercises),0) not between 3 and 100
    or jsonb_array_length(exercises) <> (
      select count(*) from public.plano_exercicios
      where plano_treino_id=workout.plano_treino_id and semana=1
    ) then
    raise exception 'O plano precisa de pelo menos três exercícios ativos e compatíveis com o catálogo';
  end if;

  structure := jsonb_build_object('exercicios', exercises);
  perform pg_advisory_xact_lock(hashtextextended(workout.organization_id::text || ':' || lower(protocol_name),0));
  select id into protocol_id from public.workout_protocol_templates
  where organization_id=workout.organization_id and ativo
    and nome=protocol_name and objetivo=p_goal and nivel=p_level and estrutura=structure
  limit 1;
  if protocol_id is not null then return protocol_id; end if;
  insert into public.workout_protocol_templates(organization_id,nome,objetivo,nivel,sessoes_semana,estrutura)
    values(workout.organization_id,protocol_name,p_goal,p_level,session_count,structure)
    returning id into protocol_id;
  return protocol_id;
end;
$$;

revoke all on function public.create_protocol_from_workout(uuid,text,text,text) from public,anon;
grant execute on function public.create_protocol_from_workout(uuid,text,text,text) to authenticated;
