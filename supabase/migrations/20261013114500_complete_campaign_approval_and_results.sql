ALTER TABLE public.campanhas_marketing ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.campanhas_marketing ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
ALTER TABLE public.campanhas_marketing ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);
ALTER TABLE public.campanhas_marketing ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.campanhas_marketing ADD COLUMN IF NOT EXISTS external_delivery_id text;
ALTER TABLE public.campanhas_marketing ADD COLUMN IF NOT EXISTS spent_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.campanhas_marketing DROP CONSTRAINT IF EXISTS campanhas_marketing_status_check;
ALTER TABLE public.campanhas_marketing ADD CONSTRAINT campanhas_marketing_status_check CHECK (status IN ('draft','approved','scheduled','active','paused','finalizada','failed'));
ALTER TABLE public.campanhas_marketing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated full access to campanhas_marketing" ON public.campanhas_marketing;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.campanhas_marketing;
CREATE POLICY campanhas_org_read ON public.campanhas_marketing FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=campanhas_marketing.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')));
CREATE POLICY campanhas_org_write ON public.campanhas_marketing FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=campanhas_marketing.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) WITH CHECK (organization_id IS NOT NULL AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=campanhas_marketing.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))));

CREATE TABLE public.campaign_events (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campanhas_marketing(id) on delete cascade, organization_id uuid not null references public.organizations(id), event_type text not null check(event_type in ('approved','scheduled','published','lead','conversion','spend','failed','cancelled')), external_id text, amount numeric, payload jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now(), recorded_by uuid not null references auth.users(id)
);
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaign_events_org_read ON public.campaign_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=campaign_events.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')));

CREATE OR REPLACE FUNCTION public.transition_campaign(p_campaign_id uuid,p_status text,p_schedule timestamptz default null,p_external_id text default null)
RETURNS public.campanhas_marketing LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.campanhas_marketing; v_event text;
BEGIN
 SELECT * INTO v FROM public.campanhas_marketing WHERE id=p_campaign_id FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Campanha não encontrada ou sem permissão'; END IF;
 IF p_status NOT IN ('approved','scheduled','active','paused','finalizada','failed') THEN RAISE EXCEPTION 'Transição inválida'; END IF;
 IF p_status='active' AND nullif(btrim(coalesce(p_external_id,'')),'') IS NULL THEN RAISE EXCEPTION 'Identificador externo de entrega obrigatório para publicar'; END IF;
 v_event:=CASE p_status WHEN 'approved' THEN 'approved' WHEN 'scheduled' THEN 'scheduled' WHEN 'active' THEN 'published' WHEN 'finalizada' THEN 'cancelled' ELSE p_status END;
 UPDATE public.campanhas_marketing SET status=p_status, scheduled_for=coalesce(p_schedule,scheduled_for), approved_by=case when p_status='approved' then auth.uid() else approved_by end, approved_at=case when p_status='approved' then now() else approved_at end, external_delivery_id=coalesce(p_external_id,external_delivery_id) WHERE id=v.id RETURNING * INTO v;
 INSERT INTO public.campaign_events(campaign_id,organization_id,event_type,external_id,recorded_by) VALUES(v.id,v.organization_id,v_event,p_external_id,auth.uid());
 RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.transition_campaign(uuid,text,timestamptz,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_campaign(uuid,text,timestamptz,text) TO authenticated;

