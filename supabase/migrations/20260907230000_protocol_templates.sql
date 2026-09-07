CREATE TABLE IF NOT EXISTS public.workout_protocol_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  objetivo TEXT NOT NULL CHECK (objetivo IN ('Hipertrofia','Emagrecimento','Postural e mobilidade','Cardio','Força','Funcional')),
  nivel TEXT NOT NULL DEFAULT 'iniciante',
  descricao TEXT,
  sessoes_semana INTEGER NOT NULL DEFAULT 3 CHECK (sessoes_semana BETWEEN 1 AND 7),
  estrutura JSONB NOT NULL DEFAULT '{}'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_protocol_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "protocol_templates_read" ON public.workout_protocol_templates;
CREATE POLICY "protocol_templates_read" ON public.workout_protocol_templates FOR SELECT TO authenticated
USING (ativo = true AND (organization_id IS NULL OR public.user_has_org(auth.uid(), organization_id) OR public.is_admin(auth.uid())));

DROP POLICY IF EXISTS "protocol_templates_write" ON public.workout_protocol_templates;
CREATE POLICY "protocol_templates_write" ON public.workout_protocol_templates FOR ALL TO authenticated
USING (public.is_admin(auth.uid()) OR organization_id IS NULL OR public.user_has_org(auth.uid(), organization_id))
WITH CHECK (public.is_admin(auth.uid()) OR organization_id IS NULL OR public.user_has_org(auth.uid(), organization_id));

INSERT INTO public.workout_protocol_templates (organization_id, nome, objetivo, nivel, descricao, sessoes_semana, estrutura)
SELECT NULL, v.nome, v.objetivo, 'iniciante', v.descricao, v.sessoes, v.estrutura::jsonb
FROM (VALUES
  ('Base de força — iniciante', 'Força', 'Movimentos básicos com progressão gradual.', 3, '{"foco":"força","dias":[1,3,5]}' ),
  ('Mobilidade e postura — iniciante', 'Postural e mobilidade', 'Mobilidade global, controle motor e alongamentos.', 3, '{"foco":"mobilidade","dias":[1,3,5]}' ),
  ('Condicionamento — iniciante', 'Cardio', 'Sessões progressivas de condicionamento.', 3, '{"foco":"cardio","dias":[1,3,5]}' )
) AS v(nome, objetivo, descricao, sessoes, estrutura)
WHERE NOT EXISTS (SELECT 1 FROM public.workout_protocol_templates t WHERE t.nome = v.nome AND t.organization_id IS NULL);
