BEGIN;

-- A resident edits only the whitelisted profile RPC, never billing/status columns.
DROP POLICY IF EXISTS tenant_update ON public.alunos;
CREATE POLICY tenant_update ON public.alunos FOR UPDATE TO authenticated
 USING(app_private.org_role(organization_id,ARRAY['admin','manager']))
 WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager']));
DROP POLICY IF EXISTS persona_select ON public.area_reservations;
CREATE POLICY persona_select ON public.area_reservations FOR SELECT TO authenticated
 USING(app_private.own_student(aluno_id) OR app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));

-- Configuration is opt-in: a generic enum is not proof that an area or service exists.
CREATE OR REPLACE FUNCTION app_private.catalog_enabled(p_org uuid,p_kind text,p_item text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce((SELECT o.status='ativo' AND
   jsonb_typeof(o.metadata->'operational_catalog'->p_kind)='array' AND
   (o.metadata->'operational_catalog'->p_kind) ? p_item
 FROM public.organizations o WHERE o.id=p_org),false);
$$;
REVOKE ALL ON FUNCTION app_private.catalog_enabled(uuid,text,text) FROM PUBLIC,anon,authenticated;

-- Preserve replay semantics: an existing request is still retrievable after disabling its catalog item.
DO $catalog_guards$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.reserve_common_area(uuid,uuid,text,text,timestamptz,timestamptz)'::regprocedure) INTO definition;
 IF position('r:=public.create_area_reservation(' IN definition)=0 THEN RAISE EXCEPTION 'Definição de reserva incompatível; revisar implantação'; END IF;
 definition:=replace(definition,'r:=public.create_area_reservation(',
  'IF NOT app_private.catalog_enabled(p_organization_id,''areas'',p_area_type) THEN RAISE EXCEPTION ''Área não disponibilizada pelo condomínio''; END IF; r:=public.create_area_reservation(');
 EXECUTE definition;
 SELECT pg_get_functiondef('public.submit_service_request(uuid,uuid,text,timestamptz,text)'::regprocedure) INTO definition;
 IF position('SELECT a.id INTO student FROM public.alunos a' IN definition)=0 THEN RAISE EXCEPTION 'Definição de serviço incompatível; revisar implantação'; END IF;
 definition:=replace(definition,'SELECT a.id INTO student FROM public.alunos a',
  'IF NOT app_private.catalog_enabled(p_organization_id,''services'',p_service_type) THEN RAISE EXCEPTION ''Serviço não disponibilizado pelo condomínio''; END IF; SELECT a.id INTO student FROM public.alunos a');
 EXECUTE definition;
END $catalog_guards$;

CREATE OR REPLACE FUNCTION public.organization_operation_readiness(p_org_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.organizations; checks jsonb; today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 IF NOT app_private.org_role(p_org_id,ARRAY['admin','manager']) THEN
  RAISE EXCEPTION 'Sem permissão para preparar este condomínio' USING ERRCODE='42501';
 END IF;
 SELECT * INTO o FROM public.organizations WHERE id=p_org_id;
 IF NOT FOUND OR o.tipo::text<>'condominio' THEN RAISE EXCEPTION 'Selecione um condomínio'; END IF;
 WITH facts(key,label,detail,amount,required) AS (VALUES
  ('active','Condomínio ativo','Configurações: mantenha o condomínio ativo.',CASE WHEN o.status='ativo' THEN 1 ELSE 0 END::bigint,true),
  ('syndic','Síndico com conta ativa','Contas e vínculos: associe a conta real do síndico.',
   (SELECT count(*) FROM public.organization_members m JOIN auth.users u ON u.id=m.user_id JOIN public.profiles p ON p.id=u.id WHERE m.organization_id=p_org_id AND m.papel::text='sindico' AND p.ativo IS NOT FALSE AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<now())),true),
  ('coach','Coach vinculado e profissional ativo','Contas e vínculos e Profissionais: a mesma conta precisa dos dois cadastros.',
   (SELECT count(DISTINCT m.user_id) FROM public.organization_members m JOIN public.funcionarios f ON f.user_id=m.user_id AND f.organization_id=m.organization_id JOIN auth.users u ON u.id=m.user_id JOIN public.profiles p ON p.id=u.id WHERE m.organization_id=p_org_id AND m.papel::text='professor' AND f.ativo=true AND f.cargo IN('professor','personal') AND p.ativo IS NOT FALSE AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<now())),true),
  ('residents','Morador ativo com acesso','Contas e vínculos: conclua o vínculo do primeiro morador real.',
   (SELECT count(*) FROM public.alunos a JOIN auth.users u ON u.id=a.user_id JOIN public.profiles p ON p.id=u.id WHERE a.organization_id=p_org_id AND app_private.resident_active(a.status,a.lifecycle_status::text) AND p.ativo IS NOT FALSE AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<now()) AND EXISTS(SELECT 1 FROM public.organization_members m WHERE m.user_id=a.user_id AND m.organization_id=p_org_id AND m.papel::text='user')),true),
  ('workout','Morador com consentimento, triagem e treino publicado','Morador: concluir triagem. Coach: avaliar e publicar treino com exercícios.',
   (SELECT count(DISTINCT a.id) FROM public.alunos a JOIN public.student_safety_onboarding s ON s.aluno_id=a.id AND s.organization_id=p_org_id JOIN public.treinos t ON t.aluno_id=a.id AND t.organization_id=p_org_id WHERE a.organization_id=p_org_id AND app_private.resident_active(a.status,a.lifecycle_status::text) AND a.user_id IS NOT NULL AND s.consent_version IS NOT NULL AND public.student_is_safe_for_workout(a.id) AND t.status='ativo' AND t.data_inicio<=today AND (t.data_fim IS NULL OR t.data_fim>=today) AND EXISTS(SELECT 1 FROM public.workout_publications w WHERE w.treino_id=t.id) AND EXISTS(SELECT 1 FROM public.plano_exercicios e WHERE e.plano_treino_id=t.plano_treino_id)),true),
  ('classes','Aula futura com profissional ativo','Agenda: cadastre uma aula real com profissional vinculado.',
   (SELECT count(*) FROM public.aulas c JOIN public.funcionarios f ON f.id=c.professor_id AND f.organization_id=p_org_id WHERE c.organization_id=p_org_id AND c.data_aula>=today AND c.status<>'cancelada' AND c.capacidade_maxima>0 AND f.ativo=true AND EXISTS(SELECT 1 FROM public.organization_members m WHERE m.user_id=f.user_id AND m.organization_id=p_org_id AND m.papel::text='professor')),true),
  ('events','Health Day publicado e futuro','Síndico: cadastre e publique o evento contratado.',
   (SELECT count(*) FROM public.eventos_condominio e WHERE e.organization_id=p_org_id AND e.status='publicado' AND e.ativo=true AND e.data_evento>=today AND e.vagas_totais>0),true),
  ('facilities','Infraestrutura revisada e aprovada','Operação NINE LIVING: registre e revise a infraestrutura real.',
   (SELECT count(*) FROM public.organization_facilities f WHERE f.organization_id=p_org_id AND f.status='aprovado'),true),
  ('areas','Área real liberada para reservas','Configurações: selecione somente as áreas autorizadas.',
   (SELECT count(*) FROM unnest(ARRAY['academia','quadra','piscina','brinquedoteca','salao','outro']) v WHERE app_private.catalog_enabled(p_org_id,'areas',v)),true),
  ('services','Serviço disponível para solicitação','Configurações: selecione somente serviços que a operação pode atender.',
   (SELECT count(*) FROM unnest(ARRAY['personal','nutricao','avaliacao','aula_particular','evento']) v WHERE app_private.catalog_enabled(p_org_id,'services',v)),true),
  ('support','Responsável, contato e horário de suporte','Operação NINE LIVING: informe responsável, horário e WhatsApp válido com DDI.',
   CASE WHEN length(regexp_replace(coalesce(o.operational_profile->>'support_phone',''),'[^0-9]','','g')) BETWEEN 10 AND 15 AND nullif(btrim(o.operational_profile->>'responsavel'),'') IS NOT NULL AND nullif(btrim(o.operational_profile->>'support_hours'),'') IS NOT NULL THEN 1 ELSE 0 END::bigint,true),
  ('playbook','Playbook existente e concluído','Operação NINE LIVING: gere e conclua os passos com evidências reais.',
   CASE WHEN EXISTS(SELECT 1 FROM public.organization_implementation_steps s WHERE s.organization_id=p_org_id) AND NOT EXISTS(SELECT 1 FROM public.organization_implementation_steps s WHERE s.organization_id=p_org_id AND s.status<>'concluido') THEN 1 ELSE 0 END::bigint,true)
 ) SELECT jsonb_agg(jsonb_build_object('key',key,'label',label,'detail',detail,'count',amount,'required',required,'passed',amount>0)) INTO checks FROM facts;
 RETURN jsonb_build_object('organization_id',p_org_id,'as_of',now(),'version','2026-10-26.2','checks',checks,
  'ready_for_activation',NOT EXISTS(SELECT 1 FROM jsonb_array_elements(checks) c WHERE (c->>'required')::boolean AND NOT (c->>'passed')::boolean));
