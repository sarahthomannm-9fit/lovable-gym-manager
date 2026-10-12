-- Convites de condomínio: fluxo direto, sem exigir usuário previamente cadastrado.
-- A função recebe TEXT para evitar falhas do PostgREST ao converter o enum app_role.
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
  v_email TEXT := lower(trim(coalesce(p_email, '')));
  v_papel TEXT := lower(trim(coalesce(p_papel, '')));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'É necessário estar autenticado';
  END IF;
  IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;
  IF v_papel NOT IN ('sindico', 'professor', 'user') THEN
    RAISE EXCEPTION 'Persona inválida';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_organization_id AND tipo = 'condominio') THEN
    RAISE EXCEPTION 'Condomínio não encontrado';
  END IF;
  IF NOT (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin')
    OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = p_organization_id AND user_id = auth.uid() AND papel::text IN ('sindico','admin','manager'))
  ) THEN
    RAISE EXCEPTION 'Sem permissão para convidar';
  END IF;

  SELECT * INTO v_row FROM public.organization_invites
    WHERE organization_id = p_organization_id AND email = v_email AND status = 'pendente' AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN RETURN v_row; END IF;

  INSERT INTO public.organization_invites(organization_id, email, papel, invited_by)
  VALUES (p_organization_id, v_email, v_papel::public.app_role, auth.uid())
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
DECLARE v_inv public.organization_invites; v_email TEXT := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login antes de aceitar o convite'; END IF;
  SELECT * INTO v_inv FROM public.organization_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND OR v_inv.status <> 'pendente' OR v_inv.expires_at < now() THEN RAISE EXCEPTION 'Convite inválido ou expirado'; END IF;
  IF lower(v_inv.email) <> v_email THEN RAISE EXCEPTION 'Este convite pertence a outro e-mail'; END IF;
  INSERT INTO public.organization_members(organization_id, user_id, papel)
  VALUES (v_inv.organization_id, auth.uid(), v_inv.papel)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET papel = EXCLUDED.papel;
  UPDATE public.organization_invites SET status='aceito', accepted_by=auth.uid(), accepted_at=now() WHERE id=v_inv.id RETURNING * INTO v_inv;
  RETURN v_inv;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_organization_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_organization_invite(UUID) TO authenticated;

