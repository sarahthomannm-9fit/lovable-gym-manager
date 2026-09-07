CREATE OR REPLACE FUNCTION public.publish_workout(p_request_id uuid, p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid(); v_student public.alunos%ROWTYPE;
  v_plan uuid; v_workout uuid; v_previous public.workout_publications%ROWTYPE;
  v_start date; v_weeks integer; v_ex jsonb; v_week integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  IF p_request_id IS NULL OR p_payload IS NULL THEN RAISE EXCEPTION 'Publicação inválida'; END IF;
  SELECT * INTO v_student FROM public.alunos WHERE id = (p_payload->>'aluno_id')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aluno não encontrado'; END IF;
  IF NOT public.student_is_safe_for_workout(v_student.id) THEN RAISE EXCEPTION 'Onboarding de segurança pendente de validação profissional'; END IF;
  IF NOT (public.is_admin(v_user) OR EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = v_user AND organization_id = v_student.organization_id AND papel::text IN ('professor','coach','manager'))) THEN RAISE EXCEPTION 'Sem permissão para prescrever para este aluno'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  SELECT * INTO v_previous FROM public.workout_publications WHERE request_id = p_request_id;
  IF FOUND THEN
    IF v_previous.user_id <> v_user OR v_previous.payload <> p_payload THEN RAISE EXCEPTION 'Esta publicação já foi usada com outro conteúdo. Atualize a lista antes de criar outra.'; END IF;
    RETURN v_previous.treino_id;
  END IF;
  v_start := (p_payload->>'data_inicio')::date; v_weeks := (p_payload->>'semanas')::integer;
  IF v_start IS NULL OR v_weeks IS NULL OR v_weeks NOT BETWEEN 1 AND 52 OR length(trim(coalesce(p_payload->>'nome',''))) = 0 THEN RAISE EXCEPTION 'Nome, data e duração são obrigatórios'; END IF;
  IF jsonb_typeof(p_payload->'exercicios') IS DISTINCT FROM 'array' OR jsonb_array_length(p_payload->'exercicios') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Informe entre 1 e 100 exercícios'; END IF;
  FOR v_ex IN SELECT value FROM jsonb_array_elements(p_payload->'exercicios') LOOP
    IF coalesce((v_ex->>'dia_semana')::integer,0) NOT BETWEEN 1 AND 7 OR coalesce((v_ex->>'series')::integer,0) NOT BETWEEN 1 AND 30 OR length(trim(coalesce(v_ex->>'repeticoes',''))) = 0 OR coalesce((v_ex->>'descanso_seg')::integer,-1) NOT BETWEEN 0 AND 1800 OR coalesce((v_ex->>'carga_kg')::numeric,0) < 0 THEN RAISE EXCEPTION 'Exercício inválido'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.exercicios_biblioteca e WHERE e.id = (v_ex->>'exercicio_id')::uuid AND e.ativo = true AND (e.organization_id IS NULL OR e.organization_id = v_student.organization_id OR public.is_admin(v_user))) THEN RAISE EXCEPTION 'Exercício indisponível para este aluno'; END IF;
  END LOOP;
  INSERT INTO public.planos_treino (nome, objetivo, nivel, semanas, dias_semana, organization_id, ativo, publico) VALUES (trim(p_payload->>'nome'), p_payload->>'objetivo', p_payload->>'nivel', v_weeks, (SELECT count(DISTINCT value->>'dia_semana') FROM jsonb_array_elements(p_payload->'exercicios')), v_student.organization_id, true, false) RETURNING id INTO v_plan;
  FOR v_week IN 1..v_weeks LOOP
    INSERT INTO public.plano_exercicios (plano_treino_id, exercicio_id, semana, dia_semana, ordem, series, repeticoes, carga_kg, descanso_seg, observacoes)
    SELECT v_plan, (e.value->>'exercicio_id')::uuid, v_week, (e.value->>'dia_semana')::integer, e.ordinality::integer, (e.value->>'series')::integer, e.value->>'repeticoes', (e.value->>'carga_kg')::numeric, (e.value->>'descanso_seg')::integer, e.value->>'observacoes' FROM jsonb_array_elements(p_payload->'exercicios') WITH ORDINALITY e(value, ordinality);
  END LOOP;
  INSERT INTO public.treinos (aluno_id, plano_treino_id, organization_id, nome, descricao, data_inicio, data_fim, status) VALUES (v_student.id, v_plan, v_student.organization_id, trim(p_payload->>'nome'), p_payload->>'objetivo', v_start, v_start + v_weeks * 7 - 1, 'ativo') RETURNING id INTO v_workout;
  INSERT INTO public.notificacoes (tipo, titulo, mensagem, destinatario_tipo, destinatario_id, prioridade, canal) VALUES ('treino', 'Novo treino disponível', 'Seu professor publicou ' || trim(p_payload->>'nome') || '. Confira em Meu treino.', 'aluno', v_student.id, 'normal', ARRAY['sistema']);
  INSERT INTO public.workout_publications (request_id, user_id, payload, treino_id) VALUES (p_request_id, v_user, p_payload, v_workout);
  RETURN v_workout;
END;
$$;
