CREATE OR REPLACE FUNCTION public.save_workout_session(p_treino_id uuid,p_action text,p_progress jsonb DEFAULT '{}'::jsonb,p_feedback text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_student uuid; v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; v_session public.workout_sessions%ROWTYPE; v_current jsonb; v_key text;
BEGIN
  IF auth.uid() IS NULL OR p_action IS NULL OR p_action NOT IN ('start','save','pause','resume','finish') OR jsonb_typeof(p_progress) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Dados de sessão inválidos'; END IF;
  v_current:=public.student_workout();
  IF p_treino_id IS NULL OR (v_current->'treino'->>'id')::uuid IS DISTINCT FROM p_treino_id OR jsonb_array_length(v_current->'exercicios')=0 THEN RAISE EXCEPTION 'Treino indisponível hoje'; END IF;
  SELECT id INTO STRICT v_student FROM public.alunos WHERE user_id=auth.uid();
  PERFORM pg_advisory_xact_lock(hashtextextended(v_student::text||p_treino_id::text||v_today::text,0));
  SELECT * INTO v_session FROM public.workout_sessions WHERE treino_id=p_treino_id AND aluno_id=v_student AND data=v_today FOR UPDATE;
  IF p_action='start' AND NOT FOUND THEN
    INSERT INTO public.workout_sessions(treino_id,aluno_id,data) VALUES(p_treino_id,v_student,v_today) RETURNING * INTO v_session;
  END IF;
  IF v_session.id IS NULL THEN RAISE EXCEPTION 'Inicie o treino antes de registrar progresso'; END IF;
  IF v_session.status='concluido' THEN RETURN to_jsonb(v_session); END IF;
  FOR v_key IN SELECT jsonb_object_keys(p_progress) LOOP
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_current->'exercicios') e WHERE e->>'id'=v_key)
       OR jsonb_typeof(p_progress->v_key->'completed') IS DISTINCT FROM 'boolean'
    THEN RAISE EXCEPTION 'Progresso contém exercício inválido'; END IF;
  END LOOP;
  IF p_action='finish' AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_current->'exercicios') e
    WHERE coalesce(p_progress->(e->>'id')->>'completed','false')<>'true'
  ) THEN RAISE EXCEPTION 'Registre todos os exercícios antes de concluir'; END IF;
  UPDATE public.workout_sessions SET progress=p_progress,feedback=left(p_feedback,2000),
    status=CASE p_action WHEN 'pause' THEN 'pausado' WHEN 'resume' THEN 'em_andamento' WHEN 'finish' THEN 'concluido' ELSE status END,
    updated_at=now(),completed_at=CASE WHEN p_action='finish' THEN now() ELSE completed_at END
  WHERE id=v_session.id RETURNING * INTO v_session;
  IF p_action='finish' THEN
    INSERT INTO public.treino_execucoes(treino_id,aluno_id,data_execucao,concluido,carga_real,observacoes)
    VALUES(p_treino_id,v_student,v_today,true,p_progress,left(p_feedback,2000));
  END IF;
  RETURN to_jsonb(v_session);
END;
$$;

