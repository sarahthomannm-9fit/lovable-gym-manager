CREATE TABLE IF NOT EXISTS public.organization_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ambiente TEXT NOT NULL,
  nome TEXT NOT NULL,
  categoria TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade >= 0),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'inativo')),
  foto_path TEXT,
  observacoes TEXT,
  confirmado_por UUID REFERENCES auth.users(id),
  confirmado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_facilities_org
  ON public.organization_facilities(organization_id);

ALTER TABLE public.organization_facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facility_members_read" ON public.organization_facilities;
CREATE POLICY "facility_members_read"
  ON public.organization_facilities FOR SELECT TO authenticated
  USING (public.user_has_org(auth.uid(), organization_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "facility_staff_write" ON public.organization_facilities;
CREATE POLICY "facility_staff_write"
  ON public.organization_facilities FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = organization_id AND m.user_id = auth.uid() AND m.papel IN ('sindico','professor','admin','manager')))
  WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = organization_id AND m.user_id = auth.uid() AND m.papel IN ('sindico','professor','admin','manager')));

CREATE OR REPLACE FUNCTION public.approve_facility(p_facility_id UUID, p_status TEXT DEFAULT 'aprovado')
RETURNS public.organization_facilities
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.organization_facilities;
BEGIN
  IF p_status NOT IN ('aprovado', 'inativo', 'pendente') THEN
    RAISE EXCEPTION 'status inválido';
  END IF;
  UPDATE public.organization_facilities f
     SET status = p_status,
         confirmado_por = CASE WHEN p_status = 'aprovado' THEN auth.uid() ELSE NULL END,
         confirmado_em = CASE WHEN p_status = 'aprovado' THEN now() ELSE NULL END,
         updated_at = now()
   WHERE f.id = p_facility_id
     AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = f.organization_id AND m.user_id = auth.uid() AND m.papel IN ('sindico','professor','admin','manager')))
   RETURNING f.* INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'equipamento não encontrado ou sem permissão'; END IF;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_facility(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_facility(UUID, TEXT) TO authenticated;

