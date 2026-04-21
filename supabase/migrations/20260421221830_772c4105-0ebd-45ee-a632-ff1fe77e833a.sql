-- Tabela de logs de agentes (memória central RON Core)
CREATE TABLE public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  triggered_by text NOT NULL DEFAULT 'ceo',
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'success',
  latency_ms integer,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to agent_logs"
ON public.agent_logs FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_agent_logs_agent_created ON public.agent_logs(agent_id, created_at DESC);

-- Tabela de propostas B2B
CREATE TABLE public.propostas_b2b (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa text NOT NULL,
  contato text,
  email text,
  telefone text,
  servicos jsonb DEFAULT '[]'::jsonb,
  valor numeric,
  html text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.propostas_b2b ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to propostas_b2b"
ON public.propostas_b2b FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER set_propostas_b2b_updated_at
BEFORE UPDATE ON public.propostas_b2b
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();