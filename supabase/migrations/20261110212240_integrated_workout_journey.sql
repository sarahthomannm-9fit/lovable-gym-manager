begin;
alter table public.plano_exercicios add column alternativas jsonb not null default '[]'::jsonb check(jsonb_typeof(alternativas)='array' and jsonb_array_length(alternativas)<=3);
alter table public.workout_sessions add column prescription jsonb,add column completion_kind text check(completion_kind in ('complete','partial')),add column attention text check(attention in ('discomfort'));
alter table public.organization_facilities add column availability text not null default 'available' check(availability in ('available','unavailable')),add column availability_note text;
CREATE OR REPLACE FUNCTION public.publish_workout(p_request_id uuid,p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user uuid:=auth.uid();v_student public.alunos;v_plan uuid;v_workout uuid;
 v_start date;v_weeks integer;v_ex jsonb;v_week integer;v_restrictions text[];
BEGIN
 IF NOT app_private.session_valid() OR p_request_id IS NULL OR p_payload IS NULL THEN RAISE EXCEPTION 'Publicação inválida ou sessão encerrada' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_student FROM public.alunos WHERE id=(p_payload->>'aluno_id')::uuid FOR UPDATE;
 IF v_student.id IS NULL OR NOT app_private.student_role(v_student.id,ARRAY['manager','professor']) THEN RAISE EXCEPTION 'Sem permissão para prescrever neste condomínio' USING ERRCODE='42501'; END IF;
 IF NOT app_private.resident_active(v_student.status,v_student.lifecycle_status::text) THEN RAISE EXCEPTION 'Morador inativo ou suspenso'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 SELECT treino_id INTO v_workout FROM public.workout_publications WHERE request_id=p_request_id;
 IF FOUND THEN
  IF NOT EXISTS(SELECT 1 FROM public.workout_publications WHERE request_id=p_request_id AND user_id=v_user AND payload=p_payload) THEN RAISE EXCEPTION 'Identificador de publicação já utilizado'; END IF;
  RETURN v_workout;
 END IF;
 IF NOT public.student_is_safe_for_workout(v_student.id) THEN RAISE EXCEPTION 'Triagem pendente de avaliação profissional'; END IF;
 v_start:=(p_payload->>'data_inicio')::date;v_weeks:=(p_payload->>'semanas')::integer;
 IF v_start IS NULL OR v_weeks IS NULL OR v_weeks NOT BETWEEN 4 AND 12 OR length(btrim(coalesce(p_payload->>'nome','')))<1 OR jsonb_typeof(p_payload->'exercicios') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Dados do treino inválidos'; END IF;
 IF jsonb_array_length(p_payload->'exercicios') NOT BETWEEN 3 AND 100 THEN RAISE EXCEPTION 'Adicione de 3 a 100 exercícios'; END IF;
 SELECT coalesce(restricoes,'{}')||coalesce(lesoes_atuais,'{}') INTO v_restrictions FROM public.student_safety_onboarding WHERE aluno_id=v_student.id;
 FOR v_ex IN SELECT value FROM jsonb_array_elements(p_payload->'exercicios') LOOP
  IF exists(select 1 from jsonb_array_elements(coalesce(v_ex->'alternativas','[]')) a where a->>'exercicio_id'=v_ex->>'exercicio_id') or (select count(*)<>count(distinct a->>'exercicio_id') from jsonb_array_elements(coalesce(v_ex->'alternativas','[]')) a) THEN RAISE EXCEPTION 'Alternativas duplicadas ou iguais ao principal'; END IF;
  IF jsonb_typeof(coalesce(v_ex->'alternativas','[]'::jsonb)) IS DISTINCT FROM 'array' OR jsonb_array_length(coalesce(v_ex->'alternativas','[]'))>3 THEN RAISE EXCEPTION 'Até três alternativas por exercício'; END IF;
 END LOOP;
 FOR v_ex IN SELECT value FROM jsonb_array_elements(p_payload->'exercicios') UNION ALL SELECT alt.value || jsonb_build_object('dia_semana',main.value->'dia_semana') FROM jsonb_array_elements(p_payload->'exercicios') main CROSS JOIN LATERAL jsonb_array_elements(coalesce(main.value->'alternativas','[]')) alt LOOP
  IF coalesce((v_ex->>'dia_semana')::integer,0) NOT BETWEEN 1 AND 7 OR coalesce((v_ex->>'series')::integer,0) NOT BETWEEN 1 AND 30 OR length(btrim(coalesce(v_ex->>'repeticoes','')))=0 OR coalesce((v_ex->>'descanso_seg')::integer,-1) NOT BETWEEN 0 AND 1800 OR (coalesce((v_ex->>'carga_kg')::numeric,0)<0 OR coalesce(v_ex->>'carga_kg','0') IN ('NaN','Infinity','-Infinity')) THEN RAISE EXCEPTION 'Parâmetros de exercício inválidos'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.exercicios_biblioteca e WHERE e.id=(v_ex->>'exercicio_id')::uuid AND e.ativo=true AND (e.organization_id IS NULL OR e.organization_id=v_student.organization_id)
   AND NOT EXISTS(SELECT 1 FROM unnest(coalesce(e.restricoes_incompativeis,'{}')) blocked CROSS JOIN unnest(coalesce(v_restrictions,'{}')) declared WHERE btrim(blocked)<>'' AND btrim(declared)<>'' AND (strpos(lower(blocked),lower(declared))>0 OR strpos(lower(declared),lower(blocked))>0))
   AND (nullif(btrim(e.equipamento),'') IS NULL OR lower(btrim(e.equipamento)) IN('nenhum','peso corporal','livre','sem equipamento') OR EXISTS(SELECT 1 FROM public.organization_facilities f WHERE f.organization_id=v_student.organization_id AND f.status='aprovado' AND f.availability='available' AND (strpos(lower(f.nome),lower(e.equipamento))>0 OR strpos(lower(e.equipamento),lower(f.nome))>0))))
  THEN RAISE EXCEPTION 'Exercício incompatível com a triagem ou equipamento não aprovado'; END IF;
 END LOOP;
 INSERT INTO public.planos_treino(nome,objetivo,nivel,semanas,dias_semana,organization_id,professor_id,ativo,publico)
 VALUES(btrim(p_payload->>'nome'),left(p_payload->>'objetivo',500),left(p_payload->>'nivel',100),v_weeks,(SELECT count(DISTINCT value->>'dia_semana') FROM jsonb_array_elements(p_payload->'exercicios')),v_student.organization_id,v_user,true,false) RETURNING id INTO v_plan;
 FOR v_week IN 1..v_weeks LOOP
  INSERT INTO public.plano_exercicios(plano_treino_id,exercicio_id,semana,dia_semana,ordem,series,repeticoes,carga_kg,descanso_seg,observacoes,alternativas)
  SELECT v_plan,(e.value->>'exercicio_id')::uuid,v_week,(e.value->>'dia_semana')::integer,e.ordinality::integer,(e.value->>'series')::integer,e.value->>'repeticoes',(e.value->>'carga_kg')::numeric,(e.value->>'descanso_seg')::integer,left(e.value->>'observacoes',2000),coalesce(e.value->'alternativas','[]'::jsonb)
  FROM jsonb_array_elements(p_payload->'exercicios') WITH ORDINALITY e(value,ordinality);
 END LOOP;
 INSERT INTO public.treinos(aluno_id,plano_treino_id,organization_id,professor_id,nome,descricao,data_inicio,data_fim,status)
 VALUES(v_student.id,v_plan,v_student.organization_id,v_user,btrim(p_payload->>'nome'),left(p_payload->>'objetivo',500),v_start,v_start+v_weeks*7-1,'ativo') RETURNING id INTO v_workout;
 INSERT INTO public.workout_publications(request_id,user_id,payload,treino_id) VALUES(p_request_id,v_user,p_payload,v_workout);
 RETURN v_workout;
