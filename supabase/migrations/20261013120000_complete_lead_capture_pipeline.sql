ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS consent_marketing boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS consented_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_detail text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_follow_up_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campanhas_marketing(id);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated full access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.leads;
CREATE POLICY leads_org_access ON public.leads FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=leads.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) WITH CHECK (organization_id IS NOT NULL AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=leads.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))));
CREATE UNIQUE INDEX IF NOT EXISTS leads_org_email_unique ON public.leads(organization_id,lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS leads_org_phone_unique ON public.leads(organization_id,telefone) WHERE telefone IS NOT NULL;
CREATE TABLE public.lead_follow_ups (id uuid primary key default gen_random_uuid(),lead_id uuid not null references public.leads(id) on delete cascade,organization_id uuid not null references public.organizations(id),note text not null,occurred_at timestamptz not null default now(),next_at timestamptz,created_by uuid not null references auth.users(id));
ALTER TABLE public.lead_follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_follow_ups_org_access ON public.lead_follow_ups FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=lead_follow_ups.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=lead_follow_ups.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')));
CREATE OR REPLACE FUNCTION public.capture_lead(p_organization_id uuid,p_nome text,p_email text,p_telefone text,p_fonte text,p_consent boolean,p_source_detail text default null,p_campaign_id uuid default null)
RETURNS public.leads LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.leads; v_email text:=nullif(lower(btrim(coalesce(p_email,''))),''); v_phone text:=nullif(btrim(coalesce(p_telefone,'')),'');
BEGIN
 IF auth.uid() IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.organization_members m WHERE m.organization_id=p_organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF nullif(btrim(coalesce(p_nome,'')),'') IS NULL OR (v_email IS NULL AND v_phone IS NULL) THEN RAISE EXCEPTION 'Nome e ao menos um contato são obrigatórios'; END IF;
 SELECT * INTO v FROM public.leads WHERE organization_id=p_organization_id AND ((v_email IS NOT NULL AND lower(email)=v_email) OR (v_phone IS NOT NULL AND telefone=v_phone)) ORDER BY created_at LIMIT 1 FOR UPDATE;
 IF FOUND THEN UPDATE public.leads SET nome=p_nome,fonte=coalesce(p_fonte,fonte),source_detail=coalesce(p_source_detail,source_detail),consent_marketing=consent_marketing OR p_consent,consented_at=case when p_consent then now() else consented_at end,campaign_id=coalesce(p_campaign_id,campaign_id) WHERE id=v.id RETURNING * INTO v; RETURN v; END IF;
 INSERT INTO public.leads(organization_id,nome,email,telefone,fonte,source_detail,status,consent_marketing,consented_at,campaign_id,assigned_to) VALUES(p_organization_id,btrim(p_nome),v_email,v_phone,p_fonte,p_source_detail,'novo',p_consent,case when p_consent then now() end,p_campaign_id,auth.uid()) RETURNING * INTO v; RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.capture_lead(uuid,text,text,text,text,boolean,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_lead(uuid,text,text,text,text,boolean,text,uuid) TO authenticated;

