begin;
create function public.resident_workout(p_aluno uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare student public.alunos; workout public.treinos; today date:=(now() at time zone 'America/Sao_Paulo')::date; exercises jsonb; session_row jsonb;
begin
 if not app_private.session_valid() or not app_private.own_student(p_aluno) then
  raise exception 'Cadastro indisponível para esta sessão' using errcode='42501';
 end if;
 select * into strict student from public.alunos where id=p_aluno;
 if not app_private.resident_active(student.status,student.lifecycle_status::text) or not public.student_is_safe_for_workout(student.id) then
  return jsonb_build_object('treino',null,'exercicios','[]'::jsonb,'session',null,'data',today,'reason','Seu cadastro ou sua triagem precisa de liberação antes do treino.');
 end if;
 select * into workout from public.treinos t where t.aluno_id=student.id and t.organization_id=student.organization_id
  and t.status='ativo' and t.data_inicio<=today and (t.data_fim is null or t.data_fim>=today)
  and t.plano_treino_id is not null and exists(select 1 from public.workout_publications p where p.treino_id=t.id)
  order by t.data_inicio desc,t.created_at desc,t.id limit 1;
 if not found then return jsonb_build_object('treino',null,'exercicios','[]'::jsonb,'session',null,'data',today,'reason','Seu professor ainda não publicou um treino vigente.'); end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',pe.id,'nome',e.nome,'series',pe.series,'repeticoes',pe.repeticoes,
  'carga_kg',pe.carga_kg,'descanso_seg',pe.descanso_seg,'observacoes',pe.observacoes,'instrucoes',e.instrucoes,'video_url',e.video_url,'ordem',pe.ordem) order by pe.ordem),'[]'::jsonb)
 into exercises from public.plano_exercicios pe join public.exercicios_biblioteca e on e.id=pe.exercicio_id
 where pe.plano_treino_id=workout.plano_treino_id and pe.dia_semana=extract(isodow from today)::integer and pe.semana=((today-workout.data_inicio)/7)+1;
 select to_jsonb(s) into session_row from public.workout_sessions s where s.treino_id=workout.id and s.aluno_id=student.id and s.data=today;
 return jsonb_build_object('treino',to_jsonb(workout),'exercicios',exercises,'session',session_row,'data',today);
end; $$;
revoke all on function public.resident_workout(uuid) from public,anon;
grant execute on function public.resident_workout(uuid) to authenticated;

create function public.save_resident_workout_session(p_treino_id uuid,p_action text,p_progress jsonb default '{}'::jsonb,p_feedback text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare student_id uuid; today date:=(now() at time zone 'America/Sao_Paulo')::date; current_workout jsonb; saved public.workout_sessions; item text; load_value text;
begin
 if not app_private.session_valid() then raise exception 'Sessão sem acesso ou revogada' using errcode='42501'; end if;
 if p_action is null or p_action not in ('start','save','pause','resume','finish') or jsonb_typeof(p_progress) is distinct from 'object' then raise exception 'Dados de sessão inválidos'; end if;
 select t.aluno_id into student_id from public.treinos t where t.id=p_treino_id and app_private.own_student(t.aluno_id);
 if student_id is null then raise exception 'Treino indisponível' using errcode='42501'; end if;
 perform 1 from public.alunos where id=student_id for update;
 current_workout:=public.resident_workout(student_id);
 if (current_workout->'treino'->>'id')::uuid is distinct from p_treino_id or jsonb_array_length(current_workout->'exercicios')=0 then raise exception 'Treino indisponível hoje'; end if;
 perform pg_advisory_xact_lock(hashtextextended(student_id::text||p_treino_id::text||today::text,0));
 select * into saved from public.workout_sessions where treino_id=p_treino_id and aluno_id=student_id and data=today for update;
 if p_action='start' then
  if saved.id is null then insert into public.workout_sessions(treino_id,aluno_id,data) values(p_treino_id,student_id,today) returning * into saved; end if;
  return to_jsonb(saved);
 end if;
 if saved.id is null then raise exception 'Inicie o treino antes de registrar progresso'; end if;
 if saved.status='concluido' then return to_jsonb(saved); end if;
 if p_action in ('save','pause','finish') and saved.status<>'em_andamento' then raise exception 'Retome a sessão antes de registrar progresso'; end if;
 for item in select jsonb_object_keys(p_progress) loop
  if not exists(select 1 from jsonb_array_elements(current_workout->'exercicios') e where e->>'id'=item)
   or jsonb_typeof(p_progress->item->'completed') is distinct from 'boolean' then raise exception 'Progresso contém exercício inválido'; end if;
  load_value:=coalesce(p_progress->item->>'carga','');
  if load_value<>'' then
   begin if load_value::numeric<0 or load_value::numeric::text in ('NaN','Infinity','-Infinity') then raise exception 'Carga inválida'; end if;
   exception when invalid_text_representation or numeric_value_out_of_range then raise exception 'Carga inválida'; end;
  end if;
 end loop;
 if p_action='finish' and exists(select 1 from jsonb_array_elements(current_workout->'exercicios') e where coalesce(p_progress->(e->>'id')->>'completed','false')<>'true') then raise exception 'Registre todos os exercícios antes de concluir'; end if;
 update public.workout_sessions set progress=p_progress,feedback=left(p_feedback,2000),
  status=case p_action when 'pause' then 'pausado' when 'resume' then 'em_andamento' when 'finish' then 'concluido' else status end,
  updated_at=now(),completed_at=case when p_action='finish' then now() else completed_at end
 where id=saved.id returning * into saved;
 if p_action='finish' then insert into public.treino_execucoes(treino_id,aluno_id,data_execucao,concluido,carga_real,observacoes) values(p_treino_id,student_id,today,true,p_progress,left(p_feedback,2000)); end if;
 return to_jsonb(saved);
end; $$;
revoke all on function public.save_resident_workout_session(uuid,text,jsonb,text) from public,anon;
grant execute on function public.save_resident_workout_session(uuid,text,jsonb,text) to authenticated;
commit;
