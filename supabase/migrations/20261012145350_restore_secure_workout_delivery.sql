CREATE TABLE IF NOT EXISTS public.workout_publications (
  request_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  payload jsonb NOT NULL,
  treino_id uuid REFERENCES public.treinos(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id uuid NOT NULL REFERENCES public.treinos(id),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id),
  data date NOT NULL,
  status text NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento','pausado','concluido')),
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback text,
  started_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
  UNIQUE (treino_id, aluno_id, data)
);
ALTER TABLE public.workout_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.publish_workout(p_request_id uuid, p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid(); v_student public.alunos%ROWTYPE; v_plan uuid; v_workout uuid;
  v_start date; v_weeks integer; v_ex jsonb; v_week integer; v_restrictions text[];
BEGIN
  IF v_user IS NULL OR p_request_id IS NULL OR p_payload IS NULL THEN RAISE EXCEPTION 'Publicação inválida'; END IF;
  SELECT * INTO v_student FROM public.alunos WHERE id = (p_payload->>'aluno_id')::uuid;
  IF NOT FOUND OR NOT public.student_is_safe_for_workout(v_student.id) THEN RAISE EXCEPTION 'Triagem de segurança pendente de validação profissional'; END IF;
  IF NOT (public.is_admin(v_user) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.user_id=v_user AND m.organization_id=v_student.organization_id AND m.papel::text IN ('admin','manager','professor'))) THEN RAISE EXCEPTION 'Sem permissão para prescrever para este aluno'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  SELECT treino_id INTO v_workout FROM public.workout_publications WHERE request_id=p_request_id;
  IF FOUND THEN RETURN v_workout; END IF;
  v_start := (p_payload->>'data_inicio')::date; v_weeks := (p_payload->>'semanas')::integer;
  IF v_start IS NULL OR v_weeks NOT BETWEEN 1 AND 52 OR length(trim(coalesce(p_payload->>'nome',''))) = 0 OR jsonb_typeof(p_payload->'exercicios') <> 'array' OR jsonb_array_length(p_payload->'exercicios') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Dados do treino inválidos'; END IF;
  SELECT restricoes || lesoes_atuais INTO v_restrictions FROM public.student_safety_onboarding WHERE aluno_id=v_student.id;
  FOR v_ex IN SELECT value FROM jsonb_array_elements(p_payload->'exercicios') LOOP
    IF coalesce((v_ex->>'dia_semana')::integer,0) NOT BETWEEN 1 AND 7 OR coalesce((v_ex->>'series')::integer,0) NOT BETWEEN 1 AND 30 OR length(trim(coalesce(v_ex->>'repeticoes',''))) = 0 OR coalesce((v_ex->>'descanso_seg')::integer,-1) NOT BETWEEN 0 AND 1800 OR coalesce((v_ex->>'carga_kg')::numeric,0) < 0 THEN RAISE EXCEPTION 'Exercício inválido'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.exercicios_biblioteca e WHERE e.id=(v_ex->>'exercicio_id')::uuid AND e.ativo=true AND (e.organization_id IS NULL OR e.organization_id=v_student.organization_id) AND NOT (e.restricoes_incompativeis && coalesce(v_restrictions,'{}'))) THEN RAISE EXCEPTION 'Exercício indisponível ou incompatível com a triagem'; END IF;
  END LOOP;
  INSERT INTO public.planos_treino (nome, objetivo, nivel, semanas, dias_semana, organization_id, professor_id, ativo, publico)
  VALUES (trim(p_payload->>'nome'), left(p_payload->>'objetivo',500), left(p_payload->>'nivel',100), v_weeks, (SELECT count(DISTINCT value->>'dia_semana') FROM jsonb_array_elements(p_payload->'exercicios')), v_student.organization_id, v_user, true, false) RETURNING id INTO v_plan;
  FOR v_week IN 1..v_weeks LOOP
    INSERT INTO public.plano_exercicios (plano_treino_id, exercicio_id, semana, dia_semana, ordem, series, repeticoes, carga_kg, descanso_seg, observacoes)
    SELECT v_plan, (e.value->>'exercicio_id')::uuid, v_week, (e.value->>'dia_semana')::integer, e.ordinality::integer, (e.value->>'series')::integer, e.value->>'repeticoes', (e.value->>'carga_kg')::numeric, (e.value->>'descanso_seg')::integer, left(e.value->>'observacoes',2000) FROM jsonb_array_elements(p_payload->'exercicios') WITH ORDINALITY e(value, ordinality);
  END LOOP;
  INSERT INTO public.treinos (aluno_id, plano_treino_id, organization_id, professor_id, nome, descricao, data_inicio, data_fim, status)
  VALUES (v_student.id,v_plan,v_student.organization_id,v_user,trim(p_payload->>'nome'),left(p_payload->>'objetivo',500),v_start,v_start+v_weeks*7-1,'ativo') RETURNING id INTO v_workout;
  INSERT INTO public.workout_publications (request_id,user_id,payload,treino_id) VALUES (p_request_id,v_user,p_payload,v_workout);
  RETURN v_workout;
