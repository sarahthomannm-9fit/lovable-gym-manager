-- Complete the four persona journeys without seeding customer data.
CREATE OR REPLACE FUNCTION public.persona_has_role(p_org uuid,p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND (public.is_admin(auth.uid()) OR EXISTS(
 SELECT 1 FROM public.organization_members m JOIN public.organizations o ON o.id=m.organization_id
 WHERE m.user_id=auth.uid() AND m.organization_id=p_org AND m.papel::text=ANY(p_roles) AND o.status::text='ativo'));
$$;
REVOKE ALL ON FUNCTION public.persona_has_role(uuid,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.persona_has_role(uuid,text[]) TO authenticated;

DROP POLICY IF EXISTS user_reads_own_role ON public.user_roles;
CREATE POLICY user_reads_own_role ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid());

ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS unidade text;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.agent_reports ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.propostas_b2b ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
UPDATE public.support_tickets t SET organization_id=a.organization_id FROM public.alunos a WHERE t.aluno_id=a.id AND t.organization_id IS NULL;
CREATE INDEX IF NOT EXISTS support_tickets_org_idx ON public.support_tickets(organization_id,created_at DESC);
CREATE INDEX IF NOT EXISTS agent_reports_org_idx ON public.agent_reports(organization_id,report_date DESC);
CREATE INDEX IF NOT EXISTS propostas_b2b_org_idx ON public.propostas_b2b(organization_id,created_at DESC);

DROP POLICY IF EXISTS ticket_select ON public.support_tickets;
DROP POLICY IF EXISTS ticket_insert_own_or_staff ON public.support_tickets;
DROP POLICY IF EXISTS ticket_update_staff ON public.support_tickets;
CREATE POLICY ticket_select ON public.support_tickets FOR SELECT TO authenticated USING(
 public.is_admin(auth.uid()) OR created_by=auth.uid() OR EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=aluno_id AND a.user_id=auth.uid())
 OR public.persona_has_role(organization_id,ARRAY['manager','sindico']));
CREATE POLICY ticket_insert_own_or_staff ON public.support_tickets FOR INSERT TO authenticated WITH CHECK(
 created_by=auth.uid() AND organization_id IS NOT NULL AND (
 public.persona_has_role(organization_id,ARRAY['manager','sindico','professor','user']) OR EXISTS(
 SELECT 1 FROM public.alunos a WHERE a.id=aluno_id AND a.user_id=auth.uid() AND a.organization_id=support_tickets.organization_id)));
CREATE POLICY ticket_update_staff ON public.support_tickets FOR UPDATE TO authenticated
 USING(public.persona_has_role(organization_id,ARRAY['manager']))
 WITH CHECK(public.persona_has_role(organization_id,ARRAY['manager']));
DROP POLICY IF EXISTS agent_reports_select_staff ON public.agent_reports;
CREATE POLICY agent_reports_select_staff ON public.agent_reports FOR SELECT TO authenticated USING(
 public.persona_has_role(organization_id,ARRAY['manager']));
DROP POLICY IF EXISTS propostas_b2b_select_staff ON public.propostas_b2b;
CREATE POLICY propostas_b2b_select_staff ON public.propostas_b2b FOR SELECT TO authenticated USING(
 public.persona_has_role(organization_id,ARRAY['manager']));

CREATE OR REPLACE FUNCTION public.start_resident_onboarding(p_organization_id uuid,p_nome text,p_email text,p_unidade text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v public.alunos; v_email text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Confirme seu e-mail para continuar'; END IF;
 SELECT lower(email) INTO v_email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF v_email IS NULL OR v_email<>lower(btrim(p_email)) THEN RAISE EXCEPTION 'E-mail não confirmado'; END IF;
 IF length(btrim(coalesce(p_nome,'')))<2 OR NOT EXISTS(SELECT 1 FROM public.organizations WHERE id=p_organization_id AND tipo='condominio' AND status='ativo') THEN RAISE EXCEPTION 'Cadastro ou condomínio inválido'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_email,0));
 SELECT * INTO v FROM public.alunos WHERE lower(email)=v_email FOR UPDATE;
 IF FOUND THEN
   IF v.organization_id IS DISTINCT FROM p_organization_id OR (v.user_id IS NOT NULL AND v.user_id<>auth.uid()) THEN RAISE EXCEPTION 'Cadastro já vinculado. Solicite apoio à administração'; END IF;
   UPDATE public.alunos SET user_id=auth.uid(),unidade=left(p_unidade,80) WHERE id=v.id RETURNING * INTO v;
 ELSE
   INSERT INTO public.alunos(organization_id,user_id,nome,email,unidade,status,tipo)
   VALUES(p_organization_id,auth.uid(),left(btrim(p_nome),200),v_email,left(p_unidade,80),'ativo','presencial') RETURNING * INTO v;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.organization_members WHERE organization_id=p_organization_id AND user_id=auth.uid()) THEN
   INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(p_organization_id,auth.uid(),'user');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid()) THEN INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),'user'); END IF;
 RETURN v.id;