END; $$;

create or replace function public.resident_workout(p_aluno uuid)
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
 select to_jsonb(s) into session_row from public.workout_sessions s join public.treinos t on t.id=s.treino_id
 where s.aluno_id=student.id and t.organization_id=student.organization_id and s.data<=today and (s.status in ('em_andamento','pausado') or s.data=today) and s.prescription is not null
 order by case when s.status in ('em_andamento','pausado') then 0 else 1 end,s.started_at desc limit 1;
 if session_row is not null then
  return jsonb_build_object('treino',session_row->'prescription'->'treino','exercicios',session_row->'prescription'->'exercicios','session',session_row,'data',session_row->>'data','pinned',true,'infrastructure',public.fitness_infrastructure(student.organization_id)->'facilities');
 end if;
 select * into workout from public.treinos t where t.aluno_id=student.id and t.organization_id=student.organization_id
  and t.status='ativo' and t.data_inicio<=today and (t.data_fim is null or t.data_fim>=today)
  and t.plano_treino_id is not null and exists(select 1 from public.workout_publications p where p.treino_id=t.id)
  order by t.data_inicio desc,t.created_at desc,t.id limit 1;
 if not found then return jsonb_build_object('treino',null,'exercicios','[]'::jsonb,'session',null,'data',today,'reason','Seu professor ainda não publicou um treino vigente.'); end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',pe.id,'exercicio_id',pe.exercicio_id,'alternativas',coalesce((select jsonb_agg(a.value||jsonb_build_object('nome',b.nome,'instrucoes',b.instrucoes,'video_url',b.video_url,'equipamento',b.equipamento)) from jsonb_array_elements(pe.alternativas) a join public.exercicios_biblioteca b on b.id=(a.value->>'exercicio_id')::uuid),'[]'::jsonb),'nome',e.nome,'equipamento',e.equipamento,'series',pe.series,'repeticoes',pe.repeticoes,
  'carga_kg',pe.carga_kg,'descanso_seg',pe.descanso_seg,'observacoes',pe.observacoes,'instrucoes',e.instrucoes,'video_url',e.video_url,'ordem',pe.ordem) order by pe.ordem),'[]'::jsonb)
 into exercises from public.plano_exercicios pe join public.exercicios_biblioteca e on e.id=pe.exercicio_id
 where pe.plano_treino_id=workout.plano_treino_id and pe.dia_semana=extract(isodow from today)::integer and pe.semana=((today-workout.data_inicio)/7)+1;
 select to_jsonb(s) into session_row from public.workout_sessions s where s.treino_id=workout.id and s.aluno_id=student.id and s.data=today;
 return jsonb_build_object('treino',to_jsonb(workout),'exercicios',exercises,'session',session_row,'data',today,'infrastructure',public.fitness_infrastructure(student.organization_id)->'facilities');
