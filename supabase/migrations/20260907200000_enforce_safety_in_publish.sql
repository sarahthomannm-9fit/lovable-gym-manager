CREATE OR REPLACE FUNCTION public.publish_workout(p_request_id UUID, p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_student public.alunos;
  v_org UUID := NULLIF(p_payload->>'organization_id', '')::UUID;
  v_workout UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'não autenticado'; END IF;
  SELECT * INTO v_student FROM public.alunos WHERE id = (p_payload->>'aluno_id')::UUID;
  IF v_student.id IS NULL THEN RAISE EXCEPTION 'aluno não encontrado'; END IF;
  IF NOT public.student_is_safe_for_workout(v_student.id) THEN
    RAISE EXCEPTION 'onboarding de segurança pendente de validação profissional';
  END IF;
  IF NOT (public.is_admin(v_user) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = v_org AND m.user_id = v_user AND m.papel IN ('professor','admin','manager'))) THEN
    RAISE EXCEPTION 'sem permissão para publicar neste condomínio';
  END IF;
  RAISE EXCEPTION 'publicação deve usar a implementação transacional existente após a validação de segurança';
END;
$$;
