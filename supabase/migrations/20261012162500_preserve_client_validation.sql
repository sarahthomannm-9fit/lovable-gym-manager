CREATE OR REPLACE FUNCTION public.transition_client_status(p_organization_id uuid,p_status text,p_reason text)
RETURNS public.organizations LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_row public.organizations%ROWTYPE; v_previous text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Somente administrador pode alterar situação do cliente'; END IF;
  IF p_status NOT IN ('ativo','suspenso') OR length(btrim(coalesce(p_reason,'')))<5 THEN RAISE EXCEPTION 'Estado ou justificativa inválidos'; END IF;
  SELECT * INTO v_row FROM public.organizations WHERE id=p_organization_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Organização não encontrada'; END IF;
  IF v_row.status NOT IN ('ativo','suspenso') THEN RAISE EXCEPTION 'Organização ainda não validada'; END IF;
  IF v_row.status=p_status THEN RETURN v_row; END IF;
  v_previous:=v_row.status;
  UPDATE public.organizations SET status=p_status,updated_at=now() WHERE id=p_organization_id RETURNING * INTO v_row;
  INSERT INTO public.organization_lifecycle_events(organization_id,actor_id,previous_status,new_status,reason) VALUES(p_organization_id,auth.uid(),v_previous,p_status,btrim(p_reason));
  RETURN v_row;
END; $$;
REVOKE ALL ON FUNCTION public.transition_client_status(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transition_client_status(uuid,text,text) TO authenticated;

