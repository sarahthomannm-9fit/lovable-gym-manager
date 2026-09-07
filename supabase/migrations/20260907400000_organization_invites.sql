CREATE TABLE IF NOT EXISTS public.organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  papel public.app_role NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aceito','cancelado','expirado')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  invited_by UUID REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organization_invites_read" ON public.organization_invites;
CREATE POLICY "organization_invites_read" ON public.organization_invites FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR invited_by = auth.uid() OR public.user_has_org(auth.uid(), organization_id));

CREATE OR REPLACE FUNCTION public.create_organization_invite(p_organization_id UUID, p_email TEXT, p_papel public.app_role)
RETURNS public.organization_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.organization_invites;
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = p_organization_id AND m.user_id = auth.uid() AND m.papel IN ('sindico','admin','manager'))) THEN
    RAISE EXCEPTION 'Sem permissão para convidar';
  END IF;
  INSERT INTO public.organization_invites(organization_id,email,papel,invited_by)
  VALUES (p_organization_id, lower(trim(p_email)), p_papel, auth.uid())
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_invite(UUID,TEXT,public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_invite(UUID,TEXT,public.app_role) TO authenticated;
