ALTER TABLE public.organization_invites
  ADD COLUMN IF NOT EXISTS invited_by UUID,
  ADD COLUMN IF NOT EXISTS accepted_by UUID,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

DROP FUNCTION IF EXISTS public.create_organization_invite(UUID, TEXT, public.app_role);
DROP FUNCTION IF EXISTS public.create_organization_invite(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_organization_invite(
  p_organization_id UUID,
  p_email TEXT,
  p_papel TEXT
) RETURNS public.organization_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.organization_invites;
  v_email TEXT := lower(btrim(coalesce(p_email, '')));
  v_papel TEXT := lower(btrim(coalesce(p_papel, '')));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'É necessário estar autenticado';
  END IF;
  IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'E-mail inválido: %', coalesce(p_email, '');
  END IF;
  IF v_papel NOT IN ('sindico', 'professor', 'user') THEN
    RAISE EXCEPTION 'Persona inválida: %', coalesce(p_papel, '');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_organization_id) THEN
    RAISE EXCEPTION 'Condomínio não encontrado';
  END IF;
  IF NOT (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'manager'))
    OR EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = p_organization_id AND user_id = auth.uid()
        AND papel::text IN ('sindico', 'admin', 'manager')
    )
  ) THEN
    RAISE EXCEPTION 'Sem permissão para convidar';
  END IF;

  SELECT * INTO v_row FROM public.organization_invites
   WHERE organization_id = p_organization_id
     AND email = v_email
     AND papel = v_papel
     AND status = 'pendente'
     AND expires_at > now()
   ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN RETURN v_row; END IF;

  UPDATE public.organization_invites SET status = 'cancelado'
   WHERE organization_id = p_organization_id AND email = v_email AND status = 'pendente';

  INSERT INTO public.organization_invites(organization_id, email, papel, invited_by)
  VALUES (p_organization_id, v_email, v_papel, auth.uid())
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_invite(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_invite(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_organization_invite(p_token UUID)
RETURNS public.organization_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inv public.organization_invites;
  v_email TEXT := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Faça login antes de aceitar o convite';
  END IF;
  SELECT * INTO v_inv FROM public.organization_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite não encontrado';
  END IF;
  IF v_inv.status <> 'pendente' OR v_inv.expires_at < now() THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  IF lower(btrim(v_inv.email)) <> v_email THEN
    RAISE EXCEPTION 'Este convite pertence a outro e-mail';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = v_inv.organization_id AND user_id = auth.uid() AND papel::text = v_inv.papel
  ) THEN
    INSERT INTO public.organization_members(organization_id, user_id, papel)
    VALUES (v_inv.organization_id, auth.uid(), v_inv.papel::public.app_role);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()) THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (auth.uid(), v_inv.papel::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_inv.papel = 'user' THEN
    UPDATE public.alunos
       SET user_id = auth.uid(),
           organization_id = coalesce(organization_id, v_inv.organization_id)
     WHERE user_id IS NULL AND lower(btrim(email)) = v_email;
  END IF;

  UPDATE public.organization_invites
     SET status = 'aceito', accepted_by = auth.uid(), accepted_at = now()
   WHERE id = v_inv.id
   RETURNING * INTO v_inv;
  RETURN v_inv;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_organization_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_organization_invite(UUID) TO authenticated;