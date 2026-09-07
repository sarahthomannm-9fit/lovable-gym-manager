CREATE OR REPLACE FUNCTION public.start_resident_onboarding(
  p_organization_id UUID,
  p_nome TEXT,
  p_email TEXT,
  p_unidade TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF length(trim(coalesce(p_nome, ''))) < 2 OR position('@' IN coalesce(p_email, '')) < 2 THEN
    RAISE EXCEPTION 'nome e email válidos são obrigatórios';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_organization_id AND tipo = 'condominio' AND status = 'ativo') THEN
    RAISE EXCEPTION 'condomínio indisponível';
  END IF;
  SELECT id INTO v_id FROM public.alunos WHERE organization_id = p_organization_id AND lower(email) = lower(trim(p_email)) LIMIT 1;
  IF v_id IS NULL THEN
    INSERT INTO public.alunos (organization_id, nome, email, status)
    VALUES (p_organization_id, trim(p_nome), lower(trim(p_email)), 'pendente')
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_resident_onboarding(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_resident_onboarding(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
