CREATE OR REPLACE FUNCTION public.review_student_safety(p_queue_id UUID, p_decision TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_aluno UUID;
  v_org UUID;
BEGIN
  IF p_decision NOT IN ('aprovado', 'rejeitado') THEN RAISE EXCEPTION 'decisão inválida'; END IF;
  SELECT aluno_id, organization_id INTO v_aluno, v_org FROM public.treinos_ia_fila WHERE id = p_queue_id FOR UPDATE;
  IF v_aluno IS NULL OR NOT (public.is_admin(auth.uid()) OR public.user_has_org(auth.uid(), v_org)) THEN
    RAISE EXCEPTION 'caso não encontrado ou sem permissão';
  END IF;
  UPDATE public.treinos_ia_fila SET status = p_decision, aprovado_por = auth.uid(), aprovado_em = now(), updated_at = now() WHERE id = p_queue_id;
  UPDATE public.student_safety_onboarding SET risco = CASE WHEN p_decision = 'aprovado' THEN 'baixo' ELSE 'bloqueado' END, validado_por = auth.uid(), validado_em = now(), updated_at = now() WHERE aluno_id = v_aluno;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.review_student_safety(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_student_safety(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.student_is_safe_for_workout(p_aluno_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_safety_onboarding
    WHERE aluno_id = p_aluno_id
      AND risco = 'baixo'
      AND consentimento = true
  );
$$;

REVOKE ALL ON FUNCTION public.student_is_safe_for_workout(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.student_is_safe_for_workout(UUID) TO authenticated;
