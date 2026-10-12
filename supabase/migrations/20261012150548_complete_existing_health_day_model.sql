-- Keep eventos_condominio and health_day_inscricoes as the canonical records.
ALTER TABLE public.eventos_condominio
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'publicado';
ALTER TABLE public.eventos_condominio
  ADD CONSTRAINT eventos_condominio_status_check CHECK (status IN ('rascunho','publicado','encerrado','cancelado'));
ALTER TABLE public.health_day_inscricoes
  ADD COLUMN IF NOT EXISTS checkin_at timestamptz;
ALTER TABLE public.health_day_inscricoes DROP CONSTRAINT IF EXISTS health_day_inscricoes_status_check;
ALTER TABLE public.health_day_inscricoes
  ADD CONSTRAINT health_day_inscricoes_status_check CHECK (status IN ('confirmado','lista_espera','cancelado','checkin'));

DROP POLICY IF EXISTS "aluno_cria_propria_inscricao" ON public.health_day_inscricoes;
DROP POLICY IF EXISTS "staff_ve_inscricoes_da_org" ON public.health_day_inscricoes;
CREATE POLICY "health_registration_staff_read" ON public.health_day_inscricoes FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR EXISTS (
  SELECT 1 FROM public.eventos_condominio e JOIN public.organization_members m ON m.organization_id=e.organization_id
  WHERE e.id=evento_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico','professor')
));

CREATE OR REPLACE FUNCTION public.register_health_day(p_event_id uuid,p_aluno_id uuid)
RETURNS public.health_day_inscricoes LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_event public.eventos_condominio%ROWTYPE; v_row public.health_day_inscricoes%ROWTYPE; v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.alunos a WHERE a.id=p_aluno_id AND a.user_id=auth.uid()) THEN RAISE EXCEPTION 'Aluno não autorizado'; END IF;
  SELECT * INTO v_event FROM public.eventos_condominio WHERE id=p_event_id FOR UPDATE;
  IF NOT FOUND OR v_event.status<>'publicado' OR v_event.ativo IS DISTINCT FROM true OR v_event.data_evento<(now() AT TIME ZONE 'America/Sao_Paulo')::date THEN RAISE EXCEPTION 'Evento indisponível'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.alunos a WHERE a.id=p_aluno_id AND a.organization_id=v_event.organization_id) THEN RAISE EXCEPTION 'Evento pertence a outro condomínio'; END IF;
  SELECT * INTO v_row FROM public.health_day_inscricoes WHERE evento_id=p_event_id AND aluno_id=p_aluno_id FOR UPDATE;
  IF FOUND AND v_row.status IN ('confirmado','lista_espera','checkin') THEN RETURN v_row; END IF;
  SELECT count(*) INTO v_count FROM public.health_day_inscricoes WHERE evento_id=p_event_id AND status IN ('confirmado','checkin');
  INSERT INTO public.health_day_inscricoes(evento_id,aluno_id,status) VALUES(p_event_id,p_aluno_id,CASE WHEN v_count<coalesce(v_event.vagas_totais,15) THEN 'confirmado' ELSE 'lista_espera' END)
  ON CONFLICT(evento_id,aluno_id) DO UPDATE SET status=excluded.status,checkin_at=NULL RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.checkin_health_day(p_event_id uuid,p_aluno_id uuid)
RETURNS public.health_day_inscricoes LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_event public.eventos_condominio%ROWTYPE; v_row public.health_day_inscricoes%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.alunos a WHERE a.id=p_aluno_id AND a.user_id=auth.uid()) THEN RAISE EXCEPTION 'Aluno não autorizado'; END IF;
  SELECT * INTO v_event FROM public.eventos_condominio WHERE id=p_event_id;
  IF NOT FOUND OR v_event.status<>'publicado' OR v_event.ativo IS DISTINCT FROM true OR v_event.data_evento<>(now() AT TIME ZONE 'America/Sao_Paulo')::date OR (now() AT TIME ZONE 'America/Sao_Paulo')::time<v_event.horario_inicio OR (now() AT TIME ZONE 'America/Sao_Paulo')::time>coalesce(v_event.horario_fim,v_event.horario_inicio+interval '4 hours') THEN RAISE EXCEPTION 'Check-in indisponível neste horário'; END IF;
  UPDATE public.health_day_inscricoes SET status='checkin',checkin_at=coalesce(checkin_at,now()) WHERE evento_id=p_event_id AND aluno_id=p_aluno_id AND status IN ('confirmado','checkin') RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição confirmada necessária'; END IF; RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_health_day_registration(p_registration_id uuid,p_status text)
RETURNS public.health_day_inscricoes LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_row public.health_day_inscricoes%ROWTYPE; v_event public.eventos_condominio%ROWTYPE; v_count integer;
BEGIN
  IF auth.uid() IS NULL OR p_status NOT IN ('confirmado','cancelado') THEN RAISE EXCEPTION 'Ação inválida'; END IF;
  SELECT * INTO v_row FROM public.health_day_inscricoes WHERE id=p_registration_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição não encontrada'; END IF;
  SELECT * INTO v_event FROM public.eventos_condominio WHERE id=v_row.evento_id FOR UPDATE;
  IF NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_event.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_status='confirmado' THEN
    SELECT count(*) INTO v_count FROM public.health_day_inscricoes WHERE evento_id=v_event.id AND status IN ('confirmado','checkin');
    IF v_count>=coalesce(v_event.vagas_totais,15) THEN RAISE EXCEPTION 'Evento sem vagas'; END IF;
  END IF;
  UPDATE public.health_day_inscricoes SET status=p_status,checkin_at=NULL WHERE id=p_registration_id RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.register_health_day(uuid,uuid),public.checkin_health_day(uuid,uuid),public.manage_health_day_registration(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_health_day(uuid,uuid),public.checkin_health_day(uuid,uuid),public.manage_health_day_registration(uuid,text) TO authenticated;

