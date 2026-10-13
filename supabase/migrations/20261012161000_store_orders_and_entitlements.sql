CREATE TABLE public.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL UNIQUE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id), sku_id uuid NOT NULL REFERENCES public.skus(id),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 100), unit_price numeric NOT NULL CHECK (unit_price>=0), total numeric NOT NULL CHECK (total>=0),
  payment_id uuid UNIQUE REFERENCES public.pagamentos(id),
  status text NOT NULL DEFAULT 'aguardando_pagamento' CHECK (status IN ('aguardando_pagamento','pago','entregue','cancelado')),
  created_by uuid NOT NULL REFERENCES auth.users(id), fulfillment_reference text,
  created_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz, fulfilled_at timestamptz
);
CREATE INDEX idx_store_orders_org_status ON public.store_orders(organization_id,status,created_at DESC);
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY store_orders_scoped_read ON public.store_orders FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.alunos a WHERE a.id=store_orders.aluno_id AND a.user_id=auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=store_orders.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
);
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS store_order_id uuid UNIQUE REFERENCES public.store_orders(id);
ALTER TABLE public.assinaturas ADD COLUMN IF NOT EXISTS store_order_id uuid UNIQUE REFERENCES public.store_orders(id);

CREATE FUNCTION public.place_store_order(p_organization_id uuid,p_aluno_id uuid,p_sku_id uuid,p_quantity integer,p_request_id uuid)
RETURNS public.store_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_sku public.skus%ROWTYPE; v_order public.store_orders; v_payment uuid; v_sold integer;
BEGIN
  IF auth.uid() IS NULL OR p_request_id IS NULL OR p_quantity NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Pedido inválido'; END IF;
  SELECT * INTO v_order FROM public.store_orders WHERE request_id=p_request_id;
  IF FOUND THEN
    IF v_order.organization_id<>p_organization_id OR v_order.aluno_id<>p_aluno_id OR v_order.sku_id<>p_sku_id OR v_order.created_by<>auth.uid() THEN RAISE EXCEPTION 'Chave de pedido já utilizada'; END IF;
    RETURN v_order;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.alunos a WHERE a.id=p_aluno_id AND a.organization_id=p_organization_id AND (a.user_id=auth.uid() OR public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=p_organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')))) THEN RAISE EXCEPTION 'Aluno fora da organização ou sem acesso'; END IF;
  SELECT * INTO v_sku FROM public.skus WHERE id=p_sku_id AND ativo=true FOR UPDATE;
  IF NOT FOUND OR v_sku.preco<0 THEN RAISE EXCEPTION 'SKU indisponível'; END IF;
  IF v_sku.capacidade IS NOT NULL AND v_sku.tipo::text='produto_fisico' THEN
    SELECT coalesce(sum(quantity),0) INTO v_sold FROM public.store_orders WHERE sku_id=p_sku_id AND status IN ('aguardando_pagamento','pago','entregue');
    IF v_sold+p_quantity>v_sku.capacidade THEN RAISE EXCEPTION 'Estoque insuficiente'; END IF;
  END IF;
  INSERT INTO public.pagamentos(aluno_id,valor,data_vencimento,referencia_mes,status,metodo_pagamento,observacoes)
  VALUES(p_aluno_id,v_sku.preco*p_quantity,(now() AT TIME ZONE 'America/Sao_Paulo')::date,date_trunc('month',now() AT TIME ZONE 'America/Sao_Paulo')::date,'pendente','transferencia','Pedido Store · '||v_sku.nome) RETURNING id INTO v_payment;
  INSERT INTO public.store_orders(request_id,organization_id,aluno_id,sku_id,quantity,unit_price,total,payment_id,created_by)
  VALUES(p_request_id,p_organization_id,p_aluno_id,p_sku_id,p_quantity,v_sku.preco,v_sku.preco*p_quantity,v_payment,auth.uid()) RETURNING * INTO v_order;
  RETURN v_order;
END; $$;
REVOKE ALL ON FUNCTION public.place_store_order(uuid,uuid,uuid,integer,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.place_store_order(uuid,uuid,uuid,integer,uuid) TO authenticated;

CREATE FUNCTION public.sync_store_payment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_order public.store_orders%ROWTYPE; v_sku public.skus%ROWTYPE; v_end date;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT * INTO v_order FROM public.store_orders WHERE payment_id=NEW.id FOR UPDATE;
  IF NOT FOUND THEN RETURN NEW; END IF;
  SELECT * INTO v_sku FROM public.skus WHERE id=v_order.sku_id;
  IF NEW.status='pago' THEN
    UPDATE public.store_orders SET status='pago',paid_at=now() WHERE id=v_order.id;
    v_end:=CASE v_sku.recorrencia::text WHEN 'mensal' THEN current_date+interval '1 month' WHEN 'trimestral' THEN current_date+interval '3 months' WHEN 'semestral' THEN current_date+interval '6 months' WHEN 'anual' THEN current_date+interval '1 year' ELSE NULL END;
    INSERT INTO public.entitlements(aluno_id,sku_id,status,data_inicio,data_fim,store_order_id)
    VALUES(v_order.aluno_id,v_order.sku_id,'ativo',current_date,v_end,v_order.id)
    ON CONFLICT (store_order_id) DO UPDATE SET status='ativo',data_inicio=current_date,data_fim=excluded.data_fim;
    IF v_sku.plano_id IS NOT NULL THEN
      INSERT INTO public.assinaturas(aluno_id,plano_id,status,data_inicio,data_fim,valor_recorrente,metodo_pagamento,store_order_id)
      VALUES(v_order.aluno_id,v_sku.plano_id,'ativa',current_date,v_end,v_order.total,'transferencia',v_order.id)
      ON CONFLICT (store_order_id) DO UPDATE SET status='ativa',data_inicio=current_date,data_fim=excluded.data_fim;
    END IF;
  ELSIF OLD.status='pago' AND NEW.status<>'pago' THEN
    UPDATE public.store_orders SET status='aguardando_pagamento',paid_at=NULL WHERE id=v_order.id;
    UPDATE public.entitlements SET status='suspenso' WHERE store_order_id=v_order.id;
    UPDATE public.assinaturas SET status='pausada' WHERE store_order_id=v_order.id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_sync_store_payment AFTER UPDATE OF status ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.sync_store_payment();

CREATE FUNCTION public.fulfill_store_order(p_order_id uuid,p_reference text)
RETURNS public.store_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_order public.store_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.store_orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_order.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Pedido não encontrado ou sem permissão'; END IF;
  IF v_order.status='entregue' THEN RETURN v_order; END IF;
  IF v_order.status<>'pago' OR length(btrim(coalesce(p_reference,'')))<5 THEN RAISE EXCEPTION 'Pedido deve estar pago e ter comprovante de entrega'; END IF;
  UPDATE public.store_orders SET status='entregue',fulfillment_reference=btrim(p_reference),fulfilled_at=now() WHERE id=p_order_id RETURNING * INTO v_order;
  RETURN v_order;
END; $$;
REVOKE ALL ON FUNCTION public.fulfill_store_order(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fulfill_store_order(uuid,text) TO authenticated;