end; $$;
create function public.save_workout_journey(p_treino_id uuid,p_action text,p_progress jsonb,p_feedback text,p_expected timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare student_id uuid; today date:=(now() at time zone 'America/Sao_Paulo')::date; current_workout jsonb; saved public.workout_sessions; item text; entry jsonb; exercise jsonb; actual jsonb; metric text; raw text; completed_count integer:=0; total integer;
begin
 if not app_private.session_valid() then raise exception 'Sessão sem acesso ou revogada' using errcode='42501'; end if;
 if p_action is null or p_action not in ('start','save','pause','resume','finish','finish_partial','discomfort') or jsonb_typeof(p_progress) is distinct from 'object' then raise exception 'Dados de sessão inválidos'; end if;
 select t.aluno_id into student_id from public.treinos t where t.id=p_treino_id and app_private.own_student(t.aluno_id);
 if student_id is null then raise exception 'Treino indisponível' using errcode='42501'; end if;
 perform 1 from public.alunos where id=student_id for update;
 perform pg_advisory_xact_lock(hashtextextended(student_id::text||today::text,0));
 current_workout:=public.resident_workout(student_id);
 today:=coalesce((current_workout->>'data')::date,today);
 if (current_workout->'treino'->>'id')::uuid is distinct from p_treino_id or jsonb_array_length(current_workout->'exercicios')=0 then raise exception 'Treino indisponível hoje'; end if;
 select * into saved from public.workout_sessions where treino_id=p_treino_id and aluno_id=student_id and data=today for update;
 if p_action='start' then
  if saved.id is null then
   insert into public.workout_sessions(treino_id,aluno_id,data,prescription) values(p_treino_id,student_id,today,jsonb_build_object('treino',current_workout->'treino','exercicios',current_workout->'exercicios')) returning * into saved;
  elsif saved.prescription is null then
   update public.workout_sessions set prescription=jsonb_build_object('treino',current_workout->'treino','exercicios',current_workout->'exercicios') where id=saved.id returning * into saved;
  end if;
  return to_jsonb(saved);
 end if;
 if saved.id is null then raise exception 'Inicie o treino antes de registrar progresso'; end if;
 if saved.status='concluido' then return to_jsonb(saved); end if;
 if p_expected is not null and saved.updated_at is distinct from p_expected then raise exception 'A sessão mudou em outra tela. Recarregue e confira o progresso confirmado antes de salvar.' using errcode='40001'; end if;
 if p_action in ('save','pause','finish','finish_partial','discomfort') and saved.status<>'em_andamento' then raise exception 'Retome a sessão antes de registrar progresso'; end if;
 if p_action='discomfort' and coalesce(length(btrim(p_feedback)),0)<3 then raise exception 'Descreva o que aconteceu para o profissional'; end if;
 total:=jsonb_array_length(current_workout->'exercicios');
 for item,entry in select j.key,j.value from jsonb_each(p_progress) j loop
  select e into exercise from jsonb_array_elements(current_workout->'exercicios') e where e->>'id'=item;
  if exercise is null or jsonb_typeof(entry->'completed') is distinct from 'boolean' then raise exception 'Progresso contém exercício inválido'; end if;
  actual:=exercise;
  if nullif(entry->>'alternative_id','') is not null then
   select a into actual from jsonb_array_elements(coalesce(exercise->'alternativas','[]')) a where a->>'exercicio_id'=entry->>'alternative_id';
   if actual is null then raise exception 'Alternativa não aprovada neste treino'; end if;
  end if;
  for metric in select unnest(array['carga','series','repeticoes']) loop
   raw:=coalesce(entry->>metric,'');
   if raw<>'' then
    begin
     if raw::numeric<0 or raw::numeric::text in ('NaN','Infinity','-Infinity') or raw::numeric>100000 then raise exception 'Registro realizado inválido'; end if;
     if metric='series' and (raw::numeric<>trunc(raw::numeric) or raw::numeric>100) then raise exception 'Séries realizadas inválidas';end if;
    exception when invalid_text_representation or numeric_value_out_of_range then raise exception 'Registro realizado inválido';end;
   end if;
  end loop;
  if entry->>'completed'='true' then completed_count:=completed_count+1;end if;
 end loop;
 if p_action='finish' and completed_count<>total then raise exception 'Há exercícios pendentes. Encerre como sessão parcial ou continue o treino.'; end if;
 if p_action='finish_partial' and completed_count=total then raise exception 'Todos os exercícios foram realizados; conclua a sessão completa.';end if;
 update public.workout_sessions set progress=case when p_action='resume' then progress else p_progress end,
 feedback=case when p_action='resume' then feedback else left(p_feedback,2000) end,
 prescription=coalesce(prescription,jsonb_build_object('treino',current_workout->'treino','exercicios',current_workout->'exercicios')),
 status=case when p_action in ('pause','discomfort') then 'pausado' when p_action='resume' then 'em_andamento' when p_action in ('finish','finish_partial') then 'concluido' else status end,
 completion_kind=case p_action when 'finish' then 'complete' when 'finish_partial' then 'partial' else completion_kind end,
 attention=case when p_action='discomfort' then 'discomfort' else attention end,
 updated_at=clock_timestamp(),completed_at=case when p_action in ('finish','finish_partial') then now() else completed_at end
 where id=saved.id returning * into saved;
 if p_action in ('finish','finish_partial') then
  insert into public.treino_execucoes(treino_id,aluno_id,data_execucao,concluido,carga_real,observacoes) values(p_treino_id,student_id,today,p_action='finish',p_progress,left(p_feedback,2000));
 end if;
 return to_jsonb(saved);
end; $$;
-- Legacy callers receive the same validation and immutable prescription.
create or replace function public.save_resident_workout_session(p_treino_id uuid,p_action text,p_progress jsonb default '{}'::jsonb,p_feedback text default null)
returns jsonb language sql security definer set search_path='' as $$select public.save_workout_journey(p_treino_id,p_action,p_progress,p_feedback,null)$$;
create or replace function public.save_workout_session(p_treino_id uuid,p_action text,p_progress jsonb default '{}'::jsonb,p_feedback text default null)
returns jsonb language sql security definer set search_path='' as $$select public.save_workout_journey(p_treino_id,p_action,p_progress,p_feedback,null)$$;
revoke all on function public.save_workout_session(uuid,text,jsonb,text) from public,anon;
grant execute on function public.save_workout_session(uuid,text,jsonb,text) to authenticated;
revoke insert,update,delete on public.workout_sessions from authenticated,anon;
revoke all on function public.save_workout_journey(uuid,text,jsonb,text,timestamptz) from public,anon;
grant execute on function public.save_workout_journey(uuid,text,jsonb,text,timestamptz) to authenticated;

create function public.fitness_infrastructure(p_org uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not app_private.org_role(p_org,array['admin','manager','sindico','professor']) and not exists(select 1 from public.alunos a where a.organization_id=p_org and app_private.own_student(a.id)) then raise exception 'Condomínio fora do acesso' using errcode='42501';end if;
 return jsonb_build_object('facilities',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'nome',f.nome,'quantidade',f.quantidade,'availability',f.availability,'note',f.availability_note) order by f.nome) from public.organization_facilities f where f.organization_id=p_org and f.status='aprovado'),'[]'::jsonb),
 'hours',(select horarios_academia from public.organizations where id=p_org),'capacity',(select capacidade_academia from public.organizations where id=p_org),
 'usage_hours',coalesce((select jsonb_agg(jsonb_build_object('hour',h,'sessions',n) order by n desc,h) from (select extract(hour from s.started_at at time zone 'America/Sao_Paulo')::integer h,count(*) n from public.workout_sessions s join public.alunos a on a.id=s.aluno_id where a.organization_id=p_org and s.started_at>=now()-interval '30 days' group by 1) x),'[]'::jsonb));
