CREATE TABLE IF NOT EXISTS public.organization_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.eventos_condominio(id) ON DELETE SET NULL,
  titulo text NOT NULL, mensagem text NOT NULL,
  publico text NOT NULL DEFAULT 'condominio' CHECK (publico IN ('condominio','evento')),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado','arquivado')),
  publicado_por uuid REFERENCES auth.users(id), publicado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organization_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_staff_read" ON public.organization_announcements FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=organization_announcements.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico')));
CREATE POLICY "announcements_staff_insert" ON public.organization_announcements FOR INSERT TO authenticated
WITH CHECK (status='rascunho' AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=organization_announcements.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))));

CREATE OR REPLACE FUNCTION public.publish_organization_announcement(p_id uuid)
RETURNS public.organization_announcements LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_row public.organization_announcements%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  SELECT * INTO v_row FROM public.organization_announcements WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_row.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))) THEN RAISE EXCEPTION 'Comunicado não encontrado ou sem permissão'; END IF;
  IF v_row.status='publicado' THEN RETURN v_row; END IF;
  IF v_row.status<>'rascunho' THEN RAISE EXCEPTION 'Comunicado não pode ser publicado'; END IF;
  IF v_row.publico='evento' AND NOT EXISTS (SELECT 1 FROM public.eventos_condominio e WHERE e.id=v_row.event_id AND e.organization_id=v_row.organization_id) THEN RAISE EXCEPTION 'Evento não pertence ao condomínio'; END IF;
  INSERT INTO public.notificacoes(tipo,titulo,mensagem,destinatario_tipo,destinatario_id,prioridade,status,canal,dados_extras)
  SELECT 'comunicado',v_row.titulo,v_row.mensagem,'aluno',a.id,'normal','enviada',ARRAY['app'],jsonb_build_object('organization_id',v_row.organization_id,'announcement_id',v_row.id)
  FROM public.alunos a WHERE a.organization_id=v_row.organization_id AND a.status='ativo' AND (
    v_row.publico='condominio' OR EXISTS (SELECT 1 FROM public.health_day_inscricoes r WHERE r.evento_id=v_row.event_id AND r.aluno_id=a.id AND r.status IN ('confirmado','checkin'))
  );
  UPDATE public.organization_announcements SET status='publicado',publicado_por=auth.uid(),publicado_em=now() WHERE id=p_id RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.resident_announcements(p_aluno_id uuid)
RETURNS SETOF public.organization_announcements LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT n.* FROM public.organization_announcements n JOIN public.alunos a ON a.organization_id=n.organization_id AND a.id=p_aluno_id
  WHERE a.user_id=auth.uid() AND n.status='publicado' AND (
    n.publico='condominio' OR EXISTS (SELECT 1 FROM public.health_day_inscricoes r WHERE r.evento_id=n.event_id AND r.aluno_id=a.id AND r.status IN ('confirmado','checkin'))
  ) ORDER BY n.publicado_em DESC;
$$;
REVOKE ALL ON FUNCTION public.publish_organization_announcement(uuid),public.resident_announcements(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.publish_organization_announcement(uuid),public.resident_announcements(uuid) TO authenticated;

