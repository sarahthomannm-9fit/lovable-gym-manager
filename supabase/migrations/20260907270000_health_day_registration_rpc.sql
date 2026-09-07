CREATE OR REPLACE FUNCTION public.register_health_day(p_event_id UUID, p_aluno_id UUID)
RETURNS public.health_day_registrations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_event public.health_day_events; v_row public.health_day_registrations; v_count INTEGER;
BEGIN
  SELECT * INTO v_event FROM public.health_day_events WHERE id = p_event_id FOR UPDATE;
  IF v_event.id IS NULL OR v_event.status <> 'publicado' THEN RAISE EXCEPTION 'evento indisponível'; END IF;
  IF EXISTS (SELECT 1 FROM public.health_day_registrations WHERE event_id = p_event_id AND aluno_id = p_aluno_id) THEN
    SELECT * INTO v_row FROM public.health_day_registrations WHERE event_id = p_event_id AND aluno_id = p_aluno_id; RETURN v_row;
  END IF;
  SELECT count(*) INTO v_count FROM public.health_day_registrations WHERE event_id = p_event_id AND status IN ('inscrito','confirmado','checkin');
  INSERT INTO public.health_day_registrations (event_id, aluno_id, status) VALUES (p_event_id, p_aluno_id, CASE WHEN v_count < v_event.capacidade THEN 'inscrito' ELSE 'lista_espera' END) RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.register_health_day(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_health_day(UUID, UUID) TO authenticated;
