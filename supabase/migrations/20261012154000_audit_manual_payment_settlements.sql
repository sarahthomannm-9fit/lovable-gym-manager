CREATE TABLE public.payment_settlement_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id uuid NOT NULL REFERENCES public.pagamentos(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('manual_settlement','manual_reversal')),
  reference text NOT NULL, previous_status text NOT NULL, resulting_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_settlement_audit_payment ON public.payment_settlement_audit(pagamento_id,created_at);
ALTER TABLE public.payment_settlement_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_settlement_staff_read ON public.payment_settlement_audit FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=payment_settlement_audit.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
);
DROP POLICY IF EXISTS pagamento_insert_staff ON public.pagamentos;
CREATE POLICY pagamento_insert_staff ON public.pagamentos FOR INSERT TO authenticated WITH CHECK (
  status='pendente' AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.alunos a JOIN public.organization_members m ON m.organization_id=a.organization_id WHERE a.id=pagamentos.aluno_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')))
);

CREATE FUNCTION public.enforce_payment_status_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.data_pagamento IS DISTINCT FROM OLD.data_pagamento THEN
    IF current_setting('app.payment_transition_authorized',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Use o fluxo de baixa ou estorno com referência'; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_enforce_payment_status BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.enforce_payment_status_transition();

CREATE FUNCTION public.record_manual_payment(p_payment_id uuid,p_action text,p_reference text)
RETURNS public.pagamentos LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_payment public.pagamentos%ROWTYPE; v_org uuid; v_previous text;
BEGIN
  IF auth.uid() IS NULL OR length(btrim(coalesce(p_reference,'')))<5 THEN RAISE EXCEPTION 'Informe referência ou justificativa com pelo menos 5 caracteres'; END IF;
  SELECT * INTO v_payment FROM public.pagamentos WHERE id=p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pagamento não encontrado'; END IF;
  SELECT organization_id INTO v_org FROM public.alunos WHERE id=v_payment.aluno_id;
  IF v_org IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_org AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Sem permissão para este pagamento'; END IF;
  v_previous:=coalesce(v_payment.status,'pendente');
  IF p_action='settle' THEN
    IF v_payment.status='pago' THEN RETURN v_payment; END IF;
    IF v_payment.status NOT IN ('pendente','atrasado') THEN RAISE EXCEPTION 'Pagamento não pode ser baixado'; END IF;
    PERFORM set_config('app.payment_transition_authorized','yes',true);
    UPDATE public.pagamentos SET status='pago',data_pagamento=(now() AT TIME ZONE 'America/Sao_Paulo')::date,metodo_pagamento=coalesce(metodo_pagamento,'transferencia'),updated_at=now() WHERE id=p_payment_id RETURNING * INTO v_payment;
    INSERT INTO public.payment_settlement_audit(pagamento_id,organization_id,actor_id,action,reference,previous_status,resulting_status)
    VALUES(p_payment_id,v_org,auth.uid(),'manual_settlement',btrim(p_reference),v_previous,'pago');
  ELSIF p_action='reverse' THEN
    IF v_payment.status<>'pago' THEN RAISE EXCEPTION 'Somente pagamentos baixados podem ser estornados'; END IF;
    PERFORM set_config('app.payment_transition_authorized','yes',true);
    UPDATE public.pagamentos SET status='pendente',data_pagamento=NULL,updated_at=now() WHERE id=p_payment_id RETURNING * INTO v_payment;
    INSERT INTO public.payment_settlement_audit(pagamento_id,organization_id,actor_id,action,reference,previous_status,resulting_status)
    VALUES(p_payment_id,v_org,auth.uid(),'manual_reversal',btrim(p_reference),v_previous,'pendente');
  ELSE RAISE EXCEPTION 'Ação inválida'; END IF;
  RETURN v_payment;
END; $$;
REVOKE ALL ON FUNCTION public.record_manual_payment(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_manual_payment(uuid,text,text) TO authenticated;

