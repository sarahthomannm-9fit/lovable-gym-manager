BEGIN;
CREATE OR REPLACE FUNCTION app_private.feature_enabled(p_org uuid,p_feature text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce((SELECT o.status='ativo' AND o.metadata->'features'->>p_feature='true' FROM public.organizations o WHERE o.id=p_org),false);
$$;
REVOKE ALL ON FUNCTION app_private.feature_enabled(uuid,text) FROM PUBLIC,anon,authenticated;

ALTER TABLE public.area_reservations ADD COLUMN IF NOT EXISTS request_id uuid;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS request_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS area_reservations_request_idx ON public.area_reservations(request_id) WHERE request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS service_requests_request_idx ON public.service_requests(request_id) WHERE request_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.reserve_common_area(p_request uuid,p_organization_id uuid,p_area_type text,p_title text,p_starts_at timestamptz,p_ends_at timestamptz)
RETURNS public.area_reservations LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.area_reservations;
BEGIN
 IF NOT app_private.session_valid() OR p_request IS NULL THEN RAISE EXCEPTION 'Sessão ou identificador inválido' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 SELECT * INTO r FROM public.area_reservations WHERE request_id=p_request;
 IF FOUND THEN
  IF NOT app_private.own_student(r.aluno_id) OR r.organization_id IS DISTINCT FROM p_organization_id OR r.area_type IS DISTINCT FROM p_area_type OR r.title IS DISTINCT FROM btrim(p_title) OR r.starts_at IS DISTINCT FROM p_starts_at OR r.ends_at IS DISTINCT FROM p_ends_at THEN RAISE EXCEPTION 'Identificador já usado em outra solicitação'; END IF;
  RETURN r;
 END IF;
 r:=public.create_area_reservation(p_organization_id,p_area_type,p_title,p_starts_at,p_ends_at);
 UPDATE public.area_reservations SET request_id=p_request WHERE id=r.id RETURNING * INTO r;
 RETURN r;
END; $$;
CREATE OR REPLACE FUNCTION public.submit_service_request(p_request uuid,p_organization_id uuid,p_service_type text,p_preferred_at timestamptz,p_notes text)
RETURNS public.service_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.service_requests;student uuid;
BEGIN
 IF NOT app_private.session_valid() OR p_request IS NULL THEN RAISE EXCEPTION 'Sessão ou identificador inválido' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 SELECT * INTO r FROM public.service_requests WHERE request_id=p_request;
 IF FOUND THEN
  IF NOT app_private.own_student(r.aluno_id) OR r.organization_id IS DISTINCT FROM p_organization_id OR r.service_type IS DISTINCT FROM p_service_type OR r.preferred_at IS DISTINCT FROM p_preferred_at OR coalesce(r.notes,'')<>coalesce(btrim(p_notes),'') THEN RAISE EXCEPTION 'Identificador já usado em outra solicitação'; END IF;
  RETURN r;
 END IF;
 SELECT a.id INTO student FROM public.alunos a WHERE a.user_id=auth.uid() AND a.organization_id=p_organization_id AND app_private.resident_active(a.status,a.lifecycle_status::text) AND app_private.org_member(a.organization_id) FOR UPDATE;
 IF student IS NULL OR p_service_type NOT IN('personal','nutricao','avaliacao','aula_particular','evento') OR (p_preferred_at IS NOT NULL AND p_preferred_at<=now()) THEN RAISE EXCEPTION 'Confira condomínio, serviço e data futura'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(student::text||p_service_type||coalesce(p_preferred_at::text,'unscheduled'),0));
 SELECT * INTO r FROM public.service_requests WHERE aluno_id=student AND organization_id=p_organization_id AND service_type=p_service_type AND preferred_at IS NOT DISTINCT FROM p_preferred_at AND coalesce(notes,'')=coalesce(btrim(p_notes),'') AND status IN('solicitada','cotada','confirmada') AND (p_preferred_at IS NOT NULL OR created_at>now()-interval '5 minutes') ORDER BY created_at DESC LIMIT 1;
 IF FOUND THEN RETURN r; END IF;
 INSERT INTO public.service_requests(organization_id,aluno_id,service_type,preferred_at,notes,request_id)
 VALUES(p_organization_id,student,p_service_type,p_preferred_at,left(btrim(p_notes),4000),p_request) RETURNING * INTO r;
 RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_coach_class(p_aula uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.aulas;
BEGIN
 SELECT * INTO c FROM public.aulas WHERE id=p_aula FOR UPDATE;
 IF c.id IS NULL OR NOT(app_private.org_role(c.organization_id,ARRAY['admin','manager']) OR (app_private.org_role(c.organization_id,ARRAY['professor']) AND EXISTS(SELECT 1 FROM public.funcionarios f WHERE f.id=c.professor_id AND f.user_id=auth.uid() AND f.organization_id=c.organization_id AND f.ativo=true))) THEN RAISE EXCEPTION 'Sem permissão para esta aula' USING ERRCODE='42501'; END IF;
 IF c.status='cancelada' THEN RETURN; END IF;
 IF c.data_aula+c.horario_inicio<=(now() AT TIME ZONE 'America/Sao_Paulo') THEN RAISE EXCEPTION 'A aula já começou; encaminhe a alteração à administração'; END IF;
 UPDATE public.aulas SET status='cancelada' WHERE id=c.id;
 INSERT INTO public.notificacoes(tipo,titulo,mensagem,destinatario_tipo,destinatario_id,status)
 SELECT 'aula','Aula cancelada','A aula '||c.nome||' de '||c.data_aula::text||' foi cancelada.','aluno',r.aluno_id,'pendente'
 FROM public.aulas_inscritos r JOIN public.alunos a ON a.id=r.aluno_id AND a.organization_id=c.organization_id
 WHERE r.aula_id=c.id AND r.status IN('inscrito','lista_espera');
 UPDATE public.aulas_inscritos r SET status='cancelado' WHERE r.aula_id=c.id AND r.status IN('inscrito','lista_espera') AND EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=r.aluno_id AND a.organization_id=c.organization_id);
 INSERT INTO public.user_access_audit(user_id,organization_id,event,metadata) VALUES(auth.uid(),c.organization_id,'admin_action',jsonb_build_object('action','cancel_class','class',c.id));
