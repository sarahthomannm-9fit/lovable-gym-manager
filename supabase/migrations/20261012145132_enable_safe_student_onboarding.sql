-- Safety intake is sensitive health data. It is written and reviewed only through
-- checked RPCs, never by a broad client-side table policy.
CREATE TABLE IF NOT EXISTS public.student_safety_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  consentimento boolean NOT NULL DEFAULT false,
  restricoes text[] NOT NULL DEFAULT '{}',
  lesoes_atuais text[] NOT NULL DEFAULT '{}',
  historico_lesoes text,
  cirurgias text,
  dor_atual boolean NOT NULL DEFAULT false,
  sinais_alerta text[] NOT NULL DEFAULT '{}',
  observacoes text,
  objetivo text,
  risco text NOT NULL DEFAULT 'pendente' CHECK (risco IN ('pendente', 'baixo', 'moderado', 'alto', 'bloqueado')),
  validado_por uuid REFERENCES auth.users(id),
  validado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aluno_id)
);

CREATE TABLE IF NOT EXISTS public.treinos_ia_fila (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  objetivo text,
  resumo text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  aprovado_por uuid REFERENCES auth.users(id),
  aprovado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_safety_org ON public.student_safety_onboarding (organization_id, risco);
CREATE INDEX IF NOT EXISTS idx_treinos_ia_fila_review ON public.treinos_ia_fila (organization_id, status, created_at DESC);

ALTER TABLE public.student_safety_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos_ia_fila ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_safety_read" ON public.student_safety_onboarding;
CREATE POLICY "student_safety_read" ON public.student_safety_onboarding FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = student_safety_onboarding.organization_id
      AND m.user_id = auth.uid()
      AND m.papel::text IN ('admin', 'manager', 'professor')
  )
);

DROP POLICY IF EXISTS "student_safety_write" ON public.student_safety_onboarding;
DROP POLICY IF EXISTS "safety_queue_read" ON public.treinos_ia_fila;
CREATE POLICY "safety_queue_read" ON public.treinos_ia_fila FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = treinos_ia_fila.organization_id
      AND m.user_id = auth.uid()
      AND m.papel::text IN ('admin', 'manager', 'professor')
  )
);

