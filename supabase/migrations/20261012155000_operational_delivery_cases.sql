CREATE TABLE public.operational_delivery_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  module_key text NOT NULL CHECK (module_key IN ('operacao','ceo','consultoria','concierge','trust','network','automacao','cfo')),
  title text NOT NULL, description text,
  source_type text, source_id uuid,
  owner_id uuid REFERENCES auth.users(id), due_on date,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_andamento','aguardando_aprovacao','concluido','cancelado')),
  evidence_url text, outcome text,
  created_by uuid NOT NULL REFERENCES auth.users(id), completed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_operational_delivery_cases_scope ON public.operational_delivery_cases(organization_id,module_key,status);
ALTER TABLE public.operational_delivery_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY operational_cases_staff_read ON public.operational_delivery_cases FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=operational_delivery_cases.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))
);
CREATE POLICY operational_cases_staff_insert ON public.operational_delivery_cases FOR INSERT TO authenticated WITH CHECK (
  created_by=auth.uid() AND status='aberto' AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=operational_delivery_cases.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico')))
);
CREATE TABLE public.operational_delivery_case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES public.operational_delivery_cases(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id), action text NOT NULL, detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.operational_delivery_case_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY operational_case_events_staff_read ON public.operational_delivery_case_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.operational_delivery_cases c WHERE c.id=case_id AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=c.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))))
);

CREATE FUNCTION public.transition_operational_case(p_case_id uuid,p_status text,p_detail text DEFAULT NULL,p_evidence_url text DEFAULT NULL)
RETURNS public.operational_delivery_cases LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_case public.operational_delivery_cases%ROWTYPE;
BEGIN
  SELECT * INTO v_case FROM public.operational_delivery_cases WHERE id=p_case_id FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_case.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))) THEN RAISE EXCEPTION 'Caso não encontrado ou sem acesso'; END IF;
  IF v_case.status IN ('concluido','cancelado') THEN RAISE EXCEPTION 'Caso encerrado'; END IF;
  IF p_status NOT IN ('em_andamento','aguardando_aprovacao','concluido','cancelado') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
  IF p_status='concluido' AND (length(btrim(coalesce(p_detail,'')))<10 OR p_evidence_url !~ '^https://[^[:space:]]+$') THEN RAISE EXCEPTION 'Conclusão exige resultado e URL HTTPS de evidência'; END IF;
  UPDATE public.operational_delivery_cases SET status=p_status,outcome=CASE WHEN p_status='concluido' THEN btrim(p_detail) ELSE outcome END,evidence_url=CASE WHEN p_status='concluido' THEN p_evidence_url ELSE evidence_url END,completed_by=CASE WHEN p_status='concluido' THEN auth.uid() ELSE completed_by END,updated_at=now() WHERE id=p_case_id RETURNING * INTO v_case;
  INSERT INTO public.operational_delivery_case_events(case_id,actor_id,action,detail) VALUES(p_case_id,auth.uid(),p_status,p_detail);
  RETURN v_case;
END; $$;
REVOKE ALL ON FUNCTION public.transition_operational_case(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transition_operational_case(uuid,text,text,text) TO authenticated;

