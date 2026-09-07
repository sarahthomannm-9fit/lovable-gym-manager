CREATE OR REPLACE FUNCTION public.cancel_organization_invite(p_invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organization_invites i WHERE i.id = p_invite_id AND (public.is_admin(auth.uid()) OR i.invited_by = auth.uid())) THEN
    RAISE EXCEPTION 'Convite não encontrado ou sem permissão';
  END IF;
  UPDATE public.organization_invites SET status = 'cancelado' WHERE id = p_invite_id AND status = 'pendente';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_organization_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_organization_invite(UUID) TO authenticated;