END; $$;
REVOKE ALL ON FUNCTION public.organization_operation_readiness(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.organization_operation_readiness(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.activate_organization_operation(p_organization_id uuid)
RETURNS public.organizations LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE readiness jsonb; result public.organizations; missing text;
BEGIN
 IF NOT app_private.org_role(p_organization_id,ARRAY['admin','manager']) THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_organization_id::text||':activation',0));
 PERFORM 1 FROM public.organizations WHERE id=p_organization_id FOR UPDATE;
 readiness:=public.organization_operation_readiness(p_organization_id);
 IF NOT (readiness->>'ready_for_activation')::boolean THEN
  SELECT string_agg(c->>'label',', ') INTO missing FROM jsonb_array_elements(readiness->'checks') c WHERE NOT (c->>'passed')::boolean;
  RAISE EXCEPTION 'Operação ainda incompleta: %',missing;
 END IF;
 PERFORM set_config('app.activation_org',p_organization_id::text,true);
 UPDATE public.organizations SET operational_profile=coalesce(operational_profile,'{}'::jsonb)||jsonb_build_object('etapa','operacao','activated_at',now(),'activated_by',auth.uid(),'activation_version',readiness->>'version') WHERE id=p_organization_id RETURNING * INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.activate_organization_operation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.activate_organization_operation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION app_private.guard_operation_activation()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NEW.operational_profile->>'etapa'='operacao'
    AND OLD.operational_profile->>'etapa' IS DISTINCT FROM 'operacao'
    AND current_setting('app.activation_org',true) IS DISTINCT FROM NEW.id::text THEN
  RAISE EXCEPTION 'Use a ativação operacional após concluir os pré-requisitos';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION app_private.guard_operation_activation() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS guard_operation_activation ON public.organizations;
