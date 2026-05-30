
-- Seed sample organizations (4 tipos) + vincular admin como membership + linkar alunos existentes
DO $$
DECLARE
  v_admin_id uuid;
  v_org_cond uuid;
  v_org_corp uuid;
  v_org_prof uuid;
  v_org_studio uuid;
BEGIN
  SELECT user_id INTO v_admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;

  INSERT INTO public.organizations (nome, tipo, status, contato_nome, contato_email)
  VALUES ('Central Park Residencial', 'condominio', 'ativo', 'Síndico Demo', 'sindico@centralpark.demo')
  RETURNING id INTO v_org_cond;

  INSERT INTO public.organizations (nome, tipo, status, contato_nome, contato_email)
  VALUES ('TechCorp Brasil', 'corporate', 'ativo', 'RH Demo', 'rh@techcorp.demo')
  RETURNING id INTO v_org_corp;

  INSERT INTO public.organizations (nome, tipo, status, contato_nome, contato_email)
  VALUES ('Studio Personal 9FIT', 'professor', 'ativo', 'Prof. Ana', 'ana@9fit.demo')
  RETURNING id INTO v_org_prof;

  INSERT INTO public.organizations (nome, tipo, status, contato_nome, contato_email)
  VALUES ('Studio Premium SP', 'studio', 'ativo', 'Gestor Studio', 'studio@9fit.demo')
  RETURNING id INTO v_org_studio;

  -- Memberships do admin em todas as orgs (papel coerente com tipo)
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, papel) VALUES
      (v_org_cond, v_admin_id, 'sindico'),
      (v_org_corp, v_admin_id, 'corporate'),
      (v_org_prof, v_admin_id, 'professor'),
      (v_org_studio, v_admin_id, 'professor')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Vincular alunos existentes sem organização ao condomínio padrão
  UPDATE public.alunos SET organization_id = v_org_cond WHERE organization_id IS NULL;
END $$;
