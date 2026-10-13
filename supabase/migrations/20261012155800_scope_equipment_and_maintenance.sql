ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS localizacao text,
  ADD COLUMN IF NOT EXISTS marca text,
  ADD COLUMN IF NOT EXISTS modelo text,
  ADD COLUMN IF NOT EXISTS numero_serie text,
  ADD COLUMN IF NOT EXISTS proxima_manutencao date;
CREATE INDEX IF NOT EXISTS idx_equipment_org_status ON public.equipamentos(organization_id,status);
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.equipamentos;
CREATE POLICY equipment_staff_read ON public.equipamentos FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=equipamentos.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','professor','sindico'))
);
CREATE POLICY equipment_staff_insert ON public.equipamentos FOR INSERT TO authenticated WITH CHECK (
  organization_id IS NOT NULL AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=equipamentos.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')))
);
CREATE POLICY equipment_staff_update ON public.equipamentos FOR UPDATE TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=equipamentos.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
) WITH CHECK (
  organization_id IS NOT NULL AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=equipamentos.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')))
);
CREATE TABLE public.equipment_maintenance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), equipment_id uuid NOT NULL REFERENCES public.equipamentos(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL REFERENCES public.organizations(id), actor_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('opened','completed')),
  detail text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.equipment_maintenance_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY equipment_maintenance_staff_read ON public.equipment_maintenance_events FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=equipment_maintenance_events.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','professor','sindico'))
);
CREATE FUNCTION public.record_equipment_maintenance(p_equipment_id uuid,p_action text,p_detail text)
RETURNS public.equipamentos LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_equipment public.equipamentos%ROWTYPE;
BEGIN
  SELECT * INTO v_equipment FROM public.equipamentos WHERE id=p_equipment_id FOR UPDATE;
  IF NOT FOUND OR v_equipment.organization_id IS NULL OR auth.uid() IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_equipment.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Equipamento não encontrado ou sem permissão'; END IF;
  IF length(btrim(coalesce(p_detail,'')))<5 THEN RAISE EXCEPTION 'Descreva a manutenção'; END IF;
  IF p_action='opened' AND v_equipment.status<>'em_manutencao' THEN
    UPDATE public.equipamentos SET status='em_manutencao',updated_at=now() WHERE id=p_equipment_id RETURNING * INTO v_equipment;
  ELSIF p_action='completed' AND v_equipment.status='em_manutencao' THEN
    UPDATE public.equipamentos SET status='funcionando',updated_at=now() WHERE id=p_equipment_id RETURNING * INTO v_equipment;
  ELSE RAISE EXCEPTION 'Transição de manutenção inválida'; END IF;
  INSERT INTO public.equipment_maintenance_events(equipment_id,organization_id,actor_id,action,detail) VALUES(p_equipment_id,v_equipment.organization_id,auth.uid(),p_action,btrim(p_detail));
  RETURN v_equipment;
END; $$;
REVOKE ALL ON FUNCTION public.record_equipment_maintenance(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_equipment_maintenance(uuid,text,text) TO authenticated;

