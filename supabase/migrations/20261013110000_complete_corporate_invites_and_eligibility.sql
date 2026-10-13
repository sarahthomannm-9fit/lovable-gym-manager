-- Corporate organizations have one RH/gestor role and employee eligibility
-- through the same auditable invite lifecycle used by the other markets.
CREATE OR REPLACE FUNCTION public.create_organization_invite(
  p_organization_id uuid,
  p_email text,
  p_papel text
) RETURNS public.organization_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_org public.organizations;
  v_row public.organization_invites;
  v_email text := lower(btrim(coalesce(p_email,'')));
  v_papel text := lower(btrim(coalesce(p_papel,'')));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'É necessário estar autenticado'; END IF;
  IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'E-mail inválido'; END IF;
  SELECT * INTO v_org FROM public.organizations WHERE id=p_organization_id;
  IF NOT FOUND OR v_org.status <> 'ativo' THEN RAISE EXCEPTION 'Organização não encontrada ou inativa'; END IF;
  IF (v_org.tipo='corporate' AND v_papel NOT IN ('corporate','user'))
     OR (v_org.tipo='condominio' AND v_papel NOT IN ('sindico','professor','user'))
     OR (v_org.tipo IN ('studio','professor') AND v_papel NOT IN ('professor','user')) THEN
    RAISE EXCEPTION 'Papel inválido para esta organização';
  END IF;
  IF NOT (public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id=p_organization_id AND m.user_id=auth.uid()
      AND m.papel::text IN ('admin','manager','sindico','corporate')
  )) THEN RAISE EXCEPTION 'Sem permissão para convidar'; END IF;
  SELECT * INTO v_row FROM public.organization_invites
    WHERE organization_id=p_organization_id AND email=v_email AND papel::text=v_papel AND status='pendente' AND expires_at>now()
    ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN RETURN v_row; END IF;
  INSERT INTO public.organization_invites(organization_id,email,papel,invited_by)
  VALUES(p_organization_id,v_email,v_papel::public.app_role,auth.uid()) RETURNING * INTO v_row;
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.set_corporate_employee_eligibility(p_aluno_id uuid,p_active boolean,p_reason text)
RETURNS public.alunos LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_aluno public.alunos;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
  SELECT * INTO v_aluno FROM public.alunos WHERE id=p_aluno_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Colaborador não encontrado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id=v_aluno.organization_id AND o.tipo='corporate' AND o.status='ativo') THEN RAISE EXCEPTION 'Colaborador fora de empresa corporativa'; END IF;
  IF NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_aluno.organization_id AND m.user_id=auth.uid() AND m.papel::text='corporate')) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF NOT p_active AND length(btrim(coalesce(p_reason,'')))<5 THEN RAISE EXCEPTION 'Informe o motivo do desligamento'; END IF;
  UPDATE public.alunos SET status=CASE WHEN p_active THEN 'ativo' ELSE 'inativo' END WHERE id=v_aluno.id RETURNING * INTO v_aluno;
  IF NOT p_active AND v_aluno.user_id IS NOT NULL THEN
    DELETE FROM public.organization_members WHERE organization_id=v_aluno.organization_id AND user_id=v_aluno.user_id AND papel::text='user';
  END IF;
  RETURN v_aluno;
END $$;
REVOKE ALL ON FUNCTION public.create_organization_invite(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_corporate_employee_eligibility(uuid,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_invite(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_corporate_employee_eligibility(uuid,boolean,text) TO authenticated;

