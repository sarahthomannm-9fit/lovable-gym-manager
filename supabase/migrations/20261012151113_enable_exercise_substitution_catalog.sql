CREATE TABLE IF NOT EXISTS public.exercise_substitution_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES public.exercicios_biblioteca(id) ON DELETE CASCADE,
  substitute_exercise_id uuid NOT NULL REFERENCES public.exercicios_biblioteca(id) ON DELETE CASCADE,
  motivo text NOT NULL, prioridade integer NOT NULL DEFAULT 1 CHECK (prioridade > 0),
  ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(exercise_id,substitute_exercise_id), CHECK(exercise_id<>substitute_exercise_id)
);
ALTER TABLE public.exercise_substitution_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercise_substitution_read" ON public.exercise_substitution_rules FOR SELECT TO authenticated USING (ativo=true);
CREATE POLICY "exercise_substitution_write" ON public.exercise_substitution_rules FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.exercise_substitutions(p_exercise_id uuid)
RETURNS SETOF public.exercise_substitution_rules LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT r.* FROM public.exercise_substitution_rules r JOIN public.exercicios_biblioteca e ON e.id=r.substitute_exercise_id WHERE r.exercise_id=p_exercise_id AND r.ativo=true AND e.ativo=true AND auth.uid() IS NOT NULL ORDER BY r.prioridade,r.created_at; $$;
REVOKE ALL ON FUNCTION public.exercise_substitutions(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.exercise_substitutions(uuid) TO authenticated;

