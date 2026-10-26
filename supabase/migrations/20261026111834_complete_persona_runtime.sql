
-- Runtime compatibility and transactional external booking accounting.
CREATE OR REPLACE FUNCTION public.record_user_access(p_event_type text,p_organization_id uuid DEFAULT NULL,p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 IF p_event_type NOT IN('login','logout','context_changed','admin_action','denied') THEN RAISE EXCEPTION 'Evento inválido'; END IF;
 IF p_organization_id IS NOT NULL AND NOT(public.is_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.organization_members WHERE organization_id=p_organization_id AND user_id=auth.uid())) THEN RAISE EXCEPTION 'Sem acesso'; END IF;
 INSERT INTO public.user_access_audit(user_id,organization_id,event,metadata) VALUES(auth.uid(),p_organization_id,p_event_type,coalesce(p_metadata,'{}'::jsonb));
END; $$;
REVOKE ALL ON FUNCTION public.record_user_access(text,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_user_access(text,uuid,jsonb) TO authenticated;

CREATE TABLE IF NOT EXISTS public.organization_invite_deliveries(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),invite_id uuid NOT NULL REFERENCES public.organization_invites(id),
 status text NOT NULL,error text,message_id text,sent_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.organization_invite_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY invite_delivery_admin ON public.organization_invite_deliveries FOR SELECT TO authenticated USING(public.is_admin(auth.uid()));
GRANT SELECT ON public.organization_invite_deliveries TO authenticated;

CREATE TABLE IF NOT EXISTS public.agent_workflow_runs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid REFERENCES public.organizations(id),status text NOT NULL DEFAULT 'queued',created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.agent_workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflow_runs_read ON public.agent_workflow_runs FOR SELECT TO authenticated USING(public.persona_has_role(organization_id,ARRAY['manager']));
ALTER TABLE public.agent_workflow_tasks ADD COLUMN IF NOT EXISTS run_id uuid REFERENCES public.agent_workflow_runs(id);
ALTER TABLE public.agent_workflow_tasks ADD COLUMN IF NOT EXISTS sequence integer NOT NULL DEFAULT 1;
ALTER TABLE public.agent_workflow_tasks ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT true;
ALTER TABLE public.agent_workflow_tasks ADD COLUMN IF NOT EXISTS output jsonb;
ALTER TABLE public.agent_workflow_tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.agent_workflow_tasks ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.agent_workflow_tasks ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3;
ALTER TABLE public.agent_workflow_tasks ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE public.agent_workflow_tasks ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.agent_workflow_tasks ADD COLUMN IF NOT EXISTS duration_ms integer;
CREATE OR REPLACE FUNCTION public.claim_agent_workflow_task(p_task_id uuid)
RETURNS public.agent_workflow_tasks LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.agent_workflow_tasks;
BEGIN
 UPDATE public.agent_workflow_tasks SET status='running',attempt_count=attempt_count+1,started_at=now()
 WHERE id=p_task_id AND status='queued' AND requires_approval=false AND attempt_count<max_attempts RETURNING * INTO r;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Tarefa indisponível'; END IF;
 RETURN r;
END; $$;
REVOKE ALL ON FUNCTION public.claim_agent_workflow_task(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_agent_workflow_task(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.decide_agent_workflow(p_id uuid,p_approve boolean,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.agent_workflow_tasks; run uuid;
BEGIN
 SELECT * INTO r FROM public.agent_workflow_tasks WHERE id=p_id FOR UPDATE;
 IF auth.uid() IS NULL OR r.id IS NULL OR NOT public.persona_has_role(r.organization_id,ARRAY['manager']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF r.approval_role='admin' AND NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Aprovação exclusiva do administrador'; END IF;
 IF r.status<>'waiting_human' THEN RAISE EXCEPTION 'Tarefa já decidida'; END IF;
 IF NOT p_approve AND length(btrim(coalesce(p_reason,'')))<3 THEN RAISE EXCEPTION 'Informe o motivo'; END IF;
 run:=r.run_id;
 IF p_approve AND run IS NULL THEN INSERT INTO public.agent_workflow_runs(organization_id) VALUES(r.organization_id) RETURNING id INTO run; END IF;
 UPDATE public.agent_workflow_tasks SET status=CASE WHEN p_approve THEN 'queued' ELSE 'rejected' END,run_id=run,requires_approval=false,decision_reason=left(p_reason,2000),decided_by=auth.uid(),decided_at=now() WHERE id=r.id;
END; $$;

CREATE TABLE public.professional_booking_requests(
 id uuid PRIMARY KEY,aluno_id uuid NOT NULL REFERENCES public.alunos(id),details jsonb NOT NULL,
 status text NOT NULL DEFAULT 'reserved',external_id uuid,credit_reserved boolean NOT NULL DEFAULT true,
 error text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.professional_booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY professional_requests_read ON public.professional_booking_requests FOR SELECT TO authenticated USING(
 EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=aluno_id AND (a.user_id=auth.uid() OR public.persona_has_role(a.organization_id,ARRAY['manager']))));
GRANT SELECT ON public.professional_booking_requests TO authenticated;

CREATE OR REPLACE FUNCTION public.reserve_professional_credit(p_id uuid,p_user uuid,p_aluno uuid,p_details jsonb)
RETURNS public.professional_booking_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.alunos;r public.professional_booking_requests;
BEGIN
 IF p_id IS NULL OR p_user IS NULL OR p_details IS NULL THEN RAISE EXCEPTION 'Reserva inválida'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 SELECT * INTO r FROM public.professional_booking_requests WHERE id=p_id FOR UPDATE;
 IF FOUND THEN
  IF r.aluno_id<>p_aluno OR r.details<>p_details THEN RAISE EXCEPTION 'Identificador já utilizado'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.alunos WHERE id=r.aluno_id AND user_id=p_user) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  RETURN r;
 END IF;
 SELECT * INTO a FROM public.alunos WHERE id=p_aluno AND user_id=p_user AND status='ativo' FOR UPDATE;
 IF a.id IS NULL OR coalesce(a.aulas_disponiveis,0)<1 OR NOT EXISTS(SELECT 1 FROM public.organizations WHERE id=a.organization_id AND status='ativo') THEN RAISE EXCEPTION 'Cadastro indisponível ou sem créditos'; END IF;
 IF (p_details->>'freelancer_id') IS NULL OR length(coalesce(p_details->>'method',''))=0 THEN RAISE EXCEPTION 'Escolha método e profissional'; END IF;
 UPDATE public.alunos SET aulas_disponiveis=aulas_disponiveis-1 WHERE id=a.id;
 INSERT INTO public.professional_booking_requests(id,aluno_id,details) VALUES(p_id,a.id,p_details) RETURNING * INTO r;
 RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.finish_professional_booking(p_id uuid,p_external uuid,p_error text,p_refund boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.professional_booking_requests;
BEGIN
 SELECT * INTO r FROM public.professional_booking_requests WHERE id=p_id FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
 IF r.status IN('sent','cancel_requested','cancelled','failed') THEN RETURN; END IF;
 IF p_external IS NOT NULL THEN
  INSERT INTO public.staff_bookings(aluno_id,staff_booking_id,freelancer_id,method,hub,slot,professional_name,credits_charged,integration_status)
  VALUES(r.aluno_id,p_external,(r.details->>'freelancer_id')::uuid,r.details->>'method',r.details->>'hub',nullif(r.details->>'slot','')::timestamptz,r.details->>'professional_name',1,'pendente');
  UPDATE public.professional_booking_requests SET status='sent',external_id=p_external,error=NULL,updated_at=now() WHERE id=r.id;
 ELSE
  IF p_refund AND r.credit_reserved THEN UPDATE public.alunos SET aulas_disponiveis=coalesce(aulas_disponiveis,0)+1 WHERE id=r.aluno_id; END IF;
  UPDATE public.professional_booking_requests SET status=CASE WHEN p_refund THEN 'failed' ELSE 'unknown' END,credit_reserved=NOT p_refund,error=left(p_error,1000),updated_at=now() WHERE id=r.id;
 END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.apply_professional_status(p_external uuid,p_status text,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.staff_bookings;
BEGIN
 SELECT * INTO r FROM public.staff_bookings WHERE staff_booking_id=p_external FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
 IF p_status NOT IN('pendente','confirmado','rejeitado','cancelado','concluido') THEN RAISE EXCEPTION 'Status inválido'; END IF;
 IF r.integration_status::text IN('rejeitado','cancelado','concluido') THEN RETURN; END IF;
 IF p_status IN('rejeitado','cancelado') AND NOT r.credit_refunded THEN
  UPDATE public.alunos SET aulas_disponiveis=coalesce(aulas_disponiveis,0)+r.credits_charged WHERE id=r.aluno_id;
 END IF;
 UPDATE public.staff_bookings SET integration_status=p_status::public.staff_booking_status,status_reason=left(p_reason,1000),credit_refunded=credit_refunded OR p_status IN('rejeitado','cancelado') WHERE id=r.id;
 IF p_status IN('rejeitado','cancelado') THEN UPDATE public.professional_booking_requests SET status='cancelled',credit_reserved=false,updated_at=now() WHERE external_id=p_external; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.request_professional_cancellation(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.professional_booking_requests;a public.alunos;
BEGIN
 SELECT * INTO r FROM public.professional_booking_requests WHERE id=p_id FOR UPDATE;
 SELECT * INTO a FROM public.alunos WHERE id=r.aluno_id AND user_id=auth.uid();
 IF auth.uid() IS NULL OR a.id IS NULL THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF r.status='cancel_requested' THEN RETURN; END IF;
 IF r.status<>'sent' THEN RAISE EXCEPTION 'Cancelamento indisponível'; END IF;
 IF EXISTS(SELECT 1 FROM public.staff_bookings WHERE staff_booking_id=r.external_id AND integration_status::text IN('concluido','rejeitado','cancelado')) THEN RAISE EXCEPTION 'Reserva já encerrada'; END IF;
 UPDATE public.professional_booking_requests SET status='cancel_requested',updated_at=now() WHERE id=r.id;
 INSERT INTO public.support_tickets(organization_id,created_by,aluno_id,message,category)
 VALUES(a.organization_id,auth.uid(),a.id,'Solicitação de cancelamento Staff: '||r.external_id::text,'staff_cancel');
END; $$;
REVOKE ALL ON FUNCTION public.reserve_professional_credit(uuid,uuid,uuid,jsonb),public.finish_professional_booking(uuid,uuid,text,boolean),public.apply_professional_status(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_professional_credit(uuid,uuid,uuid,jsonb),public.finish_professional_booking(uuid,uuid,text,boolean),public.apply_professional_status(uuid,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.request_professional_cancellation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_professional_cancellation(uuid) TO authenticated;