end;$$;
create function public.set_fitness_equipment_availability(p_id uuid,p_available boolean,p_note text)
returns void language plpgsql security definer set search_path='' as $$
declare facility public.organization_facilities;
begin
 select * into facility from public.organization_facilities where id=p_id for update;
 if facility.id is null or not app_private.org_role(facility.organization_id,array['admin','manager','sindico']) then raise exception 'Equipamento fora da gestão' using errcode='42501';end if;
 if p_available is null or (not p_available and coalesce(length(btrim(p_note)),0)<3) then raise exception 'Informe o motivo da indisponibilidade';end if;
 update public.organization_facilities set availability=case when p_available then 'available' else 'unavailable' end,availability_note=left(btrim(p_note),500),updated_at=now() where id=p_id;
 insert into public.user_access_audit(user_id,organization_id,event,metadata) values(auth.uid(),facility.organization_id,'admin_action',jsonb_build_object('action','equipment_availability','facility',p_id,'available',p_available));
end;$$;
revoke all on function public.fitness_infrastructure(uuid),public.set_fitness_equipment_availability(uuid,boolean,text) from public,anon;
grant execute on function public.fitness_infrastructure(uuid),public.set_fitness_equipment_availability(uuid,boolean,text) to authenticated;
do $patch$
declare source text;patched text;
begin
 select pg_get_functiondef('public.coach_student_case(uuid)'::regprocedure) into source;
 patched:=replace(source,$old$where organization_id=student.organization_id and status='aprovado'$old$,$new$where organization_id=student.organization_id and status='aprovado' and availability='available'$new$);
 if source=patched then raise exception 'Revisar contrato de infraestrutura do coach';end if;
 execute patched;
select pg_get_functiondef('public.coach_operation_summary(uuid)'::regprocedure) into source;
 patched:=replace(source,$old$s.data,s.feedback,coalesce(f.resolved,false)$old$,$new$s.data,s.feedback,s.completion_kind,s.attention,coalesce(f.resolved,false)$new$);
 patched:=replace(patched,$old$nullif(btrim(s.feedback),'') is not null$old$,$new$(nullif(btrim(s.feedback),'') is not null or s.completion_kind='partial' or s.attention='discomfort')$new$);
 if source=patched then raise exception 'Revisar contrato de acompanhamento do coach';end if;
 execute patched;
end $patch$;
commit;
