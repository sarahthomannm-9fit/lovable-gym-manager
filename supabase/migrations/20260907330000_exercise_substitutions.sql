-- Catálogo de substituições seguras para manter o objetivo do protocolo.
CREATE TABLE IF NOT EXISTS public.exercise_substitution_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercicios_biblioteca(id) ON DELETE CASCADE,
  substitute_exercise_id UUID NOT NULL REFERENCES public.exercicios_biblioteca(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  prioridade INTEGER NOT NULL DEFAULT 1 CHECK (prioridade > 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exercise_id, substitute_exercise_id)
);

ALTER TABLE public.exercise_substitution_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exercise_substitution_read" ON public.exercise_substitution_rules;
CREATE POLICY "exercise_substitution_read"
  ON public.exercise_substitution_rules FOR SELECT TO authenticated
  USING (ativo = true);

DROP POLICY IF EXISTS "exercise_substitution_write" ON public.exercise_substitution_rules;
CREATE POLICY "exercise_substitution_write"
  ON public.exercise_substitution_rules FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.exercise_substitutions(p_exercise_id UUID)
RETURNS SETOF public.exercise_substitution_rules
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.*
    FROM public.exercise_substitution_rules r
   WHERE r.exercise_id = p_exercise_id
     AND r.ativo = true
   ORDER BY r.prioridade ASC, r.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.exercise_substitutions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exercise_substitutions(UUID) TO authenticated;
