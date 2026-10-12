-- Sugestões de ajuste explicáveis; publicação continua dependendo do professor.
CREATE OR REPLACE FUNCTION public.workout_adjustment_suggestions(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_feedback TEXT; v_progress JSONB; v_suggestion TEXT; v_session DATE;
BEGIN
  SELECT feedback, progress, data INTO v_feedback, v_progress, v_session
    FROM public.workout_sessions
   WHERE aluno_id = p_aluno_id
   ORDER BY data DESC, updated_at DESC
   LIMIT 1;
  IF v_feedback IS NULL AND v_progress IS NULL THEN
    RETURN jsonb_build_object('aluno_id', p_aluno_id, 'status', 'sem_dados', 'sugestoes', '[]'::jsonb);
  END IF;
  v_feedback := lower(coalesce(v_feedback, ''));
  v_suggestion := CASE
    WHEN v_feedback ~ '(dor|lesão|lesao|desconforto)' THEN 'Revisar exercício e considerar substituição antes da próxima sessão.'
    WHEN v_feedback ~ '(fácil|facil|leve)' THEN 'Avaliar progressão gradual de carga ou volume.'
    WHEN v_feedback ~ '(difícil|dificil|pesado|exausto)' THEN 'Avaliar redução de carga, volume ou aumento do descanso.'
    ELSE 'Manter o protocolo e revisar a evolução na próxima sessão.'
  END;
  RETURN jsonb_build_object('aluno_id', p_aluno_id, 'ultima_sessao', v_session, 'sugestoes', jsonb_build_array(v_suggestion), 'requer_aprovacao_professor', true);
END;
$$;

REVOKE ALL ON FUNCTION public.workout_adjustment_suggestions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.workout_adjustment_suggestions(UUID) TO authenticated;
