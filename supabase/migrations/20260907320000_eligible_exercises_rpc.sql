-- Filtro seguro de exercícios por restrições clínicas.
CREATE OR REPLACE FUNCTION public.eligible_exercises(p_restrictions TEXT[] DEFAULT '{}')
RETURNS SETOF public.exercicios_biblioteca
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.*
    FROM public.exercicios_biblioteca e
   WHERE e.ativo = true
     AND NOT (COALESCE(e.restricoes_incompativeis, '{}'::text[]) && COALESCE(p_restrictions, '{}'::text[]));
$$;

REVOKE ALL ON FUNCTION public.eligible_exercises(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eligible_exercises(TEXT[]) TO authenticated;
