-- Mantém o vínculo de convites de morador mesmo quando a persona chega
-- com nomenclatura legada (morador/residente/aluno).
CREATE OR REPLACE FUNCTION public.accept_organization_invite(p_token UUID)
RETURNS public.organization_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inv public.organization_invites;
  v_email TEXT := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login antes de aceitar o convite'; END IF;
  SELECT * INTO v_inv FROM public.organization_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND OR v_inv.status <> 'pendente' OR v_inv.expires_at < now() THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  IF lower(v_inv.email) <> v_email THEN
    RAISE EXCEPTION 'Este convite pertence a outro e-mail';
  END IF;
  INSERT INTO public.organization_members(organization_id, user_id, papel)
  VALUES (v_inv.organization_id, auth.uid(), v_inv.papel)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET papel = EXCLUDED.papel;
  INSERT INTO public.profiles(id, nome, email)
  VALUES (auth.uid(), coalesce(auth.jwt() ->> 'name', split_part(v_email, '@', 1)), v_email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  IF v_inv.papel::text IN ('user', 'morador', 'residente', 'aluno') THEN
    UPDATE public.alunos
       SET user_id = auth.uid()
     WHERE organization_id = v_inv.organization_id
       AND lower(email) = v_email
       AND (user_id IS NULL OR user_id = auth.uid());
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
