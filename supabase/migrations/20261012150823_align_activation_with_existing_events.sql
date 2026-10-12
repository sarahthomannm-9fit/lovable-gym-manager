CREATE OR REPLACE FUNCTION public.organization_activation_metrics(p_organization_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_moradores integer; v_treinos integer; v_eventos integer; v_checkins integer;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=p_organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT count(*) INTO v_moradores FROM public.alunos WHERE organization_id=p_organization_id AND status='ativo';
  SELECT count(*) INTO v_treinos FROM public.treinos WHERE organization_id=p_organization_id AND status='ativo';
  SELECT count(*) INTO v_eventos FROM public.eventos_condominio WHERE organization_id=p_organization_id AND status='publicado' AND ativo=true;
  SELECT count(*) INTO v_checkins FROM public.checkins c JOIN public.alunos a ON a.id=c.aluno_id WHERE a.organization_id=p_organization_id AND c.data_checkin>=(now() AT TIME ZONE 'America/Sao_Paulo')::date-30;
  RETURN jsonb_build_object('moradores_ativos',v_moradores,'treinos_ativos',v_treinos,'eventos_publicados',v_eventos,'checkins_30_dias',v_checkins);
END;
$$;

