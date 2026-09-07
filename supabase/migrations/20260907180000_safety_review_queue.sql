ALTER TABLE public.student_safety_onboarding
  ADD COLUMN IF NOT EXISTS objetivo TEXT;

CREATE OR REPLACE FUNCTION public.submit_student_safety_onboarding(
  p_aluno_id UUID,
  p_organization_id UUID,
  p_payload JSONB
) RETURNS public.student_safety_onboarding
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.student_safety_onboarding;
  v_risk TEXT := 'baixo';
  v_flags INTEGER := 0;
BEGIN
  IF COALESCE((p_payload->>'consentimento')::BOOLEAN, false) = false THEN
    RAISE EXCEPTION 'consentimento obrigatório';
  END IF;
  v_flags := COALESCE(jsonb_array_length(p_payload->'lesoes_atuais'), 0)
    + COALESCE(jsonb_array_length(p_payload->'sinais_alerta'), 0)
    + CASE WHEN COALESCE((p_payload->>'dor_atual')::BOOLEAN, false) THEN 1 ELSE 0 END;
  IF v_flags > 0 THEN v_risk := 'moderado'; END IF;
  IF COALESCE(jsonb_array_length(p_payload->'sinais_alerta'), 0) > 0 OR COALESCE((p_payload->>'cirurgias')::TEXT, '') <> '' THEN v_risk := 'alto'; END IF;

  INSERT INTO public.student_safety_onboarding (aluno_id, organization_id, consentimento, restricoes, lesoes_atuais, historico_lesoes, cirurgias, dor_atual, sinais_alerta, observacoes, objetivo, risco)
  VALUES (p_aluno_id, p_organization_id, true, COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_payload->'restricoes')), '{}'), COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_payload->'lesoes_atuais')), '{}'), p_payload->>'historico_lesoes', p_payload->>'cirurgias', COALESCE((p_payload->>'dor_atual')::BOOLEAN, false), COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_payload->'sinais_alerta')), '{}'), p_payload->>'observacoes', p_payload->>'objetivo', v_risk)
  ON CONFLICT (aluno_id) DO UPDATE SET organization_id = EXCLUDED.organization_id, consentimento = EXCLUDED.consentimento, restricoes = EXCLUDED.restricoes, lesoes_atuais = EXCLUDED.lesoes_atuais, historico_lesoes = EXCLUDED.historico_lesoes, cirurgias = EXCLUDED.cirurgias, dor_atual = EXCLUDED.dor_atual, sinais_alerta = EXCLUDED.sinais_alerta, observacoes = EXCLUDED.observacoes, objetivo = EXCLUDED.objetivo, risco = EXCLUDED.risco, validado_por = NULL, validado_em = NULL, updated_at = now()
  RETURNING * INTO v_row;

  IF v_risk IN ('moderado', 'alto') THEN
    INSERT INTO public.treinos_ia_fila (aluno_id, organization_id, objetivo, resumo, status)
    VALUES (p_aluno_id, p_organization_id, p_payload->>'objetivo', 'Triagem de segurança requer avaliação profissional antes da prescrição.', 'pendente');
  END IF;
  RETURN v_row;
END;
$$;
