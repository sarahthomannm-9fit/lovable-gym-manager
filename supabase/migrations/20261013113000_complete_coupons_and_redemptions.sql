CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  code text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric(12,2) NOT NULL CHECK (discount_value > 0),
  starts_on date NOT NULL DEFAULT current_date,
  ends_on date NOT NULL,
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','ended')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, code)
);
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id),
  payment_id uuid NOT NULL REFERENCES public.pagamentos(id),
  original_amount numeric(12,2) NOT NULL,
  discount_amount numeric(12,2) NOT NULL CHECK (discount_amount > 0),
  final_amount numeric(12,2) NOT NULL CHECK (final_amount >= 0),
  redeemed_by uuid NOT NULL REFERENCES auth.users(id),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, payment_id),
  UNIQUE(payment_id)
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY coupons_manage_org ON public.coupons FOR ALL TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=coupons.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
) WITH CHECK (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=coupons.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
);
CREATE POLICY coupon_redemptions_read_org ON public.coupon_redemptions FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=coupon_redemptions.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')) OR EXISTS (SELECT 1 FROM public.alunos a WHERE a.id=coupon_redemptions.aluno_id AND a.user_id=auth.uid())
);

CREATE OR REPLACE FUNCTION public.apply_coupon_to_payment(p_code text,p_payment_id uuid)
RETURNS public.coupon_redemptions LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_coupon public.coupons; v_payment public.pagamentos; v_org uuid; v_discount numeric(12,2); v_row public.coupon_redemptions;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
  SELECT a.organization_id INTO v_org FROM public.pagamentos p JOIN public.alunos a ON a.id=p.aluno_id WHERE p.id=p_payment_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Cobrança não encontrada'; END IF;
  IF NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_org AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT * INTO v_payment FROM public.pagamentos WHERE id=p_payment_id FOR UPDATE;
  IF NOT FOUND OR v_payment.status <> 'pendente' THEN RAISE EXCEPTION 'Apenas cobranças pendentes podem receber cupom'; END IF;
  SELECT * INTO v_coupon FROM public.coupons WHERE organization_id=v_org AND upper(code)=upper(btrim(p_code)) FOR UPDATE;
  IF NOT FOUND OR v_coupon.status<>'active' OR current_date NOT BETWEEN v_coupon.starts_on AND v_coupon.ends_on OR (v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count>=v_coupon.usage_limit) THEN RAISE EXCEPTION 'Cupom indisponível'; END IF;
  IF EXISTS (SELECT 1 FROM public.coupon_redemptions WHERE payment_id=p_payment_id) THEN RAISE EXCEPTION 'Esta cobrança já possui desconto'; END IF;
  v_discount := CASE WHEN v_coupon.discount_type='percent' THEN round(v_payment.valor*v_coupon.discount_value/100,2) ELSE least(v_payment.valor,v_coupon.discount_value) END;
  IF v_discount<=0 THEN RAISE EXCEPTION 'Desconto inválido'; END IF;
  UPDATE public.pagamentos SET valor=v_payment.valor-v_discount, observacoes=concat_ws(E'\n',observacoes,'Cupom ',v_coupon.code,' aplicado: R$ ',v_discount) WHERE id=v_payment.id;
  UPDATE public.coupons SET usage_count=usage_count+1, updated_at=now() WHERE id=v_coupon.id;
  INSERT INTO public.coupon_redemptions(coupon_id,organization_id,aluno_id,payment_id,original_amount,discount_amount,final_amount,redeemed_by)
  VALUES(v_coupon.id,v_org,v_payment.aluno_id,v_payment.id,v_payment.valor,v_discount,v_payment.valor-v_discount,auth.uid()) RETURNING * INTO v_row;
  RETURN v_row;
END $$;
REVOKE ALL ON FUNCTION public.apply_coupon_to_payment(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_coupon_to_payment(text,uuid) TO authenticated;

