-- Configuração operacional do espaço físico por condomínio.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS capacidade_academia INTEGER CHECK (capacidade_academia IS NULL OR capacidade_academia > 0),
  ADD COLUMN IF NOT EXISTS horarios_academia JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS restricoes_academia TEXT[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.organizations.capacidade_academia IS 'Capacidade simultânea validada da academia.';
COMMENT ON COLUMN public.organizations.horarios_academia IS 'Janela semanal de funcionamento, por dia.';
COMMENT ON COLUMN public.organizations.restricoes_academia IS 'Restrições operacionais que o motor deve respeitar.';
