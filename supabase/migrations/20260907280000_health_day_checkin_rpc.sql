CREATE OR REPLACE FUNCTION public.checkin_health_day(p_event_id UUID, p_aluno_id UUID)
RETURNS public.health_day_registrations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.health_day_registrations;
BEGIN
  UPDATE public.health_day_registrations
     SET status = 'checkin', checkin_at = now()
   WHERE event_id = p_event_id AND aluno_id = p_aluno_id AND status IN ('inscrito','confirmado')
   RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'inscrição não encontrada ou inválida'; END IF;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.checkin_health_day(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.checkin_health_day(UUID, UUID) TO authenticated;
