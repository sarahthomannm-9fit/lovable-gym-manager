CREATE TABLE IF NOT EXISTS public.student_safety_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  consentimento BOOLEAN NOT NULL DEFAULT false,
  restricoes TEXT[] NOT NULL DEFAULT '{}',
  lesoes_atuais TEXT[] NOT NULL DEFAULT '{}',
  historico_lesoes TEXT,
  cirurgias TEXT,
  dor_atual BOOLEAN NOT NULL DEFAULT false,
  sinais_alerta TEXT[] NOT NULL DEFAULT '{}',
  observacoes TEXT,
  risco TEXT NOT NULL DEFAULT 'pendente' CHECK (risco IN ('pendente', 'baixo', 'moderado', 'alto', 'bloqueado')),
  validado_por UUID REFERENCES auth.users(id),
  validado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id)
);

ALTER TABLE public.student_safety_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_safety_read" ON public.student_safety_onboarding;
CREATE POLICY "student_safety_read" ON public.student_safety_onboarding FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = student_safety_onboarding.organization_id AND m.user_id = auth.uid() AND m.papel IN ('sindico','professor','admin','manager'))
);

DROP POLICY IF EXISTS "student_safety_write" ON public.student_safety_onboarding;
CREATE POLICY "student_safety_write" ON public.student_safety_onboarding FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = student_safety_onboarding.organization_id AND m.user_id = auth.uid() AND m.papel IN ('professor','admin','manager'))
);

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
  INSERT INTO public.student_safety_onboarding (aluno_id, organization_id, consentimento, restricoes, lesoes_atuais, historico_lesoes, cirurgias, dor_atual, sinais_alerta, observacoes, risco)
  VALUES (p_aluno_id, p_organization_id, true, COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_payload->'restricoes')), '{}'), COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_payload->'lesoes_atuais')), '{}'), p_payload->>'historico_lesoes', p_payload->>'cirurgias', COALESCE((p_payload->>'dor_atual')::BOOLEAN, false), COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_payload->'sinais_alerta')), '{}'), p_payload->>'observacoes', v_risk)
  ON CONFLICT (aluno_id) DO UPDATE SET organization_id = EXCLUDED.organization_id, consentimento = EXCLUDED.consentimento, restricoes = EXCLUDED.restricoes, lesoes_atuais = EXCLUDED.lesoes_atuais, historico_lesoes = EXCLUDED.historico_lesoes, cirurgias = EXCLUDED.cirurgias, dor_atual = EXCLUDED.dor_atual, sinais_alerta = EXCLUDED.sinais_alerta, observacoes = EXCLUDED.observacoes, risco = EXCLUDED.risco, validado_por = NULL, validado_em = NULL, updated_at = now()
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_student_safety_onboarding(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_student_safety_onboarding(UUID, UUID, JSONB) TO authenticated;
