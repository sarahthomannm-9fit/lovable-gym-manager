CREATE OR REPLACE FUNCTION public.student_protocol_context(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org UUID;
  v_safety JSONB;
  v_equipment JSONB;
BEGIN
  SELECT organization_id INTO v_org FROM public.alunos WHERE id = p_aluno_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'aluno sem condomínio'; END IF;
  SELECT to_jsonb(s) INTO v_safety FROM public.student_safety_onboarding s WHERE s.aluno_id = p_aluno_id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', f.id, 'nome', f.nome, 'categoria', f.categoria, 'ambiente', f.ambiente, 'quantidade', f.quantidade)), '[]'::jsonb)
    INTO v_equipment
    FROM public.organization_facilities f
   WHERE f.organization_id = v_org AND f.status = 'aprovado' AND f.quantidade > 0;
  RETURN jsonb_build_object(
    'aluno_id', p_aluno_id,
    'organization_id', v_org,
    'seguranca', COALESCE(v_safety, '{}'::jsonb),
    'infraestrutura', v_equipment,
    'pronto_para_prescricao', COALESCE((v_safety->>'risco') = 'baixo', false) AND jsonb_array_length(v_equipment) > 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.student_protocol_context(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.student_protocol_context(UUID) TO authenticated;