END;
$$;

CREATE OR REPLACE FUNCTION public.student_workout()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_student uuid; v_workout public.treinos%ROWTYPE; v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; v_session jsonb; v_exercises jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  SELECT id INTO STRICT v_student FROM public.alunos WHERE user_id=auth.uid();
  SELECT * INTO v_workout FROM public.treinos WHERE aluno_id=v_student AND status='ativo' AND data_inicio<=v_today AND (data_fim IS NULL OR data_fim>=v_today) AND plano_treino_id IS NOT NULL ORDER BY data_inicio DESC, created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('treino',NULL,'exercicios','[]'::jsonb,'session',NULL,'data',v_today); END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',pe.id,'nome',e.nome,'series',pe.series,'repeticoes',pe.repeticoes,'carga_kg',pe.carga_kg,'descanso_seg',pe.descanso_seg,'observacoes',pe.observacoes,'instrucoes',e.instrucoes,'video_url',e.video_url,'ordem',pe.ordem) ORDER BY pe.ordem), '[]'::jsonb) INTO v_exercises FROM public.plano_exercicios pe JOIN public.exercicios_biblioteca e ON e.id=pe.exercicio_id WHERE pe.plano_treino_id=v_workout.plano_treino_id AND pe.dia_semana=extract(isodow FROM v_today)::integer AND pe.semana=((v_today-v_workout.data_inicio)/7)+1;
  SELECT to_jsonb(s) INTO v_session FROM public.workout_sessions s WHERE treino_id=v_workout.id AND aluno_id=v_student AND data=v_today;
  RETURN jsonb_build_object('treino',to_jsonb(v_workout),'exercicios',v_exercises,'session',v_session,'data',v_today);
EXCEPTION WHEN no_data_found THEN RAISE EXCEPTION 'Seu cadastro ainda não está vinculado'; WHEN too_many_rows THEN RAISE EXCEPTION 'Há mais de um cadastro vinculado'; END;
$$;

CREATE OR REPLACE FUNCTION public.save_workout_session(p_treino_id uuid, p_action text, p_progress jsonb DEFAULT '{}'::jsonb, p_feedback text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_student uuid; v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; v_session public.workout_sessions%ROWTYPE; v_current jsonb;
BEGIN
  IF auth.uid() IS NULL OR p_action NOT IN ('start','save','pause','resume','finish') OR jsonb_typeof(p_progress) <> 'object' THEN RAISE EXCEPTION 'Dados de sessão inválidos'; END IF;
  v_current:=public.student_workout(); IF (v_current->'treino'->>'id')::uuid IS DISTINCT FROM p_treino_id OR jsonb_array_length(v_current->'exercicios')=0 THEN RAISE EXCEPTION 'Treino indisponível hoje'; END IF;
  SELECT id INTO STRICT v_student FROM public.alunos WHERE user_id=auth.uid();
  SELECT * INTO v_session FROM public.workout_sessions WHERE treino_id=p_treino_id AND aluno_id=v_student AND data=v_today FOR UPDATE;
  IF p_action='start' AND NOT FOUND THEN INSERT INTO public.workout_sessions(treino_id,aluno_id,data) VALUES(p_treino_id,v_student,v_today) RETURNING * INTO v_session; END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inicie o treino antes de registrar progresso'; END IF;
  IF v_session.status='concluido' THEN RETURN to_jsonb(v_session); END IF;
  UPDATE public.workout_sessions SET progress=p_progress, feedback=left(p_feedback,2000), status=CASE p_action WHEN 'pause' THEN 'pausado' WHEN 'resume' THEN 'em_andamento' WHEN 'finish' THEN 'concluido' ELSE status END, updated_at=now(), completed_at=CASE WHEN p_action='finish' THEN now() ELSE completed_at END WHERE id=v_session.id RETURNING * INTO v_session;
  IF p_action='finish' THEN INSERT INTO public.treino_execucoes(treino_id,aluno_id,data_execucao,concluido,carga_real,observacoes) VALUES(p_treino_id,v_student,v_today,true,p_progress,left(p_feedback,2000)); END IF;
  RETURN to_jsonb(v_session);
END;
$$;

REVOKE ALL ON FUNCTION public.publish_workout(uuid,jsonb), public.student_workout(), public.save_workout_session(uuid,text,jsonb,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_workout(uuid,jsonb), public.student_workout(), public.save_workout_session(uuid,text,jsonb,text) TO authenticated;