END; $$;
REVOKE ALL ON FUNCTION public.start_resident_onboarding(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.start_resident_onboarding(uuid,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_resident_profile(p_aluno_id uuid,p_nome text,p_telefone text,p_unidade text,p_notifications boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR length(btrim(coalesce(p_nome,'')))<2 THEN RAISE EXCEPTION 'Informe seu nome'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.alunos WHERE id=p_aluno_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 UPDATE public.alunos SET nome=left(btrim(p_nome),200),telefone=left(p_telefone,30),unidade=left(p_unidade,80),notifications_enabled=coalesce(p_notifications,true) WHERE id=p_aluno_id AND user_id=auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.set_class_registration(p_aula_id uuid,p_aluno_id uuid,p_register boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.aulas; a public.alunos; v_id uuid; n integer; v_status text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 SELECT * INTO c FROM public.aulas WHERE id=p_aula_id FOR UPDATE;
 SELECT * INTO a FROM public.alunos WHERE id=p_aluno_id AND user_id=auth.uid();
 IF c.id IS NULL OR a.id IS NULL OR a.organization_id IS DISTINCT FROM c.organization_id OR a.status<>'ativo' THEN RAISE EXCEPTION 'Aula indisponível para seu cadastro'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.organizations WHERE id=c.organization_id AND status='ativo') THEN RAISE EXCEPTION 'Condomínio indisponível'; END IF;
 IF c.status='cancelada' OR (c.data_aula+c.horario_inicio) <= (now() AT TIME ZONE 'America/Sao_Paulo') THEN RAISE EXCEPTION 'Inscrições encerradas'; END IF;
 SELECT id,status INTO v_id,v_status FROM public.aulas_inscritos WHERE aula_id=c.id AND aluno_id=a.id;
 IF p_register THEN
  IF v_status IN('inscrito','presente') THEN RETURN v_status; END IF;
  SELECT count(*) INTO n FROM public.aulas_inscritos WHERE aula_id=c.id AND status IN('inscrito','presente');
  IF n>=coalesce(c.capacidade_maxima,0) THEN RAISE EXCEPTION 'Aula lotada'; END IF;
  INSERT INTO public.aulas_inscritos(aula_id,aluno_id,status) VALUES(c.id,a.id,'inscrito')
  ON CONFLICT(aula_id,aluno_id) DO UPDATE SET status='inscrito';
  RETURN 'inscrito';
 ELSE
  IF v_status='presente' THEN RAISE EXCEPTION 'Presença já registrada'; END IF;
  UPDATE public.aulas_inscritos SET status='cancelado' WHERE id=v_id;
  RETURN 'cancelado';
 END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_area_reservation(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.area_reservations;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 SELECT * INTO r FROM public.area_reservations WHERE id=p_id FOR UPDATE;
 IF r.id IS NULL OR NOT(EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=r.aluno_id AND a.user_id=auth.uid()) OR public.persona_has_role(r.organization_id,ARRAY['manager','sindico'])) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF r.status='cancelada' THEN RETURN; END IF;
 IF r.status<>'confirmada' OR r.starts_at<=now() THEN RAISE EXCEPTION 'Reserva já iniciada ou encerrada'; END IF;
 UPDATE public.area_reservations SET status='cancelada' WHERE id=p_id;
END; $$;

CREATE OR REPLACE FUNCTION public.transition_service_request(p_id uuid,p_action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.service_requests; owner boolean; staff boolean;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 SELECT * INTO r FROM public.service_requests WHERE id=p_id FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
 owner:=EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=r.aluno_id AND a.user_id=auth.uid());
 staff:=public.persona_has_role(r.organization_id,ARRAY['manager','sindico','professor']);
 IF NOT(owner OR staff) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF p_action='accept' AND owner AND r.status='cotada' THEN
  IF r.quoted_value IS NULL OR r.quoted_value<0 THEN RAISE EXCEPTION 'Proposta inválida'; END IF;
  IF r.payment_id IS NULL AND r.quoted_value>0 THEN
   INSERT INTO public.pagamentos(aluno_id,valor,data_vencimento,status,referencia_mes,observacoes)
   VALUES(r.aluno_id,r.quoted_value,current_date+7,'pendente',date_trunc('month',current_date)::date,'Serviço NINE LIVING: '||r.service_type)
   RETURNING id INTO r.payment_id;
  END IF;
  UPDATE public.service_requests SET status='confirmada',payment_id=r.payment_id,updated_at=now() WHERE id=r.id;
 ELSIF p_action='complete' AND staff AND r.status='confirmada' THEN UPDATE public.service_requests SET status='concluida',updated_at=now() WHERE id=r.id;
 ELSIF p_action='cancel' AND r.status IN('solicitada','cotada','confirmada') THEN
  IF r.payment_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.pagamentos WHERE id=r.payment_id AND status='pago') THEN RAISE EXCEPTION 'Pagamento confirmado. Solicite cancelamento e estorno à administração'; END IF;
  UPDATE public.service_requests SET status='cancelada',updated_at=now() WHERE id=r.id;
  UPDATE public.pagamentos SET status='cancelado' WHERE id=r.payment_id AND status<>'pago';
 ELSE RAISE EXCEPTION 'Ação indisponível neste status'; END IF;
END; $$;

-- A quotation is an offer, not a payment obligation. Payment is created on acceptance.
CREATE OR REPLACE FUNCTION public.quote_service_request(p_id uuid,p_value numeric,p_assigned_to text,p_preferred_at timestamptz DEFAULT NULL)
RETURNS public.service_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.service_requests;
BEGIN
 SELECT * INTO r FROM public.service_requests WHERE id=p_id FOR UPDATE;
 IF auth.uid() IS NULL OR r.id IS NULL OR NOT public.persona_has_role(r.organization_id,ARRAY['manager','sindico','professor']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF r.status NOT IN('solicitada','cotada') OR p_value IS NULL OR p_value<0 OR length(btrim(coalesce(p_assigned_to,'')))<2 THEN RAISE EXCEPTION 'Proposta inválida'; END IF;
 UPDATE public.service_requests SET status='cotada',quoted_value=p_value,assigned_to=left(p_assigned_to,200),preferred_at=p_preferred_at,updated_at=now() WHERE id=r.id RETURNING * INTO r;
 RETURN r;
END; $$;

CREATE TABLE IF NOT EXISTS public.agent_workflow_tasks(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid REFERENCES public.organizations(id),
 agent_id text NOT NULL,task_key text NOT NULL,approval_role text NOT NULL DEFAULT 'admin',
 input jsonb NOT NULL DEFAULT '{}'::jsonb,status text NOT NULL DEFAULT 'waiting_human',
 decision_reason text,decided_by uuid REFERENCES auth.users(id),decided_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.agent_workflow_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflow_staff_read ON public.agent_workflow_tasks FOR SELECT TO authenticated USING(public.persona_has_role(organization_id,ARRAY['manager']));
CREATE POLICY workflow_admin_insert ON public.agent_workflow_tasks FOR INSERT TO authenticated WITH CHECK(public.is_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.decide_agent_workflow(p_id uuid,p_approve boolean,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.agent_workflow_tasks;
BEGIN
 SELECT * INTO r FROM public.agent_workflow_tasks WHERE id=p_id FOR UPDATE;
 IF auth.uid() IS NULL OR r.id IS NULL OR NOT public.persona_has_role(r.organization_id,ARRAY['manager']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF r.approval_role='admin' AND NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Aprovação exclusiva do administrador'; END IF;
 IF r.status<>'waiting_human' THEN RAISE EXCEPTION 'Tarefa já decidida'; END IF;
 IF NOT p_approve AND length(btrim(coalesce(p_reason,'')))<3 THEN RAISE EXCEPTION 'Informe o motivo'; END IF;
 UPDATE public.agent_workflow_tasks SET status=CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,decision_reason=left(p_reason,2000),decided_by=auth.uid(),decided_at=now() WHERE id=r.id;
END; $$;

CREATE OR REPLACE FUNCTION public.resolve_support_ticket(p_id uuid,p_response text,p_resolve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.support_tickets;
BEGIN
 SELECT * INTO r FROM public.support_tickets WHERE id=p_id FOR UPDATE;
 IF auth.uid() IS NULL OR r.id IS NULL OR NOT public.persona_has_role(r.organization_id,ARRAY['manager']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF length(btrim(coalesce(p_response,'')))<3 THEN RAISE EXCEPTION 'Informe uma resposta'; END IF;
 UPDATE public.support_tickets SET agent_response=left(p_response,4000),status=CASE WHEN p_resolve THEN 'resolved' ELSE 'in_progress' END,resolved_at=CASE WHEN p_resolve THEN now() ELSE NULL END,updated_at=now() WHERE id=r.id;
END; $$;

DROP POLICY IF EXISTS coach_session_read ON public.workout_sessions;
CREATE POLICY coach_session_read ON public.workout_sessions FOR SELECT TO authenticated USING(
 EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=aluno_id AND (a.user_id=auth.uid() OR public.persona_has_role(a.organization_id,ARRAY['manager','professor']))));

REVOKE ALL ON FUNCTION public.save_resident_profile(uuid,text,text,text,boolean),public.set_class_registration(uuid,uuid,boolean),public.cancel_area_reservation(uuid),public.transition_service_request(uuid,text),public.decide_agent_workflow(uuid,boolean,text),public.resolve_support_ticket(uuid,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_resident_profile(uuid,text,text,text,boolean),public.set_class_registration(uuid,uuid,boolean),public.cancel_area_reservation(uuid),public.transition_service_request(uuid,text),public.decide_agent_workflow(uuid,boolean,text),public.resolve_support_ticket(uuid,text,boolean) TO authenticated;
GRANT SELECT,INSERT ON public.agent_workflow_tasks TO authenticated;

CREATE OR REPLACE FUNCTION public.list_resident_condominiums()
RETURNS TABLE(id uuid,nome text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT o.id,o.nome::text FROM public.organizations o WHERE o.tipo='condominio' AND o.status='ativo' ORDER BY o.nome;
$$;
REVOKE ALL ON FUNCTION public.list_resident_condominiums() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_resident_condominiums() TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.create_area_reservation(p_organization_id uuid,p_area_type text,p_title text,p_starts_at timestamptz,p_ends_at timestamptz)
RETURNS public.area_reservations LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_student uuid;r public.area_reservations;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 SELECT a.id INTO v_student FROM public.alunos a JOIN public.organizations o ON o.id=a.organization_id WHERE a.user_id=auth.uid() AND a.organization_id=p_organization_id AND a.status='ativo' AND o.status='ativo';
 IF v_student IS NULL OR p_area_type IS NULL OR p_area_type NOT IN('academia','quadra','piscina','brinquedoteca','salao','outro') OR length(btrim(coalesce(p_title,'')))<2 OR p_starts_at IS NULL OR p_ends_at IS NULL OR p_starts_at<=now() OR p_ends_at<=p_starts_at THEN RAISE EXCEPTION 'Reserva inválida'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_organization_id::text||':'||p_area_type,0));
 IF EXISTS(SELECT 1 FROM public.area_reservations WHERE organization_id=p_organization_id AND area_type=p_area_type AND status='confirmada' AND tstzrange(starts_at,ends_at,'[)') && tstzrange(p_starts_at,p_ends_at,'[)')) THEN RAISE EXCEPTION 'Este horário já está reservado'; END IF;
 INSERT INTO public.area_reservations(organization_id,aluno_id,area_type,title,starts_at,ends_at) VALUES(p_organization_id,v_student,p_area_type,left(btrim(p_title),200),p_starts_at,p_ends_at) RETURNING * INTO r;
 RETURN r;
END; $$;
REVOKE ALL ON FUNCTION public.create_area_reservation(uuid,text,text,timestamptz,timestamptz),public.quote_service_request(uuid,numeric,text,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_area_reservation(uuid,text,text,timestamptz,timestamptz),public.quote_service_request(uuid,numeric,text,timestamptz) TO authenticated;

