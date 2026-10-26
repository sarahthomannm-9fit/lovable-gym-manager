BEGIN;
ALTER TABLE public.student_safety_onboarding ADD COLUMN IF NOT EXISTS consent_version text;
ALTER TABLE public.student_safety_onboarding ADD COLUMN IF NOT EXISTS consent_recorded_at timestamptz;
CREATE TABLE IF NOT EXISTS public.health_consent_log(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL REFERENCES public.organizations(id),
 aluno_id uuid NOT NULL REFERENCES public.alunos(id),actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 consent_version text NOT NULL,accepted boolean NOT NULL,recorded_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.health_consent_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.health_consent_log FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.health_consent_log TO authenticated;
CREATE POLICY health_consent_own_read ON public.health_consent_log FOR SELECT TO authenticated
 USING(app_private.admin() OR app_private.own_student(aluno_id));
CREATE INDEX IF NOT EXISTS health_consent_student_date_idx ON public.health_consent_log(aluno_id,recorded_at DESC);

CREATE OR REPLACE FUNCTION app_private.record_health_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE version_value text:=nullif(current_setting('app.health_consent_version',true),'');
BEGIN
 IF version_value IS NULL THEN
  IF TG_OP='INSERT' THEN RAISE EXCEPTION 'Consentimento versionado obrigatório'; END IF;
  RETURN NEW;
 END IF;
 IF NOT app_private.own_student(NEW.aluno_id) THEN RAISE EXCEPTION 'Somente o titular pode registrar seu consentimento'; END IF;
 NEW.consent_version:=version_value;NEW.consent_recorded_at:=now();
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS record_health_consent ON public.student_safety_onboarding;
CREATE TRIGGER record_health_consent BEFORE INSERT OR UPDATE ON public.student_safety_onboarding FOR EACH ROW EXECUTE FUNCTION app_private.record_health_consent();

CREATE OR REPLACE FUNCTION app_private.append_health_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.consent_version IS NOT NULL AND (TG_OP='INSERT' OR NEW.consent_recorded_at IS DISTINCT FROM OLD.consent_recorded_at) THEN
  INSERT INTO public.health_consent_log(organization_id,aluno_id,actor_id,consent_version,accepted)
  VALUES(NEW.organization_id,NEW.aluno_id,auth.uid(),NEW.consent_version,NEW.consentimento);
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS append_health_consent ON public.student_safety_onboarding;
CREATE TRIGGER append_health_consent AFTER INSERT OR UPDATE ON public.student_safety_onboarding FOR EACH ROW EXECUTE FUNCTION app_private.append_health_consent();

-- Every listed routine acts on an authenticated persona, not a background integration.
-- Patch only the first PL/pgSQL BEGIN and abort if an unexpected signature/body is found.
DO $guard$
DECLARE fn record;definition text;patched text;
BEGIN
 FOR fn IN SELECT p.oid,p.proname FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang WHERE p.pronamespace='public'::regnamespace AND l.lanname='plpgsql'
 AND p.proname IN('submit_student_safety_onboarding','student_workout','save_workout_session','record_daily_checkin','set_class_registration','mark_class_attendance','review_student_safety','create_service_request','create_area_reservation','request_professional_cancellation','register_health_day','cancel_health_day_registration','checkin_health_day','manage_health_day_registration','set_condominium_event_status','publish_organization_announcement','archive_organization_announcement','resident_announcements','accept_organization_invite','accept_staff_invite','save_resident_profile','read_resident_notification','save_announcement','save_condominium_event','save_activation_goals','decide_agent_workflow','cancel_area_reservation','complete_area_reservation','quote_service_request','transition_service_request','assign_organization_member','set_user_global_role','wipe_demo_organization','create_organization_invite','create_staff_invite','cancel_organization_invite','set_staff_active','dashboard_coach','dashboard_morador','criar_notificacao') LOOP
  definition:=pg_get_functiondef(fn.oid);
  patched:=regexp_replace(definition,'(?i)\mBEGIN\M','BEGIN
 IF NOT app_private.session_valid() THEN RAISE EXCEPTION ''Sessão sem acesso ou revogada'' USING ERRCODE=''42501''; END IF;', '');
  IF fn.proname='submit_student_safety_onboarding' THEN
   patched:=regexp_replace(patched,'(?i)\mBEGIN\M','BEGIN
 IF coalesce(p_payload->>''consent_version'','''')<>''triagem-2026-10-26-v1'' THEN RAISE EXCEPTION ''Leia e aceite a versão atual do consentimento''; END IF;
 PERFORM set_config(''app.health_consent_version'',''triagem-2026-10-26-v1'',true);','');
  END IF;
  IF fn.proname='student_workout' THEN
   patched:=replace(patched,'SELECT id INTO STRICT v_student FROM public.alunos WHERE user_id=auth.uid();',
    'SELECT id INTO STRICT v_student FROM public.alunos WHERE user_id=auth.uid();
     IF NOT app_private.own_student(v_student) THEN RAISE EXCEPTION ''Condomínio indisponível'' USING ERRCODE=''42501''; END IF;');
  END IF;
  IF patched=definition THEN RAISE EXCEPTION 'Unable to secure routine %',fn.proname; END IF;
  EXECUTE patched;
 END LOOP;
END $guard$;

CREATE OR REPLACE FUNCTION public.publish_workout(p_request_id uuid,p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user uuid:=auth.uid();v_student public.alunos;v_plan uuid;v_workout uuid;
 v_start date;v_weeks integer;v_ex jsonb;v_week integer;v_restrictions text[];
BEGIN
 IF NOT app_private.session_valid() OR p_request_id IS NULL OR p_payload IS NULL THEN RAISE EXCEPTION 'Publicação inválida ou sessão encerrada' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_student FROM public.alunos WHERE id=(p_payload->>'aluno_id')::uuid FOR UPDATE;
 IF v_student.id IS NULL OR NOT app_private.student_role(v_student.id,ARRAY['manager','professor']) THEN RAISE EXCEPTION 'Sem permissão para prescrever neste condomínio' USING ERRCODE='42501'; END IF;
 IF NOT app_private.resident_active(v_student.status,v_student.lifecycle_status::text) THEN RAISE EXCEPTION 'Morador inativo ou suspenso'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 SELECT treino_id INTO v_workout FROM public.workout_publications WHERE request_id=p_request_id;
 IF FOUND THEN
  IF NOT EXISTS(SELECT 1 FROM public.workout_publications WHERE request_id=p_request_id AND user_id=v_user AND payload=p_payload) THEN RAISE EXCEPTION 'Identificador de publicação já utilizado'; END IF;
  RETURN v_workout;
 END IF;
 IF NOT public.student_is_safe_for_workout(v_student.id) THEN RAISE EXCEPTION 'Triagem pendente de avaliação profissional'; END IF;
 v_start:=(p_payload->>'data_inicio')::date;v_weeks:=(p_payload->>'semanas')::integer;
 IF v_start IS NULL OR v_weeks IS NULL OR v_weeks NOT BETWEEN 4 AND 12 OR length(btrim(coalesce(p_payload->>'nome','')))<1 OR jsonb_typeof(p_payload->'exercicios') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Dados do treino inválidos'; END IF;
 IF jsonb_array_length(p_payload->'exercicios') NOT BETWEEN 3 AND 100 THEN RAISE EXCEPTION 'Adicione de 3 a 100 exercícios'; END IF;
 SELECT coalesce(restricoes,'{}')||coalesce(lesoes_atuais,'{}') INTO v_restrictions FROM public.student_safety_onboarding WHERE aluno_id=v_student.id;
 FOR v_ex IN SELECT value FROM jsonb_array_elements(p_payload->'exercicios') LOOP
  IF coalesce((v_ex->>'dia_semana')::integer,0) NOT BETWEEN 1 AND 7 OR coalesce((v_ex->>'series')::integer,0) NOT BETWEEN 1 AND 30 OR length(btrim(coalesce(v_ex->>'repeticoes','')))=0 OR coalesce((v_ex->>'descanso_seg')::integer,-1) NOT BETWEEN 0 AND 1800 OR coalesce((v_ex->>'carga_kg')::numeric,0)<0 THEN RAISE EXCEPTION 'Parâmetros de exercício inválidos'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.exercicios_biblioteca e WHERE e.id=(v_ex->>'exercicio_id')::uuid AND e.ativo=true AND (e.organization_id IS NULL OR e.organization_id=v_student.organization_id)
   AND NOT EXISTS(SELECT 1 FROM unnest(coalesce(e.restricoes_incompativeis,'{}')) blocked CROSS JOIN unnest(coalesce(v_restrictions,'{}')) declared WHERE btrim(blocked)<>'' AND btrim(declared)<>'' AND (strpos(lower(blocked),lower(declared))>0 OR strpos(lower(declared),lower(blocked))>0))
   AND (nullif(btrim(e.equipamento),'') IS NULL OR lower(btrim(e.equipamento)) IN('nenhum','peso corporal','livre','sem equipamento') OR EXISTS(SELECT 1 FROM public.organization_facilities f WHERE f.organization_id=v_student.organization_id AND f.status='aprovado' AND (strpos(lower(f.nome),lower(e.equipamento))>0 OR strpos(lower(e.equipamento),lower(f.nome))>0))))
  THEN RAISE EXCEPTION 'Exercício incompatível com a triagem ou equipamento não aprovado'; END IF;
 END LOOP;
 INSERT INTO public.planos_treino(nome,objetivo,nivel,semanas,dias_semana,organization_id,professor_id,ativo,publico)
 VALUES(btrim(p_payload->>'nome'),left(p_payload->>'objetivo',500),left(p_payload->>'nivel',100),v_weeks,(SELECT count(DISTINCT value->>'dia_semana') FROM jsonb_array_elements(p_payload->'exercicios')),v_student.organization_id,v_user,true,false) RETURNING id INTO v_plan;
 FOR v_week IN 1..v_weeks LOOP
  INSERT INTO public.plano_exercicios(plano_treino_id,exercicio_id,semana,dia_semana,ordem,series,repeticoes,carga_kg,descanso_seg,observacoes)
  SELECT v_plan,(e.value->>'exercicio_id')::uuid,v_week,(e.value->>'dia_semana')::integer,e.ordinality::integer,(e.value->>'series')::integer,e.value->>'repeticoes',(e.value->>'carga_kg')::numeric,(e.value->>'descanso_seg')::integer,left(e.value->>'observacoes',2000)
  FROM jsonb_array_elements(p_payload->'exercicios') WITH ORDINALITY e(value,ordinality);
 END LOOP;
 INSERT INTO public.treinos(aluno_id,plano_treino_id,organization_id,professor_id,nome,descricao,data_inicio,data_fim,status)
 VALUES(v_student.id,v_plan,v_student.organization_id,v_user,btrim(p_payload->>'nome'),left(p_payload->>'objetivo',500),v_start,v_start+v_weeks*7-1,'ativo') RETURNING id INTO v_workout;
 INSERT INTO public.workout_publications(request_id,user_id,payload,treino_id) VALUES(p_request_id,v_user,p_payload,v_workout);
 RETURN v_workout;
END; $$;

-- Replay of an already accepted/completed/cancelled action is a no-op, not a new charge.
DO $idempotency$
DECLARE definition text;patched text;
BEGIN
 SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE oid='public.transition_service_request(uuid,text)'::regprocedure;
 patched:=replace(definition,
 'IF NOT(owner OR staff) THEN RAISE EXCEPTION ''Sem permissão''; END IF;',
 'IF NOT(owner OR staff) THEN RAISE EXCEPTION ''Sem permissão''; END IF;
 IF (p_action=''accept'' AND owner AND r.status IN(''confirmada'',''concluida'')) OR (p_action=''complete'' AND staff AND r.status=''concluida'') OR (p_action=''cancel'' AND r.status=''cancelada'') THEN RETURN; END IF;');
 IF patched=definition THEN RAISE EXCEPTION 'Service transition definition changed; review migration'; END IF;
 EXECUTE patched;
END $idempotency$;

REVOKE ALL ON FUNCTION public.publish_workout(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.publish_workout(uuid,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION app_private.record_health_consent() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION app_private.append_health_consent() FROM PUBLIC,anon,authenticated;
-- Only the audited decision endpoint may invoke the lower-level clinical decision.
REVOKE ALL ON FUNCTION public.review_student_safety(uuid,text) FROM PUBLIC,anon,authenticated;
-- A resident may route a health question to professionals without exposing it to syndic.
DO $support$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='support_tickets' LOOP EXECUTE format('DROP POLICY %I ON public.support_tickets',p.policyname); END LOOP;
END $support$;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_select_scoped ON public.support_tickets FOR SELECT TO authenticated USING(
 (created_by=(SELECT auth.uid()) AND app_private.session_valid()) OR app_private.own_student(aluno_id)
 OR app_private.org_role(organization_id,ARRAY['admin','manager'])
 OR (category IN('condominio','infraestrutura','areas','servicos') AND app_private.org_role(organization_id,ARRAY['sindico']))
 OR (category='treino_saude' AND app_private.org_role(organization_id,ARRAY['professor'])));
CREATE POLICY support_insert_scoped ON public.support_tickets FOR INSERT TO authenticated WITH CHECK(
 created_by=(SELECT auth.uid()) AND app_private.org_member(organization_id)
 AND (aluno_id IS NULL OR (app_private.own_student(aluno_id) AND app_private.student_matches(aluno_id,organization_id))));
REVOKE INSERT,UPDATE,DELETE ON public.support_tickets FROM anon;
REVOKE UPDATE,DELETE ON public.support_tickets FROM authenticated;
CREATE OR REPLACE FUNCTION public.resolve_support_ticket(p_id uuid,p_response text,p_resolve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.support_tickets;
BEGIN
 SELECT * INTO r FROM public.support_tickets WHERE id=p_id FOR UPDATE;
 IF r.id IS NULL OR NOT(app_private.org_role(r.organization_id,ARRAY['admin','manager'])
 OR (r.category IN('condominio','infraestrutura','areas','servicos') AND app_private.org_role(r.organization_id,ARRAY['sindico']))
 OR (r.category='treino_saude' AND app_private.org_role(r.organization_id,ARRAY['professor']))) THEN RAISE EXCEPTION 'Atendimento fora do seu escopo' USING ERRCODE='42501'; END IF;
 IF length(btrim(coalesce(p_response,'')))<3 THEN RAISE EXCEPTION 'Informe uma resposta'; END IF;
 UPDATE public.support_tickets SET agent_response=left(p_response,4000),status=CASE WHEN p_resolve THEN 'resolved' ELSE 'in_progress' END,resolved_at=CASE WHEN p_resolve THEN now() ELSE NULL END,updated_at=now() WHERE id=r.id;
END; $$;
DO $service_roles$
DECLARE name text;definition text;
BEGIN
 FOREACH name IN ARRAY ARRAY['quote_service_request','transition_service_request'] LOOP
  SELECT pg_get_functiondef(p.oid) INTO definition FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname=name LIMIT 1;
  definition:=replace(definition,'ARRAY[''manager'',''sindico'',''professor'']','ARRAY[''manager'',''sindico'']');
  EXECUTE definition;
 END LOOP;
END $service_roles$;
ALTER TABLE public.student_safety_onboarding ADD COLUMN IF NOT EXISTS review_notes text;
CREATE OR REPLACE FUNCTION public.review_student_safety_decision(p_queue uuid,p_decision text,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.treinos_ia_fila;
BEGIN
 SELECT * INTO q FROM public.treinos_ia_fila WHERE id=p_queue FOR UPDATE;
 IF q.id IS NULL OR NOT app_private.student_role(q.aluno_id,ARRAY['manager','professor']) THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
 IF q.status<>'pendente' OR p_decision NOT IN('aprovado','rejeitado') OR length(btrim(coalesce(p_reason,'')))<3 THEN RAISE EXCEPTION 'Informe decisão e justificativa'; END IF;
 PERFORM public.review_student_safety(p_queue,p_decision);
 UPDATE public.student_safety_onboarding SET review_notes=left(p_reason,2000) WHERE aluno_id=q.aluno_id AND organization_id=q.organization_id;
 INSERT INTO public.user_access_audit(user_id,organization_id,event,metadata) VALUES(auth.uid(),q.organization_id,'admin_action',jsonb_build_object('action','safety_review','queue',q.id,'decision',p_decision,'clinical_reason_recorded',true));
END; $$;
CREATE OR REPLACE FUNCTION public.student_workout()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE student public.alunos;workout public.treinos;today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;exercises jsonb;session_row jsonb;
BEGIN
 IF NOT app_private.session_valid() THEN RAISE EXCEPTION 'Entre novamente para consultar o treino' USING ERRCODE='42501'; END IF;
 SELECT * INTO STRICT student FROM public.alunos WHERE user_id=auth.uid();
 IF NOT app_private.own_student(student.id) OR NOT app_private.resident_active(student.status,student.lifecycle_status::text) OR NOT public.student_is_safe_for_workout(student.id) THEN
  RETURN jsonb_build_object('treino',NULL,'exercicios','[]'::jsonb,'session',NULL,'data',today,'reason','Seu cadastro ou sua triagem precisa de liberação antes do treino.');
 END IF;
 SELECT * INTO workout FROM public.treinos t WHERE t.aluno_id=student.id AND t.organization_id=student.organization_id AND t.status='ativo' AND t.data_inicio<=today AND (t.data_fim IS NULL OR t.data_fim>=today) AND t.plano_treino_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.workout_publications p WHERE p.treino_id=t.id) ORDER BY t.data_inicio DESC,t.created_at DESC,t.id LIMIT 1;
 IF NOT FOUND THEN RETURN jsonb_build_object('treino',NULL,'exercicios','[]'::jsonb,'session',NULL,'data',today,'reason','Seu coach ainda não publicou um treino liberado para hoje.'); END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',pe.id,'nome',e.nome,'series',pe.series,'repeticoes',pe.repeticoes,'carga_kg',pe.carga_kg,'descanso_seg',pe.descanso_seg,'observacoes',pe.observacoes,'instrucoes',e.instrucoes,'video_url',e.video_url,'ordem',pe.ordem) ORDER BY pe.ordem),'[]'::jsonb) INTO exercises FROM public.plano_exercicios pe JOIN public.exercicios_biblioteca e ON e.id=pe.exercicio_id WHERE pe.plano_treino_id=workout.plano_treino_id AND pe.dia_semana=extract(isodow FROM today)::integer AND pe.semana=((today-workout.data_inicio)/7)+1;
 SELECT to_jsonb(s) INTO session_row FROM public.workout_sessions s WHERE s.treino_id=workout.id AND s.aluno_id=student.id AND s.data=today;
 RETURN jsonb_build_object('treino',to_jsonb(workout),'exercicios',exercises,'session',session_row,'data',today);
EXCEPTION WHEN no_data_found THEN RAISE EXCEPTION 'Seu cadastro ainda não está vinculado'; WHEN too_many_rows THEN RAISE EXCEPTION 'Há mais de um cadastro vinculado; solicite revisão ao administrador';
END; $$;
-- Public enrollment is an explicit condominium setting. An email alone is not a membership.
DO $entry$
DECLARE definition text;patched text;
BEGIN
 SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE oid='public.start_resident_onboarding(uuid,text,text,text)'::regprocedure;
 patched:=regexp_replace(definition,'(?i)\mBEGIN\M','BEGIN
 IF NOT app_private.session_valid() THEN RAISE EXCEPTION ''Entre novamente para continuar'' USING ERRCODE=''42501''; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.organization_members m WHERE m.organization_id=p_organization_id AND m.user_id=auth.uid() AND m.papel::text=''user'')
 AND NOT EXISTS(SELECT 1 FROM public.organizations o WHERE o.id=p_organization_id AND o.status=''ativo'' AND o.metadata->''features''->>''public_signup''=''true'') THEN
 RAISE EXCEPTION ''Este condomínio usa convites. Solicite seu link à administração.'' USING ERRCODE=''42501'';
 END IF;','');
 patched:=replace(patched,'nome,email,unidade,status,tipo)','nome,email,unidade,status,lifecycle_status,tipo)');
 patched:=replace(patched,'''ativo'',''presencial'') RETURNING * INTO v;','''ativo'',''ativo''::public.pessoa_status,''presencial'') RETURNING * INTO v;');
 EXECUTE patched;
END $entry$;
CREATE OR REPLACE FUNCTION public.resident_entry_options()
RETURNS TABLE(id uuid,nome text,requires_invitation boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT o.id,o.nome::text,coalesce(o.metadata->'features'->>'public_signup','false')<>'true'
 FROM public.organizations o WHERE o.tipo='condominio' AND o.status='ativo' ORDER BY o.nome;
$$;
REVOKE ALL ON FUNCTION public.resident_entry_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resident_entry_options() TO anon,authenticated;
-- Safety eligibility is an internal clinical predicate, not a public lookup.
REVOKE EXECUTE ON FUNCTION public.student_is_safe_for_workout(uuid) FROM PUBLIC,anon,authenticated;
COMMIT;
