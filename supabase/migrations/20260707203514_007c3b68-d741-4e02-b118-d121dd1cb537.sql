
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='treino_ia_status') THEN
    CREATE TYPE public.treino_ia_status AS ENUM ('pendente','aprovado','rejeitado');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.treinos_ia_fila (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  anamnese_id uuid REFERENCES public.anamnese_respostas(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  objetivo text,
  nivel text,
  resumo text,
  sugestao jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.treino_ia_status NOT NULL DEFAULT 'pendente',
  aprovado_por uuid,
  aprovado_em timestamptz,
  plano_treino_id uuid REFERENCES public.planos_treino(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.treinos_ia_fila TO authenticated;
GRANT ALL ON public.treinos_ia_fila TO service_role;

ALTER TABLE public.treinos_ia_fila ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fila_ia_select" ON public.treinos_ia_fila;
CREATE POLICY "fila_ia_select" ON public.treinos_ia_fila FOR SELECT TO authenticated
USING (organization_id IS NULL OR public.user_has_org(auth.uid(), organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "fila_ia_write" ON public.treinos_ia_fila;
CREATE POLICY "fila_ia_write" ON public.treinos_ia_fila FOR ALL TO authenticated
USING (organization_id IS NULL OR public.user_has_org(auth.uid(), organization_id) OR public.is_admin(auth.uid()))
WITH CHECK (organization_id IS NULL OR public.user_has_org(auth.uid(), organization_id) OR public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_fila_ia_updated_at ON public.treinos_ia_fila;
CREATE TRIGGER trg_fila_ia_updated_at BEFORE UPDATE ON public.treinos_ia_fila
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_fila_ia_status ON public.treinos_ia_fila(status);
CREATE INDEX IF NOT EXISTS idx_fila_ia_org ON public.treinos_ia_fila(organization_id);
