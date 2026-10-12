CREATE OR REPLACE FUNCTION public.accept_organization_invite(p_token UUID)
RETURNS public.organization_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_inv public.organization_invites;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login antes de aceitar o convite'; END IF;
  SELECT * INTO v_inv FROM public.organization_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND OR v_inv.status <> 'pendente' OR v_inv.expires_at < now() THEN RAISE EXCEPTION 'Convite inválido ou expirado'; END IF;
  INSERT INTO public.organization_members(organization_id,user_id,papel)
  VALUES (v_inv.organization_id, auth.uid(), v_inv.papel)
  ON CONFLICT (organization_id,user_id) DO UPDATE SET papel = EXCLUDED.papel;
  UPDATE public.organization_invites SET status='aceito', accepted_by=auth.uid(), accepted_at=now() WHERE id=v_inv.id RETURNING * INTO v_inv;
  RETURN v_inv;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_organization_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_organization_invite(UUID) TO authenticated;
