ALTER TABLE public.organization_facilities ADD COLUMN IF NOT EXISTS image_analysis jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.organization_facilities ADD COLUMN IF NOT EXISTS analysis_status text NOT NULL DEFAULT 'nao_analisada' CHECK (analysis_status IN ('nao_analisada','pendente_revisao','aprovada','rejeitada'));
CREATE TABLE IF NOT EXISTS public.operational_calendar_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('aula','particular','evento','visita_tecnica','plantao')), title text NOT NULL,
  starts_at timestamptz NOT NULL, end_at timestamptz NOT NULL, owner text NOT NULL DEFAULT 'sarah',
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','confirmado','concluido','cancelado')),
  notes text, created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.operational_calendar_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY operational_calendar_access ON public.operational_calendar_entries FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=operational_calendar_entries.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico','professor'))) WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=operational_calendar_entries.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico','professor')));
CREATE OR REPLACE FUNCTION public.save_facility_analysis(p_facility_id uuid, p_analysis jsonb, p_status text DEFAULT 'pendente_revisao') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF auth.uid() IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m JOIN public.organization_facilities f ON f.organization_id=m.organization_id WHERE f.id=p_facility_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))) THEN RAISE EXCEPTION 'Sem permissão'; END IF; UPDATE public.organization_facilities SET image_analysis=p_analysis, analysis_status=p_status WHERE id=p_facility_id; END $$;
REVOKE ALL ON FUNCTION public.save_facility_analysis(uuid,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_facility_analysis(uuid,jsonb,text) TO authenticated;

