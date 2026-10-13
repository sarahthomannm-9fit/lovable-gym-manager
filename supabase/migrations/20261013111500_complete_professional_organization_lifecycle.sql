-- A professional organization becomes operational when its invited coach accepts.
CREATE TABLE public.organization_commercial_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  sku text NOT NULL DEFAULT 'essencial',
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('rascunho','ativo','suspenso','cancelado')),
  seats integer NOT NULL DEFAULT 1 CHECK (seats > 0),
  starts_on date NOT NULL DEFAULT current_date,
  ends_on date,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organization_commercial_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_commercial_plans_read ON public.organization_commercial_plans FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=organization_commercial_plans.organization_id AND m.user_id=auth.uid())
);
CREATE POLICY organization_commercial_plans_manage ON public.organization_commercial_plans FOR ALL TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=organization_commercial_plans.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','professor'))
) WITH CHECK (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=organization_commercial_plans.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','professor'))
);

CREATE OR REPLACE FUNCTION public.create_professional_staff_after_invite()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_org public.organizations; v_name text;
BEGIN
  IF NEW.status='aceito' AND OLD.status='pendente' AND NEW.papel::text='professor' THEN
    SELECT * INTO v_org FROM public.organizations WHERE id=NEW.organization_id;
    IF FOUND AND v_org.tipo='professor' THEN
      SELECT coalesce(nullif(btrim(nome),''), split_part(NEW.email,'@',1)) INTO v_name FROM public.profiles WHERE id=NEW.accepted_by;
      INSERT INTO public.funcionarios(organization_id,user_id,nome,email,cargo,ativo,horarios)
      VALUES(NEW.organization_id,NEW.accepted_by,v_name,NEW.email,'professor',true,'{}'::jsonb)
      ON CONFLICT (organization_id,user_id) WHERE user_id IS NOT NULL DO UPDATE SET ativo=true;
      INSERT INTO public.organization_commercial_plans(organization_id,created_by)
      VALUES(NEW.organization_id,NEW.accepted_by) ON CONFLICT (organization_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS create_professional_staff_after_invite ON public.organization_invites;
CREATE TRIGGER create_professional_staff_after_invite AFTER UPDATE OF status ON public.organization_invites
FOR EACH ROW EXECUTE FUNCTION public.create_professional_staff_after_invite();

CREATE OR REPLACE FUNCTION public.set_professional_organization_status(p_organization_id uuid,p_status text,p_reason text)
RETURNS public.organizations LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_org public.organizations;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
  SELECT * INTO v_org FROM public.organizations WHERE id=p_organization_id FOR UPDATE;
  IF NOT FOUND OR v_org.tipo<>'professor' THEN RAISE EXCEPTION 'Assessoria não encontrada'; END IF;
  IF p_status NOT IN ('ativo','suspenso') THEN RAISE EXCEPTION 'Status inválido'; END IF;
  IF NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_org.id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_status='suspenso' AND length(btrim(coalesce(p_reason,'')))<5 THEN RAISE EXCEPTION 'Informe o motivo da suspensão'; END IF;
  UPDATE public.organizations SET status=p_status, metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object('status_reason',nullif(btrim(p_reason),''),'status_changed_at',now()) WHERE id=v_org.id RETURNING * INTO v_org;
  UPDATE public.organization_commercial_plans SET status=CASE WHEN p_status='ativo' THEN 'ativo' ELSE 'suspenso' END, updated_at=now() WHERE organization_id=v_org.id;
  IF p_status='suspenso' THEN UPDATE public.funcionarios SET ativo=false WHERE organization_id=v_org.id AND cargo IN ('professor','personal'); END IF;
  RETURN v_org;
END $$;
REVOKE ALL ON FUNCTION public.set_professional_organization_status(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_professional_organization_status(uuid,text,text) TO authenticated;

