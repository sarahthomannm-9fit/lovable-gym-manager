-- Auditoria de aceite de convite: garante persona, papel global e aluno real.
CREATE OR REPLACE FUNCTION public.accept_organization_invite(p_token uuid)
RETURNS public.organization_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_inv public.organization_invites;
  v_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  v_nome text;
  v_updated int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login antes de aceitar o convite'; END IF;
  SELECT * INTO v_inv FROM public.organization_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite não encontrado'; END IF;
  IF v_inv.status <> 'pendente' OR v_inv.expires_at < now() THEN RAISE EXCEPTION 'Convite inválido ou expirado'; END IF;
  IF lower(btrim(v_inv.email)) <> v_email THEN RAISE EXCEPTION 'Este convite pertence a outro e-mail'; END IF;

  INSERT INTO public.organization_members(organization_id, user_id, papel)
  VALUES (v_inv.organization_id, auth.uid(), v_inv.papel::public.app_role)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET papel = EXCLUDED.papel;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (auth.uid(), v_inv.papel::public.app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  INSERT INTO public.profiles(id, nome, email)
  VALUES (auth.uid(), coalesce(auth.jwt() ->> 'name', split_part(v_email, '@', 1)), v_email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  IF v_inv.papel::text IN ('user','morador','residente','aluno') THEN
    UPDATE public.alunos
       SET user_id = auth.uid(), organization_id = coalesce(organization_id, v_inv.organization_id)
     WHERE lower(btrim(email)) = v_email AND (user_id IS NULL OR user_id = auth.uid());
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 AND NOT EXISTS (
      SELECT 1 FROM public.alunos WHERE user_id = auth.uid() AND organization_id = v_inv.organization_id
    ) THEN
      SELECT nullif(btrim(coalesce(p.nome, '')), '') INTO v_nome FROM public.profiles p WHERE p.id = auth.uid();
      INSERT INTO public.alunos (nome, email, user_id, organization_id, status, lifecycle_status, data_matricula, tipo)
      VALUES (coalesce(v_nome, split_part(v_email, '@', 1)), v_email, auth.uid(), v_inv.organization_id, 'ativo', 'ativo'::public.pessoa_status, current_date, 'morador');
    END IF;
  END IF;

  UPDATE public.organization_invites SET status='aceito', accepted_by=auth.uid(), accepted_at=now()
  WHERE id=v_inv.id RETURNING * INTO v_inv;
  RETURN v_inv;
END;
$function$;
REVOKE ALL ON FUNCTION public.accept_organization_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_organization_invite(uuid) TO authenticated;
