-- Stores restriction tags used to exclude unsafe exercises during protocol creation.
ALTER TABLE public.exercicios_biblioteca
  ADD COLUMN IF NOT EXISTS restricoes_incompativeis TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_exercicios_biblioteca_restricoes
  ON public.exercicios_biblioteca USING gin (restricoes_incompativeis);

