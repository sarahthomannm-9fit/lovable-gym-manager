-- One canonical condominium event lifecycle: eventos_condominio + health_day_inscricoes.
CREATE OR REPLACE FUNCTION public.set_condominium_event_status(p_event_id uuid, p_status text)
RETURNS public.eventos_condominio
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_event public.eventos_condominio%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR p_status NOT IN ('rascunho','publicado','encerrado','cancelado') THEN
    RAISE EXCEPTION 'Ação inválida';
  END IF;
  SELECT * INTO v_event FROM public.eventos_condominio WHERE id=p_event_id FOR UPDATE;
  IF NOT FOUND OR NOT (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id=v_event.organization_id AND m.user_id=auth.uid()
        AND m.papel::text IN ('admin','manager','sindico')
    )
  ) THEN RAISE EXCEPTION 'Evento não encontrado ou sem permissão'; END IF;
  IF v_event.status IN ('encerrado','cancelado') AND p_status='publicado' THEN
    RAISE EXCEPTION 'Crie um novo evento para publicar novamente';
  END IF;
  UPDATE public.eventos_condominio
    SET status=p_status, ativo=(p_status NOT IN ('cancelado','encerrado')), updated_at=now()
    WHERE id=p_event_id
    RETURNING * INTO v_event;
  IF p_status='cancelado' THEN
    UPDATE public.health_day_inscricoes
      SET status='cancelado', checkin_at=NULL
      WHERE evento_id=p_event_id AND status IN ('confirmado','lista_espera');
  END IF;
  RETURN v_event;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_health_day_registration(p_event_id uuid, p_aluno_id uuid)
RETURNS public.health_day_inscricoes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_event public.eventos_condominio%ROWTYPE; v_row public.health_day_inscricoes%ROWTYPE; v_waiting uuid; v_was_confirmed boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.alunos a WHERE a.id=p_aluno_id AND a.user_id=auth.uid()
  ) THEN RAISE EXCEPTION 'Aluno não autorizado'; END IF;
  SELECT * INTO v_event FROM public.eventos_condominio WHERE id=p_event_id FOR UPDATE;
  IF NOT FOUND OR v_event.status<>'publicado' OR v_event.data_evento < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
    RAISE EXCEPTION 'Inscrição não pode mais ser cancelada';
  END IF;
  SELECT status='confirmado' INTO v_was_confirmed FROM public.health_day_inscricoes
    WHERE evento_id=p_event_id AND aluno_id=p_aluno_id FOR UPDATE;
  UPDATE public.health_day_inscricoes SET status='cancelado', checkin_at=NULL
    WHERE evento_id=p_event_id AND aluno_id=p_aluno_id AND status IN ('confirmado','lista_espera')
    RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Não há inscrição ativa para cancelar'; END IF;
  IF v_was_confirmed THEN
    SELECT id INTO v_waiting FROM public.health_day_inscricoes
      WHERE evento_id=p_event_id AND status='lista_espera'
      ORDER BY created_at, id LIMIT 1 FOR UPDATE;
    IF v_waiting IS NOT NULL THEN
      UPDATE public.health_day_inscricoes SET status='confirmado' WHERE id=v_waiting;
    END IF;
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_organization_announcement(p_id uuid)
RETURNS public.organization_announcements
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_row public.organization_announcements%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  SELECT * INTO v_row FROM public.organization_announcements WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR NOT (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id=v_row.organization_id AND m.user_id=auth.uid()
        AND m.papel::text IN ('admin','manager','sindico')
    )
  ) THEN RAISE EXCEPTION 'Comunicado não encontrado ou sem permissão'; END IF;
  UPDATE public.organization_announcements SET status='arquivado' WHERE id=p_id RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.set_condominium_event_status(uuid,text), public.cancel_health_day_registration(uuid,uuid), public.archive_organization_announcement(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_condominium_event_status(uuid,text), public.cancel_health_day_registration(uuid,uuid), public.archive_organization_announcement(uuid) TO authenticated;

