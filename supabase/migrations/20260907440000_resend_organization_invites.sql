CREATE OR REPLACE FUNCTION public.resend_organization_invite(p_invite_id UUID)
RETURNS public.organization_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_old public.organization_invites; v_new public.organization_invites;
BEGIN
  SELECT * INTO v_old FROM public.organization_invites WHERE id = p_invite_id;
  IF NOT FOUND OR NOT (public.is_admin(auth.uid()) OR v_old.invited_by = auth.uid()) THEN RAISE EXCEPTION 'Convite não encontrado ou sem permissão'; END IF;
  IF v_old.status = 'pendente' AND v_old.expires_at > now() THEN RAISE EXCEPTION 'Convite ainda está válido'; END IF;
  INSERT INTO public.organization_invites(organization_id,email,papel,invited_by)
  VALUES (v_old.organization_id,v_old.email,v_old.papel,auth.uid())
  RETURNING * INTO v_new;
  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.resend_organization_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resend_organization_invite(UUID) TO authenticated;
