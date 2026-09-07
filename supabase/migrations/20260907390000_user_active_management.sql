CREATE OR REPLACE FUNCTION public.set_user_active(p_user_id UUID, p_active BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Apenas admin pode alterar status de usuário'; END IF;
  UPDATE public.profiles SET ativo = p_active WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;
  RETURN p_active;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_active(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_active(UUID, BOOLEAN) TO authenticated;
