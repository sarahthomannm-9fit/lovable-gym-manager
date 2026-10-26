
ALTER TABLE public.user_access_audit DROP CONSTRAINT IF EXISTS user_access_audit_event_check;
ALTER TABLE public.user_access_audit ADD CONSTRAINT user_access_audit_event_check CHECK(event IN('login','logout','context_switch','access_denied','context_changed','admin_action','denied'));
ALTER TABLE public.agent_reports DROP CONSTRAINT IF EXISTS agent_reports_agent_id_report_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS agent_reports_org_agent_date ON public.agent_reports(organization_id,agent_id,report_date);
ALTER TABLE public.content_drafts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

CREATE OR REPLACE FUNCTION public.protect_resident_account_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user='authenticated' AND NOT public.persona_has_role(old.organization_id,ARRAY['manager']) THEN
  IF old.user_id IS DISTINCT FROM auth.uid() OR (to_jsonb(new)-ARRAY['nome','telefone','unidade','notifications_enabled','updated_at']) IS DISTINCT FROM (to_jsonb(old)-ARRAY['nome','telefone','unidade','notifications_enabled','updated_at']) THEN RAISE EXCEPTION 'Alteração reservada à administração'; END IF;
 END IF;
 RETURN new;
END; $$;
CREATE TRIGGER protect_resident_account_fields BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE FUNCTION public.protect_resident_account_fields();

CREATE OR REPLACE FUNCTION public.validate_class_registration()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE c public.aulas;student_org uuid;student_user uuid;n integer;staff boolean;
BEGIN
 IF current_user<>'authenticated' THEN RETURN new; END IF;
 SELECT * INTO c FROM public.aulas WHERE id=new.aula_id FOR UPDATE;
 SELECT organization_id,user_id INTO student_org,student_user FROM public.alunos WHERE id=new.aluno_id;
 staff:=public.persona_has_role(c.organization_id,ARRAY['manager','professor']);
 IF c.id IS NULL OR student_org IS DISTINCT FROM c.organization_id OR (student_user IS DISTINCT FROM auth.uid() AND NOT staff) THEN RAISE EXCEPTION 'Inscrição fora do contexto autorizado'; END IF;
 IF NOT staff AND (c.status='cancelada' OR c.data_aula+c.horario_inicio<=(now() AT TIME ZONE 'America/Sao_Paulo') OR new.status NOT IN('inscrito','cancelado')) THEN RAISE EXCEPTION 'Ação indisponível para o morador'; END IF;
 IF TG_OP='UPDATE' AND (new.aula_id IS DISTINCT FROM old.aula_id OR new.aluno_id IS DISTINCT FROM old.aluno_id) THEN RAISE EXCEPTION 'Não é permitido transferir inscrição'; END IF;
 IF new.status IN('inscrito','presente') THEN
  SELECT count(*) INTO n FROM public.aulas_inscritos WHERE aula_id=c.id AND status IN('inscrito','presente') AND id IS DISTINCT FROM new.id;
  IF n>=coalesce(c.capacidade_maxima,0) THEN RAISE EXCEPTION 'Aula lotada'; END IF;
 END IF;
 RETURN new;
END; $$;
CREATE TRIGGER validate_class_registration BEFORE INSERT OR UPDATE ON public.aulas_inscritos FOR EACH ROW EXECUTE FUNCTION public.validate_class_registration();
REVOKE INSERT,UPDATE,DELETE ON public.staff_bookings FROM authenticated;

CREATE OR REPLACE FUNCTION public.complete_area_reservation(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.area_reservations;
BEGIN
 SELECT * INTO r FROM public.area_reservations WHERE id=p_id FOR UPDATE;
 IF auth.uid() IS NULL OR r.id IS NULL OR NOT public.persona_has_role(r.organization_id,ARRAY['manager','sindico']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF r.status<>'confirmada' OR r.ends_at>now() THEN RAISE EXCEPTION 'Somente reservas encerradas podem ser concluídas'; END IF;
 UPDATE public.area_reservations SET status='concluida' WHERE id=r.id;
END; $$;
CREATE OR REPLACE FUNCTION public.review_student_safety_decision(p_queue uuid,p_decision text,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.treinos_ia_fila;
BEGIN
 SELECT * INTO q FROM public.treinos_ia_fila WHERE id=p_queue FOR UPDATE;
 IF auth.uid() IS NULL OR q.id IS NULL OR NOT public.persona_has_role(q.organization_id,ARRAY['manager','professor']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF q.status<>'pendente' OR p_decision NOT IN('aprovado','rejeitado') OR length(btrim(coalesce(p_reason,'')))<3 THEN RAISE EXCEPTION 'Informe decisão e justificativa'; END IF;
 PERFORM public.review_student_safety(p_queue,p_decision);
 INSERT INTO public.user_access_audit(user_id,organization_id,event,metadata) VALUES(auth.uid(),q.organization_id,'admin_action',jsonb_build_object('action','safety_review','queue',q.id,'decision',p_decision,'reason',left(p_reason,2000)));
END; $$;
REVOKE ALL ON FUNCTION public.complete_area_reservation(uuid),public.review_student_safety_decision(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_area_reservation(uuid),public.review_student_safety_decision(uuid,text,text) TO authenticated;