END; $$;

CREATE TABLE IF NOT EXISTS public.professional_credit_ledger(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_request_id uuid REFERENCES public.professional_booking_requests(id) ON DELETE SET NULL,
 aluno_id uuid NOT NULL REFERENCES public.alunos(id),organization_id uuid NOT NULL REFERENCES public.organizations(id),
 delta integer NOT NULL CHECK(delta IN(-1,1)),reason text NOT NULL CHECK(reason IN('reservation','refund')),
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(booking_request_id,reason));
ALTER TABLE public.professional_credit_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.professional_credit_ledger FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.professional_credit_ledger TO authenticated;
CREATE POLICY credit_ledger_read ON public.professional_credit_ledger FOR SELECT TO authenticated
 USING(app_private.own_student(aluno_id) OR app_private.org_role(organization_id,ARRAY['admin','manager']));
CREATE INDEX IF NOT EXISTS credit_ledger_org_date_idx ON public.professional_credit_ledger(organization_id,created_at DESC);
CREATE OR REPLACE FUNCTION app_private.append_professional_credit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE org uuid;
BEGIN
 SELECT organization_id INTO org FROM public.alunos WHERE id=NEW.aluno_id;
 IF TG_OP='INSERT' AND NEW.credit_reserved THEN
  INSERT INTO public.professional_credit_ledger(booking_request_id,aluno_id,organization_id,delta,reason) VALUES(NEW.id,NEW.aluno_id,org,-1,'reservation') ON CONFLICT DO NOTHING;
 ELSIF TG_OP='UPDATE' AND OLD.credit_reserved AND NOT NEW.credit_reserved THEN
  INSERT INTO public.professional_credit_ledger(booking_request_id,aluno_id,organization_id,delta,reason) VALUES(NEW.id,NEW.aluno_id,org,1,'refund') ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS append_professional_credit ON public.professional_booking_requests;
CREATE TRIGGER append_professional_credit AFTER INSERT OR UPDATE ON public.professional_booking_requests FOR EACH ROW EXECUTE FUNCTION app_private.append_professional_credit();
REVOKE ALL ON FUNCTION app_private.append_professional_credit() FROM PUBLIC,anon,authenticated;

