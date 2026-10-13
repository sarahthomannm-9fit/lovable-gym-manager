-- A coach is invited against an existing staff record, then linked to Auth.
CREATE TABLE public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  funcionario_id uuid NOT NULL REFERENCES public.funcionarios(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aceito','cancelado')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  accepted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
CREATE INDEX staff_invites_employee_idx ON public.staff_invites(funcionario_id, status);
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_invites_manager_read ON public.staff_invites FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=staff_invites.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
);

CREATE OR REPLACE FUNCTION public.protect_staff_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_user <> 'postgres' AND (NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.ativo IS DISTINCT FROM OLD.ativo) THEN
    RAISE EXCEPTION 'Organização, identidade e vínculo ativo exigem o fluxo autorizado';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.create_staff_invite(p_funcionario_id uuid)
RETURNS public.staff_invites LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_staff public.funcionarios; v_inv public.staff_invites;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
  SELECT * INTO v_staff FROM public.funcionarios WHERE id=p_funcionario_id FOR UPDATE;
  IF NOT FOUND OR NOT v_staff.ativo OR v_staff.cargo NOT IN ('professor','personal') OR nullif(btrim(v_staff.email),'') IS NULL THEN
    RAISE EXCEPTION 'Coach ativo com e-mail é obrigatório';
  END IF;
  IF NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_staff.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v_staff.user_id IS NOT NULL THEN RAISE EXCEPTION 'Coach já vinculado a uma conta'; END IF;
  SELECT * INTO v_inv FROM public.staff_invites WHERE funcionario_id=v_staff.id AND status='pendente' AND expires_at>now() ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN RETURN v_inv; END IF;
  INSERT INTO public.staff_invites(funcionario_id,organization_id,email,created_by)
  VALUES(v_staff.id,v_staff.organization_id,lower(btrim(v_staff.email)),auth.uid()) RETURNING * INTO v_inv;
  RETURN v_inv;
END $$;

CREATE OR REPLACE FUNCTION public.accept_staff_invite(p_token uuid)
RETURNS public.staff_invites LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_inv public.staff_invites; v_staff public.funcionarios; v_email text := lower(btrim(coalesce(auth.jwt()->>'email','')));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login antes de aceitar'; END IF;
  SELECT * INTO v_inv FROM public.staff_invites WHERE token=p_token FOR UPDATE;
  IF NOT FOUND OR v_inv.status<>'pendente' OR v_inv.expires_at<=now() THEN RAISE EXCEPTION 'Convite inválido ou expirado'; END IF;
  IF v_email<>v_inv.email THEN RAISE EXCEPTION 'Convite destinado a outro e-mail'; END IF;
  SELECT * INTO v_staff FROM public.funcionarios WHERE id=v_inv.funcionario_id FOR UPDATE;
  IF NOT FOUND OR NOT v_staff.ativo OR v_staff.organization_id<>v_inv.organization_id OR lower(btrim(v_staff.email))<>v_email THEN RAISE EXCEPTION 'Cadastro do coach alterado'; END IF;
  IF v_staff.user_id IS NOT NULL AND v_staff.user_id<>auth.uid() THEN RAISE EXCEPTION 'Coach já vinculado'; END IF;
  UPDATE public.funcionarios SET user_id=auth.uid() WHERE id=v_staff.id;
  INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(v_inv.organization_id,auth.uid(),'professor'::public.app_role)
  ON CONFLICT (organization_id,user_id) DO UPDATE SET papel=CASE WHEN organization_members.papel::text IN ('admin','manager') THEN organization_members.papel ELSE 'professor'::public.app_role END;
  INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),'professor'::public.app_role)
  ON CONFLICT (user_id) DO UPDATE SET role=CASE WHEN user_roles.role::text='user' THEN 'professor'::public.app_role ELSE user_roles.role END;
  UPDATE public.staff_invites SET status='aceito',accepted_by=auth.uid(),accepted_at=now() WHERE id=v_inv.id RETURNING * INTO v_inv;
  RETURN v_inv;
END $$;

CREATE OR REPLACE FUNCTION public.set_staff_active(p_funcionario_id uuid,p_active boolean,p_reason text)
RETURNS public.funcionarios LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_staff public.funcionarios;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
  SELECT * INTO v_staff FROM public.funcionarios WHERE id=p_funcionario_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Funcionário não encontrado'; END IF;
  IF NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_staff.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF NOT p_active AND length(btrim(coalesce(p_reason,'')))<5 THEN RAISE EXCEPTION 'Informe o motivo do desligamento'; END IF;
  UPDATE public.funcionarios SET ativo=p_active WHERE id=v_staff.id RETURNING * INTO v_staff;
  IF NOT p_active AND v_staff.user_id IS NOT NULL THEN
    DELETE FROM public.organization_members WHERE organization_id=v_staff.organization_id AND user_id=v_staff.user_id AND papel::text='professor';
    UPDATE public.user_roles SET role='user'::public.app_role WHERE user_id=v_staff.user_id AND role::text='professor'
      AND NOT EXISTS (SELECT 1 FROM public.organization_members m WHERE m.user_id=v_staff.user_id AND m.papel::text='professor');
  ELSIF p_active AND v_staff.user_id IS NOT NULL THEN
    INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(v_staff.organization_id,v_staff.user_id,'professor'::public.app_role)
      ON CONFLICT (organization_id,user_id) DO UPDATE SET papel=CASE WHEN organization_members.papel::text IN ('admin','manager') THEN organization_members.papel ELSE 'professor'::public.app_role END;
    INSERT INTO public.user_roles(user_id,role) VALUES(v_staff.user_id,'professor'::public.app_role)
      ON CONFLICT (user_id) DO UPDATE SET role=CASE WHEN user_roles.role::text='user' THEN 'professor'::public.app_role ELSE user_roles.role END;
  END IF;
  RETURN v_staff;
END $$;

REVOKE ALL ON FUNCTION public.create_staff_invite(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_staff_invite(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_staff_active(uuid,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_staff_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_staff_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_staff_active(uuid,boolean,text) TO authenticated;

