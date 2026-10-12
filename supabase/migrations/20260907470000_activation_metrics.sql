CREATE OR REPLACE FUNCTION public.organization_activation_metrics(p_organization_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_moradores INTEGER; v_treinos INTEGER; v_eventos INTEGER; v_checkins INTEGER;
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.user_has_org(auth.uid(), p_organization_id)) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT count(*) INTO v_moradores FROM public.alunos WHERE organization_id = p_organization_id AND status = 'ativo';
  SELECT count(*) INTO v_treinos FROM public.treinos WHERE organization_id = p_organization_id AND status = 'ativo';
  SELECT count(*) INTO v_eventos FROM public.health_day_events WHERE organization_id = p_organization_id AND status = 'publicado';
  SELECT count(*) INTO v_checkins FROM public.checkins c JOIN public.alunos a ON a.id = c.aluno_id WHERE a.organization_id = p_organization_id AND c.data_checkin >= current_date - 30;
  RETURN jsonb_build_object('moradores_ativos',v_moradores,'treinos_ativos',v_treinos,'eventos_publicados',v_eventos,'checkins_30_dias',v_checkins);
END;
$$;

REVOKE ALL ON FUNCTION public.organization_activation_metrics(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.organization_activation_metrics(UUID) TO authenticated;