CREATE OR REPLACE FUNCTION public.submit_student_safety_onboarding(
  p_aluno_id uuid,
  p_organization_id uuid,
  p_payload jsonb
) RETURNS public.student_safety_onboarding
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_aluno public.alunos%ROWTYPE;
  v_row public.student_safety_onboarding%ROWTYPE;
  v_risco text := 'baixo';
  v_alertas integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN RAISE EXCEPTION 'Dados de triagem inválidos'; END IF;
  IF coalesce((p_payload->>'consentimento')::boolean, false) = false THEN RAISE EXCEPTION 'Consentimento obrigatório'; END IF;
  IF coalesce(jsonb_typeof(p_payload->'restricoes'), 'array') <> 'array'
     OR coalesce(jsonb_typeof(p_payload->'lesoes_atuais'), 'array') <> 'array'
     OR coalesce(jsonb_typeof(p_payload->'sinais_alerta'), 'array') <> 'array' THEN
    RAISE EXCEPTION 'Listas de triagem inválidas';
  END IF;
  SELECT * INTO v_aluno FROM public.alunos WHERE id = p_aluno_id;
  IF NOT FOUND OR v_aluno.organization_id IS DISTINCT FROM p_organization_id THEN RAISE EXCEPTION 'Cadastro não pertence ao condomínio informado'; END IF;
  IF v_aluno.user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Você só pode enviar sua própria triagem'; END IF;

  v_alertas := coalesce(jsonb_array_length(p_payload->'lesoes_atuais'), 0)
    + coalesce(jsonb_array_length(p_payload->'sinais_alerta'), 0)
    + case when coalesce((p_payload->>'dor_atual')::boolean, false) then 1 else 0 end;
  IF v_alertas > 0 THEN v_risco := 'moderado'; END IF;
  IF coalesce(jsonb_array_length(p_payload->'sinais_alerta'), 0) > 0
     OR length(trim(coalesce(p_payload->>'cirurgias', ''))) > 0 THEN v_risco := 'alto'; END IF;

  INSERT INTO public.student_safety_onboarding (
    aluno_id, organization_id, consentimento, restricoes, lesoes_atuais, historico_lesoes,
    cirurgias, dor_atual, sinais_alerta, observacoes, objetivo, risco, validado_por, validado_em
  ) VALUES (
    p_aluno_id, p_organization_id, true,
    coalesce(array(select jsonb_array_elements_text(p_payload->'restricoes')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_payload->'lesoes_atuais')), '{}'),
    left(p_payload->>'historico_lesoes', 4000), left(p_payload->>'cirurgias', 4000),
    coalesce((p_payload->>'dor_atual')::boolean, false),
    coalesce(array(select jsonb_array_elements_text(p_payload->'sinais_alerta')), '{}'),
    left(p_payload->>'observacoes', 4000), left(p_payload->>'objetivo', 160), v_risco, NULL, NULL
  ) ON CONFLICT (aluno_id) DO UPDATE SET
    organization_id = excluded.organization_id, consentimento = excluded.consentimento,
    restricoes = excluded.restricoes, lesoes_atuais = excluded.lesoes_atuais,
    historico_lesoes = excluded.historico_lesoes, cirurgias = excluded.cirurgias,
    dor_atual = excluded.dor_atual, sinais_alerta = excluded.sinais_alerta,
    observacoes = excluded.observacoes, objetivo = excluded.objetivo, risco = excluded.risco,
    validado_por = NULL, validado_em = NULL, updated_at = now()
  RETURNING * INTO v_row;

  IF v_risco IN ('moderado', 'alto') AND NOT EXISTS (
    SELECT 1 FROM public.treinos_ia_fila q WHERE q.aluno_id = p_aluno_id AND q.status = 'pendente'
  ) THEN
    INSERT INTO public.treinos_ia_fila (aluno_id, organization_id, objetivo, resumo)
    VALUES (p_aluno_id, p_organization_id, v_row.objetivo, 'Triagem de segurança requer avaliação profissional antes da prescrição.');
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_student_safety(p_queue_id uuid, p_decision text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_queue public.treinos_ia_fila%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  IF p_decision NOT IN ('aprovado', 'rejeitado') THEN RAISE EXCEPTION 'Decisão inválida'; END IF;
  SELECT * INTO v_queue FROM public.treinos_ia_fila WHERE id = p_queue_id FOR UPDATE;
  IF NOT FOUND OR NOT (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.organization_members m WHERE m.organization_id = v_queue.organization_id
        AND m.user_id = auth.uid() AND m.papel::text IN ('admin', 'manager', 'professor')
    )
  ) THEN RAISE EXCEPTION 'Caso não encontrado ou sem permissão'; END IF;
  UPDATE public.treinos_ia_fila SET status = p_decision, aprovado_por = auth.uid(), aprovado_em = now(), updated_at = now() WHERE id = v_queue.id;
  UPDATE public.student_safety_onboarding SET risco = CASE WHEN p_decision = 'aprovado' THEN 'baixo' ELSE 'bloqueado' END,
    validado_por = auth.uid(), validado_em = now(), updated_at = now() WHERE aluno_id = v_queue.aluno_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.student_is_safe_for_workout(p_aluno_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.student_safety_onboarding
  WHERE aluno_id = p_aluno_id AND risco = 'baixo' AND consentimento = true
); $$;

REVOKE ALL ON FUNCTION public.submit_student_safety_onboarding(uuid, uuid, jsonb), public.review_student_safety(uuid, text), public.student_is_safe_for_workout(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_student_safety_onboarding(uuid, uuid, jsonb), public.review_student_safety(uuid, text), public.student_is_safe_for_workout(uuid) TO authenticated;