CREATE TRIGGER guard_operation_activation BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION app_private.guard_operation_activation();

-- The syndic receives only the resident name needed to operate a service request.
CREATE OR REPLACE FUNCTION public.operational_service_requests(p_org_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT app_private.org_role(p_org_id,ARRAY['admin','manager','sindico']) THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(r)||jsonb_build_object('alunos',jsonb_build_object('nome',a.nome)) ORDER BY r.created_at DESC) FROM public.service_requests r JOIN public.alunos a ON a.id=r.aluno_id AND a.organization_id=p_org_id WHERE r.organization_id=p_org_id),'[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION public.operational_service_requests(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.operational_service_requests(uuid) TO authenticated;

-- Aggregate operational metrics belong to management, never the resident/coach surface.
CREATE OR REPLACE FUNCTION public.organization_common_area_metrics(p_organization_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT app_private.org_role(p_organization_id,ARRAY['admin','manager','sindico']) THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object(
  'areas',coalesce((SELECT jsonb_agg(to_jsonb(q)) FROM (SELECT r.area_type AS area,count(*) AS reservas,count(*) FILTER(WHERE r.status='concluida') AS concluidas FROM public.area_reservations r WHERE r.organization_id=p_organization_id AND r.starts_at>=now()-interval '30 days' AND r.starts_at<=now() GROUP BY r.area_type) q),'[]'::jsonb),
  'servicos',coalesce((SELECT jsonb_agg(to_jsonb(q)) FROM (SELECT r.service_type AS tipo,count(*) AS total,count(*) FILTER(WHERE r.status IN('solicitada','cotada','confirmada')) AS em_aberto FROM public.service_requests r WHERE r.organization_id=p_organization_id AND r.created_at>=now()-interval '30 days' AND r.created_at<=now() GROUP BY r.service_type) q),'[]'::jsonb));
END; $$;
REVOKE ALL ON FUNCTION public.organization_common_area_metrics(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.organization_common_area_metrics(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_alunos_sem_checkin(p_dias integer DEFAULT 15,p_org_id uuid DEFAULT NULL)
RETURNS TABLE(aluno_id uuid,nome varchar,email varchar,telefone varchar,ultimo_checkin date,dias_ausente integer,plano_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT app_private.session_valid() OR (p_org_id IS NULL AND NOT app_private.admin()) OR (p_org_id IS NOT NULL AND NOT app_private.org_role(p_org_id,ARRAY['admin','manager','professor'])) THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT a.id,a.nome,a.email,a.telefone,max(c.data_checkin)::date,(current_date-coalesce(max(c.data_checkin)::date,a.data_matricula::date))::int,a.plano_id FROM public.alunos a LEFT JOIN public.checkins c ON c.aluno_id=a.id WHERE app_private.resident_active(a.status,a.lifecycle_status::text) AND (p_org_id IS NULL OR a.organization_id=p_org_id) AND app_private.student_role(a.id,ARRAY['admin','manager','professor']) GROUP BY a.id HAVING max(c.data_checkin)<current_date-greatest(p_dias,1) OR max(c.data_checkin) IS NULL ORDER BY max(c.data_checkin) NULLS FIRST;
END; $$;
REVOKE ALL ON FUNCTION public.get_alunos_sem_checkin(integer,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_alunos_sem_checkin(integer,uuid) TO authenticated;
COMMIT;
