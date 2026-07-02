
-- Extend leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS empresa text,
  ADD COLUMN IF NOT EXISTS nome_contato text,
  ADD COLUMN IF NOT EXISTS tipo text,
  ADD COLUMN IF NOT EXISTS orcamento_estimado numeric,
  ADD COLUMN IF NOT EXISTS data_evento date;

-- proposals
CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  descricao text,
  itens_inclusos text,
  data_validade date,
  status text NOT NULL DEFAULT 'rascunho',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_auth_all" ON public.proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_proposals_updated_at BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- follow_ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  descricao text,
  proxima_acao text,
  data_proxima_acao date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_ups TO authenticated;
GRANT ALL ON public.follow_ups TO service_role;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_ups_auth_all" ON public.follow_ups FOR ALL TO authenticated USING (true) WITH CHECK (true);
