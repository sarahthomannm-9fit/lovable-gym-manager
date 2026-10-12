CREATE TABLE public.billing_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id),
  pagamento_id uuid NOT NULL UNIQUE REFERENCES public.pagamentos(id),
  titulo text NOT NULL, descricao text,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviada','cancelada')),
  sent_at timestamptz, created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_billing_charges_org_created ON public.billing_charges(organization_id,created_at DESC);
ALTER TABLE public.billing_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_charges_staff_read ON public.billing_charges FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=billing_charges.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
);

CREATE FUNCTION public.create_billing_charge(p_organization_id uuid,p_aluno_id uuid,p_titulo text,p_descricao text,p_valor numeric,p_due date)
RETURNS public.billing_charges LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_payment uuid; v_charge public.billing_charges;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=p_organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Sem permissão para criar cobrança'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.alunos WHERE id=p_aluno_id AND organization_id=p_organization_id) THEN RAISE EXCEPTION 'Aluno fora da organização'; END IF;
  IF length(btrim(coalesce(p_titulo,'')))<3 OR p_valor<=0 OR p_due IS NULL THEN RAISE EXCEPTION 'Informe título, valor e vencimento válidos'; END IF;
  INSERT INTO public.pagamentos(aluno_id,valor,data_vencimento,referencia_mes,status,observacoes)
  VALUES (p_aluno_id,p_valor,p_due,date_trunc('month',p_due)::date,'pendente',left(btrim(p_titulo),200)) RETURNING id INTO v_payment;
  INSERT INTO public.billing_charges(organization_id,aluno_id,pagamento_id,titulo,descricao,created_by)
  VALUES (p_organization_id,p_aluno_id,v_payment,btrim(p_titulo),nullif(btrim(coalesce(p_descricao,'')),''),auth.uid()) RETURNING * INTO v_charge;
  RETURN v_charge;
END; $$;
REVOKE ALL ON FUNCTION public.create_billing_charge(uuid,uuid,text,text,numeric,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_billing_charge(uuid,uuid,text,text,numeric,date) TO authenticated;

CREATE FUNCTION public.send_billing_charge(p_charge_id uuid)
RETURNS public.billing_charges LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_charge public.billing_charges; v_user uuid; v_payment public.pagamentos%ROWTYPE;
BEGIN
  SELECT * INTO v_charge FROM public.billing_charges WHERE id=p_charge_id FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_charge.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Cobrança não encontrada ou sem permissão'; END IF;
  IF v_charge.status='enviada' THEN RETURN v_charge; END IF;
  IF v_charge.status<>'rascunho' THEN RAISE EXCEPTION 'Cobrança cancelada'; END IF;
  SELECT * INTO v_payment FROM public.pagamentos WHERE id=v_charge.pagamento_id;
  SELECT user_id INTO v_user FROM public.alunos WHERE id=v_charge.aluno_id AND organization_id=v_charge.organization_id;
  IF v_user IS NULL THEN RAISE EXCEPTION 'Aluno ainda sem acesso ao aplicativo. Vincule a conta antes de enviar'; END IF;
  INSERT INTO public.notificacoes(tipo,titulo,mensagem,destinatario_tipo,destinatario_id,status,canal,data_envio,dados_extras)
  VALUES ('cobranca',v_charge.titulo,coalesce(v_charge.descricao||E'\n','')||'Valor: R$ '||v_payment.valor||' · vencimento: '||to_char(v_payment.data_vencimento,'DD/MM/YYYY'),'usuario',v_user,'enviada',ARRAY['sistema'],now(),jsonb_build_object('billing_charge_id',v_charge.id,'pagamento_id',v_charge.pagamento_id,'organization_id',v_charge.organization_id));
  UPDATE public.billing_charges SET status='enviada',sent_at=now() WHERE id=p_charge_id RETURNING * INTO v_charge;
  RETURN v_charge;
END; $$;
REVOKE ALL ON FUNCTION public.send_billing_charge(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.send_billing_charge(uuid) TO authenticated;

