-- Resume feedback recente para orientar o próximo treino.
CREATE OR REPLACE FUNCTION public.next_workout_guidance()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_student UUID; v_sessions JSONB; v_completed INTEGER; v_total INTEGER;
BEGIN
  SELECT id INTO STRICT v_student FROM public.alunos WHERE user_id = auth.uid();
  SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.data DESC), '[]'::jsonb),
         count(*) FILTER (WHERE s.status = 'concluido'),
         count(*)
    INTO v_sessions, v_completed, v_total
    FROM public.workout_sessions s
   WHERE s.aluno_id = v_student
     AND s.data >= ((now() AT TIME ZONE 'America/Sao_Paulo')::date - 28);
  RETURN jsonb_build_object(
    'aluno_id', v_student,
    'sessoes_recentes', v_sessions,
    'concluidas', v_completed,
    'total', v_total,
    'recomendacao', CASE
      WHEN v_total = 0 THEN 'iniciar_com_carga_conservadora'
      WHEN v_completed = v_total THEN 'avaliar_progressao'
      ELSE 'manter_volume_e_revisar_adaptacoes'
    END
  );
EXCEPTION WHEN no_data_found THEN
  RAISE EXCEPTION 'Seu cadastro ainda não está vinculado.';
END;
$$;

REVOKE ALL ON FUNCTION public.next_workout_guidance() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_workout_guidance() TO authenticated;
