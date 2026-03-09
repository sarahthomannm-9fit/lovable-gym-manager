
-- Fase 1: Identidade Central da Pessoa (Lifecycle)

-- 1. Criar enum pessoa_status
CREATE TYPE public.pessoa_status AS ENUM (
  'lead', 'lead_aquecido', 'experimental', 'ativo', 'recorrente', 'inativo', 'ex_aluno'
);

-- 2. Adicionar lifecycle_status na tabela alunos (default 'ativo' para dados existentes)
ALTER TABLE public.alunos ADD COLUMN lifecycle_status public.pessoa_status NOT NULL DEFAULT 'ativo';

-- 3. Adicionar lead_id para unificar leads com alunos
ALTER TABLE public.alunos ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- 4. Criar tabela pessoa_eventos para historico completo
CREATE TABLE public.pessoa_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  tipo_evento text NOT NULL,
  descricao text,
  dados jsonb DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Criar indice para performance
CREATE INDEX idx_pessoa_eventos_pessoa_id ON public.pessoa_eventos(pessoa_id);
CREATE INDEX idx_pessoa_eventos_tipo ON public.pessoa_eventos(tipo_evento);
CREATE INDEX idx_pessoa_eventos_created ON public.pessoa_eventos(created_at DESC);
CREATE INDEX idx_alunos_lifecycle ON public.alunos(lifecycle_status);
CREATE INDEX idx_alunos_lead_id ON public.alunos(lead_id);

-- 6. Habilitar RLS
ALTER TABLE public.pessoa_eventos ENABLE ROW LEVEL SECURITY;

-- 7. Policy de acesso publico (sem auth, como o resto do sistema)
CREATE POLICY "Allow full access to pessoa_eventos"
  ON public.pessoa_eventos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Atualizar lifecycle_status baseado no status atual
UPDATE public.alunos SET lifecycle_status = 'ativo' WHERE status = 'ativo' OR status IS NULL;
UPDATE public.alunos SET lifecycle_status = 'inativo' WHERE status = 'inativo';
UPDATE public.alunos SET lifecycle_status = 'ex_aluno' WHERE status = 'cancelado';