-- Keep confirmed bookings from regressing when a delayed pending webhook arrives.
DO $integration$
DECLARE definition text;patched text;
BEGIN
 SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE oid='public.apply_professional_status(uuid,text,text)'::regprocedure;
 patched:=replace(definition,'IF p_status NOT IN(''pendente'',''confirmado'',''rejeitado'',''cancelado'',''concluido'')',
 'IF r.integration_status::text=''confirmado'' AND p_status=''pendente'' THEN RETURN; END IF;
 IF p_status NOT IN(''pendente'',''confirmado'',''rejeitado'',''cancelado'',''concluido'')');
 IF patched=definition THEN RAISE EXCEPTION 'Booking state function changed; review migration'; END IF;
 EXECUTE patched;
 SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE oid='public.reserve_professional_credit(uuid,uuid,uuid,jsonb)'::regprocedure;
 patched:=replace(definition,'UPDATE public.alunos SET aulas_disponiveis=aulas_disponiveis-1 WHERE id=a.id;',
 'IF NOT app_private.feature_enabled(a.organization_id,''staff'') THEN RAISE EXCEPTION ''Staff não ativado neste condomínio; nenhum crédito foi debitado''; END IF;
 UPDATE public.alunos SET aulas_disponiveis=aulas_disponiveis-1 WHERE id=a.id;');
 IF patched=definition THEN RAISE EXCEPTION 'Credit reservation function changed; review migration'; END IF;
 EXECUTE patched;
END $integration$;

REVOKE ALL ON FUNCTION public.reserve_common_area(uuid,uuid,text,text,timestamptz,timestamptz),public.submit_service_request(uuid,uuid,text,timestamptz,text),public.cancel_coach_class(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reserve_common_area(uuid,uuid,text,text,timestamptz,timestamptz),public.submit_service_request(uuid,uuid,text,timestamptz,text),public.cancel_coach_class(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.create_area_reservation(uuid,text,text,timestamptz,timestamptz),public.create_service_request(uuid,text,timestamptz,text) FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS public.organization_announcement_reads(
 announcement_id uuid NOT NULL REFERENCES public.organization_announcements(id) ON DELETE CASCADE,
 aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
 organization_id uuid NOT NULL REFERENCES public.organizations(id),
 read_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(announcement_id,aluno_id));
ALTER TABLE public.organization_announcement_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.organization_announcement_reads FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.organization_announcement_reads TO authenticated;
CREATE POLICY announcement_receipt_read ON public.organization_announcement_reads FOR SELECT TO authenticated
 USING(app_private.own_student(aluno_id) OR app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));
CREATE INDEX IF NOT EXISTS announcement_receipts_org_idx ON public.organization_announcement_reads(organization_id,announcement_id);
CREATE OR REPLACE FUNCTION public.mark_announcement_read(p_id uuid,p_aluno uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE org uuid;
BEGIN
 IF NOT app_private.own_student(p_aluno) THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
 SELECT organization_id INTO org FROM public.alunos WHERE id=p_aluno;
 IF NOT EXISTS(SELECT 1 FROM public.organization_announcements a WHERE a.id=p_id AND a.organization_id=org AND a.status='publicado' AND (a.publico='condominio' OR EXISTS(SELECT 1 FROM public.health_day_inscricoes r WHERE r.evento_id=a.event_id AND r.aluno_id=p_aluno AND r.status IN('confirmado','checkin')))) THEN RAISE EXCEPTION 'Comunicado indisponível'; END IF;
 INSERT INTO public.organization_announcement_reads(announcement_id,aluno_id,organization_id) VALUES(p_id,p_aluno,org) ON CONFLICT DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION public.mark_announcement_read(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_announcement_read(uuid,uuid) TO authenticated;

-- Correlation-only audit; no free text, health answers, tokens or amounts are copied.
CREATE OR REPLACE FUNCTION app_private.audit_operational_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE row_data jsonb;org uuid;resource text;correlation text;
BEGIN
 IF auth.uid() IS NULL THEN RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END; END IF;
 row_data:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 org:=(row_data->>'organization_id')::uuid;
 IF org IS NULL AND row_data->>'aluno_id' IS NOT NULL THEN SELECT organization_id INTO org FROM public.alunos WHERE id=(row_data->>'aluno_id')::uuid; END IF;
 resource:=coalesce(row_data->>'id',row_data->>'announcement_id');
 correlation:=coalesce(row_data->>'request_id',resource);
 INSERT INTO public.user_access_audit(user_id,organization_id,event,metadata) VALUES(auth.uid(),org,'admin_action',jsonb_build_object('action',TG_TABLE_NAME||'.'||lower(TG_OP),'resource_id',resource,'correlation_id',correlation,'status',row_data->>'status'));
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END; $$;
DO $audit$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['service_requests','area_reservations','organization_announcements','organization_invites','organization_members','professional_booking_requests'] LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS audit_operational_change ON public.%I',t);
  EXECUTE format('CREATE TRIGGER audit_operational_change AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION app_private.audit_operational_change()',t);
 END LOOP;
END $audit$;
REVOKE ALL ON FUNCTION app_private.audit_operational_change() FROM PUBLIC,anon,authenticated;
COMMIT;
