ALTER TABLE public.exercicios_biblioteca
  ADD COLUMN IF NOT EXISTS restricoes_incompativeis TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_exercises_restrictions
  ON public.exercicios_biblioteca USING gin (restricoes_incompativeis);
