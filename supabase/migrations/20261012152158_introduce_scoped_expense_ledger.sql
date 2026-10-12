CREATE TABLE IF NOT EXISTS public.expense_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  categoria text NOT NULL, subcategoria text, fornecedor text,
  descricao text NOT NULL, valor numeric NOT NULL CHECK (valor>0),
  data_vencimento date NOT NULL, data_pagamento date,
  tipo text NOT NULL CHECK (tipo IN ('fixa','variavel')),
  recorrente boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','aprovada','paga','cancelada')),
  comprovante_url text, created_by uuid NOT NULL REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id), paid_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expense_ledger_org_due ON public.expense_ledger(organization_id,data_vencimento);
ALTER TABLE public.expense_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_ledger_staff_read" ON public.expense_ledger FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=expense_ledger.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
);
CREATE POLICY "expense_ledger_staff_insert" ON public.expense_ledger FOR INSERT TO authenticated WITH CHECK (
  created_by=auth.uid() AND status='rascunho' AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=expense_ledger.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')))
);

CREATE OR REPLACE FUNCTION public.transition_expense(p_id uuid,p_action text,p_proof_url text DEFAULT NULL)
RETURNS public.expense_ledger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_row public.expense_ledger%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  SELECT * INTO v_row FROM public.expense_ledger WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_row.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Despesa não encontrada ou sem permissão'; END IF;
  IF p_action='approve' AND v_row.status='rascunho' THEN
    UPDATE public.expense_ledger SET status='aprovada',approved_by=auth.uid(),updated_at=now() WHERE id=p_id RETURNING * INTO v_row;
  ELSIF p_action='pay' AND v_row.status='aprovada' THEN
    IF p_proof_url IS NULL OR p_proof_url !~ '^https://[^[:space:]]+$' THEN RAISE EXCEPTION 'Informe URL HTTPS do comprovante para baixa manual'; END IF;
    UPDATE public.expense_ledger SET status='paga',data_pagamento=(now() AT TIME ZONE 'America/Sao_Paulo')::date,comprovante_url=p_proof_url,paid_by=auth.uid(),updated_at=now() WHERE id=p_id RETURNING * INTO v_row;
  ELSIF p_action='cancel' AND v_row.status IN ('rascunho','aprovada') THEN
    UPDATE public.expense_ledger SET status='cancelada',updated_at=now() WHERE id=p_id RETURNING * INTO v_row;
  ELSE RAISE EXCEPTION 'Transição de despesa inválida'; END IF;
  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.transition_expense(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transition_expense(uuid,text,text) TO authenticated;

