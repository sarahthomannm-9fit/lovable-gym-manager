-- Local correction package. Review/deploy separately; no customer data is rewritten.
BEGIN;
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA app_private TO authenticated,service_role;

CREATE OR REPLACE FUNCTION app_private.session_valid()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT (SELECT auth.uid()) IS NOT NULL
 AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=(SELECT auth.uid()) AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=now()))
 AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.ativo=false)
 AND (nullif(auth.jwt()->>'session_id','') IS NULL OR EXISTS(SELECT 1 FROM auth.sessions s WHERE s.id::text=auth.jwt()->>'session_id' AND s.user_id=(SELECT auth.uid())));
$$;
CREATE OR REPLACE FUNCTION app_private.admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.session_valid() AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=(SELECT auth.uid()) AND r.role::text='admin');
$$;
CREATE OR REPLACE FUNCTION app_private.org_role(p_org uuid,p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.session_valid() AND (app_private.admin() OR EXISTS(
 SELECT 1 FROM public.organization_members m JOIN public.organizations o ON o.id=m.organization_id
 WHERE m.organization_id=p_org AND m.user_id=(SELECT auth.uid()) AND o.status='ativo' AND m.papel::text=ANY(p_roles)
 AND (m.papel::text NOT IN('professor','nutricionista','fisioterapeuta') OR EXISTS(
 SELECT 1 FROM public.funcionarios f WHERE f.organization_id=m.organization_id AND f.user_id=m.user_id AND f.ativo=true
 AND ((m.papel::text='professor' AND f.cargo IN('professor','personal')) OR f.cargo=m.papel::text)))));
$$;
CREATE OR REPLACE FUNCTION app_private.org_member(p_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.org_role(p_org,ARRAY['admin','manager','sindico','professor','corporate','user','nutricionista','fisioterapeuta']);
$$;
CREATE OR REPLACE FUNCTION app_private.own_student(p_student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.session_valid() AND EXISTS(SELECT 1 FROM public.alunos a JOIN public.organizations o ON o.id=a.organization_id WHERE a.id=p_student AND a.user_id=(SELECT auth.uid()) AND o.status='ativo');
$$;
CREATE OR REPLACE FUNCTION app_private.student_role(p_student uuid,p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.admin() OR EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=p_student AND app_private.org_role(a.organization_id,p_roles));
$$;
CREATE OR REPLACE FUNCTION app_private.student_matches(p_student uuid,p_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.session_valid() AND EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=p_student AND a.organization_id=p_org);
$$;

-- The shared authorization helper also rejects inactive coaches and revoked sessions.
CREATE OR REPLACE FUNCTION public.persona_has_role(p_org uuid,p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.org_role(p_org,p_roles);
$$;

-- Remove ALL policies for the audited scope, not merely the latest policy name.
-- Permissive policies combine by OR, so retaining one old allow-all defeats isolation.
DO $policies$
DECLARE t text;p record;
BEGIN
 FOREACH t IN ARRAY ARRAY[
 'alunos','pagamentos','checkins','aulas','aulas_inscritos','aulas_experimentais','treinos','avaliacoes_fisicas',
 'historico_planos','alunos_planos','assinaturas','entitlements','frequencia_alunos','notificacoes',
 'organization_members','user_roles','profiles','usuarios','system_events','pessoa_eventos',
 'planos','skus','sku_permissions','formas_pagamento','config_notificacoes','produtos','promocoes','analises_produto','follow_ups'
 ] LOOP
  IF to_regclass('public.'||t) IS NULL THEN RAISE EXCEPTION 'Required table missing: %',t; END IF;
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
   EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t);
  END LOOP;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon',t);
  EXECUTE format('REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.%I FROM authenticated',t);
 END LOOP;
END $policies$;

CREATE POLICY tenant_select ON public.alunos FOR SELECT TO authenticated USING((app_private.own_student(id) OR app_private.org_role(organization_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta'])));
CREATE POLICY tenant_insert ON public.alunos FOR INSERT TO authenticated WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager']));
CREATE POLICY tenant_update ON public.alunos FOR UPDATE TO authenticated USING((app_private.own_student(id) OR app_private.org_role(organization_id,ARRAY['admin','manager']))) WITH CHECK((app_private.own_student(id) OR app_private.org_role(organization_id,ARRAY['admin','manager'])));
CREATE POLICY tenant_delete ON public.alunos FOR DELETE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager']));

CREATE POLICY tenant_select ON public.pagamentos FOR SELECT TO authenticated USING((app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager','sindico'])));
CREATE POLICY tenant_insert ON public.pagamentos FOR INSERT TO authenticated WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY tenant_update ON public.pagamentos FOR UPDATE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager'])) WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY tenant_delete ON public.pagamentos FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.historico_planos FOR SELECT TO authenticated USING((app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager'])));
CREATE POLICY tenant_insert ON public.historico_planos FOR INSERT TO authenticated WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY tenant_update ON public.historico_planos FOR UPDATE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager'])) WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY tenant_delete ON public.historico_planos FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.alunos_planos FOR SELECT TO authenticated USING((app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager'])));
CREATE POLICY tenant_insert ON public.alunos_planos FOR INSERT TO authenticated WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY tenant_update ON public.alunos_planos FOR UPDATE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager'])) WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY tenant_delete ON public.alunos_planos FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.assinaturas FOR SELECT TO authenticated USING((app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager'])));
CREATE POLICY tenant_insert ON public.assinaturas FOR INSERT TO authenticated WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY tenant_update ON public.assinaturas FOR UPDATE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager'])) WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY tenant_delete ON public.assinaturas FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.entitlements FOR SELECT TO authenticated USING((app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager'])));
CREATE POLICY tenant_insert ON public.entitlements FOR INSERT TO authenticated WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY tenant_update ON public.entitlements FOR UPDATE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager'])) WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY tenant_delete ON public.entitlements FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.checkins FOR SELECT TO authenticated USING((app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager','professor'])));
CREATE POLICY tenant_insert ON public.checkins FOR INSERT TO authenticated WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta']));
CREATE POLICY tenant_update ON public.checkins FOR UPDATE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta'])) WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta']));
CREATE POLICY tenant_delete ON public.checkins FOR DELETE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager']));

CREATE POLICY tenant_select ON public.frequencia_alunos FOR SELECT TO authenticated USING((app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager','professor'])));
CREATE POLICY tenant_insert ON public.frequencia_alunos FOR INSERT TO authenticated WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta']));
CREATE POLICY tenant_update ON public.frequencia_alunos FOR UPDATE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta'])) WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta']));
CREATE POLICY tenant_delete ON public.frequencia_alunos FOR DELETE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager']));

CREATE POLICY tenant_select ON public.avaliacoes_fisicas FOR SELECT TO authenticated USING((app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta'])));
CREATE POLICY tenant_insert ON public.avaliacoes_fisicas FOR INSERT TO authenticated WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta']));
CREATE POLICY tenant_update ON public.avaliacoes_fisicas FOR UPDATE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta'])) WITH CHECK(app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta']));
CREATE POLICY tenant_delete ON public.avaliacoes_fisicas FOR DELETE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager']));

CREATE POLICY tenant_select ON public.aulas FOR SELECT TO authenticated USING(app_private.org_member(organization_id));
CREATE POLICY tenant_insert ON public.aulas FOR INSERT TO authenticated WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager']));
CREATE POLICY tenant_update ON public.aulas FOR UPDATE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager'])) WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager']));
CREATE POLICY tenant_delete ON public.aulas FOR DELETE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager']));

CREATE POLICY tenant_select ON public.aulas_experimentais FOR SELECT TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','professor']));
CREATE POLICY tenant_insert ON public.aulas_experimentais FOR INSERT TO authenticated WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','professor']));
CREATE POLICY tenant_update ON public.aulas_experimentais FOR UPDATE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','professor'])) WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','professor']));
CREATE POLICY tenant_delete ON public.aulas_experimentais FOR DELETE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager']));

CREATE POLICY tenant_select ON public.aulas_inscritos FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.aulas c WHERE c.id=aula_id AND app_private.student_matches(aluno_id,c.organization_id) AND (app_private.own_student(aluno_id) OR app_private.org_role(c.organization_id,ARRAY['admin','manager','professor']))));
CREATE POLICY tenant_insert ON public.aulas_inscritos FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.aulas c WHERE c.id=aula_id AND app_private.student_matches(aluno_id,c.organization_id) AND (app_private.own_student(aluno_id) OR app_private.org_role(c.organization_id,ARRAY['admin','manager','professor']))));
CREATE POLICY tenant_update ON public.aulas_inscritos FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.aulas c WHERE c.id=aula_id AND app_private.student_matches(aluno_id,c.organization_id) AND (app_private.own_student(aluno_id) OR app_private.org_role(c.organization_id,ARRAY['admin','manager','professor'])))) WITH CHECK(EXISTS(SELECT 1 FROM public.aulas c WHERE c.id=aula_id AND app_private.student_matches(aluno_id,c.organization_id) AND (app_private.own_student(aluno_id) OR app_private.org_role(c.organization_id,ARRAY['admin','manager','professor']))));
CREATE POLICY tenant_delete ON public.aulas_inscritos FOR DELETE TO authenticated USING(app_private.student_role(aluno_id,ARRAY['admin','manager']));

CREATE POLICY tenant_select ON public.treinos FOR SELECT TO authenticated USING((app_private.own_student(aluno_id) OR app_private.org_role(organization_id,ARRAY['admin','manager','professor'])) AND app_private.student_matches(aluno_id,organization_id));
CREATE POLICY tenant_insert ON public.treinos FOR INSERT TO authenticated WITH CHECK((app_private.student_matches(aluno_id,organization_id) AND app_private.org_role(organization_id,ARRAY['admin','manager','professor'])));
CREATE POLICY tenant_update ON public.treinos FOR UPDATE TO authenticated USING((app_private.student_matches(aluno_id,organization_id) AND app_private.org_role(organization_id,ARRAY['admin','manager','professor']))) WITH CHECK((app_private.student_matches(aluno_id,organization_id) AND app_private.org_role(organization_id,ARRAY['admin','manager','professor'])));
CREATE POLICY tenant_delete ON public.treinos FOR DELETE TO authenticated USING((app_private.student_matches(aluno_id,organization_id) AND app_private.org_role(organization_id,ARRAY['admin','manager','professor'])));

CREATE POLICY tenant_select ON public.notificacoes FOR SELECT TO authenticated USING(((destinatario_tipo='aluno' AND (app_private.own_student(destinatario_id) OR app_private.student_role(destinatario_id,ARRAY['admin','manager','professor','sindico']))) OR (SELECT app_private.admin()) OR (destinatario_tipo IN('user','professor') AND destinatario_id=(SELECT auth.uid()) AND app_private.session_valid())));
CREATE POLICY tenant_insert ON public.notificacoes FOR INSERT TO authenticated WITH CHECK((destinatario_tipo='aluno' AND app_private.student_role(destinatario_id,ARRAY['admin','manager','professor','sindico'])));
CREATE POLICY tenant_update ON public.notificacoes FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.notificacoes FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.organization_members FOR SELECT TO authenticated USING((user_id=(SELECT auth.uid()) AND app_private.session_valid()) OR (SELECT app_private.admin()));
CREATE POLICY tenant_insert ON public.organization_members FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.organization_members FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.organization_members FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.user_roles FOR SELECT TO authenticated USING((user_id=(SELECT auth.uid()) AND app_private.session_valid()) OR (SELECT app_private.admin()));
CREATE POLICY tenant_insert ON public.user_roles FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.user_roles FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.user_roles FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.profiles FOR SELECT TO authenticated USING((id=(SELECT auth.uid()) AND app_private.session_valid()) OR (SELECT app_private.admin()));
CREATE POLICY tenant_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK(id=(SELECT auth.uid()) AND app_private.session_valid());
CREATE POLICY tenant_update ON public.profiles FOR UPDATE TO authenticated USING((id=(SELECT auth.uid()) AND app_private.session_valid()) OR (SELECT app_private.admin())) WITH CHECK((id=(SELECT auth.uid()) AND app_private.session_valid()) OR (SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.profiles FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.usuarios FOR SELECT TO authenticated USING((SELECT app_private.admin()));
CREATE POLICY tenant_insert ON public.usuarios FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.usuarios FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.usuarios FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.system_events FOR SELECT TO authenticated USING((SELECT app_private.admin()));
CREATE POLICY tenant_insert ON public.system_events FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.system_events FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.system_events FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.pessoa_eventos FOR SELECT TO authenticated USING((app_private.own_student(pessoa_id) OR app_private.student_role(pessoa_id,ARRAY['admin','manager','professor'])));
CREATE POLICY tenant_insert ON public.pessoa_eventos FOR INSERT TO authenticated WITH CHECK(app_private.student_role(pessoa_id,ARRAY['admin','manager']));
CREATE POLICY tenant_update ON public.pessoa_eventos FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.pessoa_eventos FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.planos FOR SELECT TO authenticated USING((SELECT app_private.admin()) OR (app_private.session_valid() AND EXISTS(SELECT 1 FROM public.organization_members m WHERE m.user_id=(SELECT auth.uid()) AND app_private.org_member(m.organization_id))));
CREATE POLICY tenant_insert ON public.planos FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.planos FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.planos FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.skus FOR SELECT TO authenticated USING((SELECT app_private.admin()) OR (app_private.session_valid() AND EXISTS(SELECT 1 FROM public.organization_members m WHERE m.user_id=(SELECT auth.uid()) AND app_private.org_member(m.organization_id))));
CREATE POLICY tenant_insert ON public.skus FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.skus FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.skus FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.sku_permissions FOR SELECT TO authenticated USING((SELECT app_private.admin()) OR (app_private.session_valid() AND EXISTS(SELECT 1 FROM public.organization_members m WHERE m.user_id=(SELECT auth.uid()) AND app_private.org_member(m.organization_id))));
CREATE POLICY tenant_insert ON public.sku_permissions FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.sku_permissions FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.sku_permissions FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.formas_pagamento FOR SELECT TO authenticated USING((SELECT app_private.admin()) OR (app_private.session_valid() AND EXISTS(SELECT 1 FROM public.organization_members m WHERE m.user_id=(SELECT auth.uid()) AND app_private.org_member(m.organization_id))));
CREATE POLICY tenant_insert ON public.formas_pagamento FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.formas_pagamento FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.formas_pagamento FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.config_notificacoes FOR SELECT TO authenticated USING((SELECT app_private.admin()));
CREATE POLICY tenant_insert ON public.config_notificacoes FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.config_notificacoes FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.config_notificacoes FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.produtos FOR SELECT TO authenticated USING((SELECT app_private.admin()));
CREATE POLICY tenant_insert ON public.produtos FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.produtos FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.produtos FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.promocoes FOR SELECT TO authenticated USING((SELECT app_private.admin()));
CREATE POLICY tenant_insert ON public.promocoes FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.promocoes FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.promocoes FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.analises_produto FOR SELECT TO authenticated USING((SELECT app_private.admin()));
CREATE POLICY tenant_insert ON public.analises_produto FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_update ON public.analises_produto FOR UPDATE TO authenticated USING((SELECT app_private.admin())) WITH CHECK((SELECT app_private.admin()));
CREATE POLICY tenant_delete ON public.analises_produto FOR DELETE TO authenticated USING((SELECT app_private.admin()));

CREATE POLICY tenant_select ON public.follow_ups FOR SELECT TO authenticated USING((SELECT app_private.admin()) OR EXISTS(SELECT 1 FROM public.leads l WHERE l.id=lead_id AND app_private.org_role(l.organization_id,ARRAY['admin','manager'])) OR EXISTS(SELECT 1 FROM public.propostas_b2b p WHERE p.id=proposal_id AND app_private.org_role(p.organization_id,ARRAY['admin','manager'])));
CREATE POLICY tenant_insert ON public.follow_ups FOR INSERT TO authenticated WITH CHECK((SELECT app_private.admin()) OR EXISTS(SELECT 1 FROM public.leads l WHERE l.id=lead_id AND app_private.org_role(l.organization_id,ARRAY['admin','manager'])) OR EXISTS(SELECT 1 FROM public.propostas_b2b p WHERE p.id=proposal_id AND app_private.org_role(p.organization_id,ARRAY['admin','manager'])));
CREATE POLICY tenant_update ON public.follow_ups FOR UPDATE TO authenticated USING((SELECT app_private.admin()) OR EXISTS(SELECT 1 FROM public.leads l WHERE l.id=lead_id AND app_private.org_role(l.organization_id,ARRAY['admin','manager'])) OR EXISTS(SELECT 1 FROM public.propostas_b2b p WHERE p.id=proposal_id AND app_private.org_role(p.organization_id,ARRAY['admin','manager']))) WITH CHECK((SELECT app_private.admin()) OR EXISTS(SELECT 1 FROM public.leads l WHERE l.id=lead_id AND app_private.org_role(l.organization_id,ARRAY['admin','manager'])) OR EXISTS(SELECT 1 FROM public.propostas_b2b p WHERE p.id=proposal_id AND app_private.org_role(p.organization_id,ARRAY['admin','manager'])));
CREATE POLICY tenant_delete ON public.follow_ups FOR DELETE TO authenticated USING((SELECT app_private.admin()) OR EXISTS(SELECT 1 FROM public.leads l WHERE l.id=lead_id AND app_private.org_role(l.organization_id,ARRAY['admin','manager'])) OR EXISTS(SELECT 1 FROM public.propostas_b2b p WHERE p.id=proposal_id AND app_private.org_role(p.organization_id,ARRAY['admin','manager'])));

-- Legacy password hashes remain unavailable even to an authenticated table SELECT.
REVOKE SELECT ON public.usuarios FROM authenticated;
GRANT SELECT(id,nome,email,tipo,created_at,updated_at) ON public.usuarios TO authenticated;

CREATE OR REPLACE FUNCTION app_private.prevent_reassignment()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE key text;
BEGIN
 IF current_user<>'authenticated' THEN RETURN NEW; END IF;
 FOREACH key IN ARRAY ARRAY['organization_id','aluno_id','user_id','aula_id','lead_id','proposal_id','professor_id','destinatario_id','destinatario_tipo'] LOOP
  IF (to_jsonb(NEW)->key) IS DISTINCT FROM (to_jsonb(OLD)->key) THEN
   RAISE EXCEPTION 'Use o fluxo administrativo de vínculo; não é permitido transferir este registro' USING ERRCODE='42501';
  END IF;
 END LOOP;
 RETURN NEW;
END; $$;
DO $identity$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['alunos','treinos','pagamentos','checkins','aulas_inscritos','avaliacoes_fisicas','alunos_planos','historico_planos','assinaturas','entitlements','follow_ups','notificacoes'] LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS prevent_tenant_reassignment ON public.%I',t);
  EXECUTE format('CREATE TRIGGER prevent_tenant_reassignment BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION app_private.prevent_reassignment()',t);
 END LOOP;
END $identity$;

-- Profile owners cannot reactivate themselves or alter operational audit fields.
CREATE OR REPLACE FUNCTION app_private.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF OLD.id=auth.uid() AND OLD.ativo IS DISTINCT FROM false AND NEW.ativo=false THEN RAISE EXCEPTION 'Você não pode desativar o próprio acesso'; END IF;
 IF current_user='authenticated' AND NOT app_private.admin() AND
 (to_jsonb(NEW)-ARRAY['nome','telefone','avatar_url','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['nome','telefone','avatar_url','updated_at']) THEN
  RAISE EXCEPTION 'Campo de perfil reservado à administração' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION app_private.protect_profile_fields();

CREATE INDEX IF NOT EXISTS organization_members_user_org_role_idx ON public.organization_members(user_id,organization_id,papel);
CREATE INDEX IF NOT EXISTS funcionarios_org_user_active_idx ON public.funcionarios(organization_id,user_id) WHERE ativo=true;
CREATE INDEX IF NOT EXISTS alunos_org_status_lifecycle_idx ON public.alunos(organization_id,status,lifecycle_status);
CREATE INDEX IF NOT EXISTS checkins_student_date_idx ON public.checkins(aluno_id,data_checkin);
CREATE INDEX IF NOT EXISTS pagamentos_student_status_due_idx ON public.pagamentos(aluno_id,status,data_vencimento);

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC,anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_private TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.persona_has_role(uuid,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.persona_has_role(uuid,text[]) TO authenticated;
-- Clinical and operational tables share the same current-membership rules.

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='student_safety_onboarding' LOOP EXECUTE format('DROP POLICY %I ON public.student_safety_onboarding',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.student_safety_onboarding ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_safety_onboarding FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.student_safety_onboarding FROM authenticated;
CREATE POLICY persona_select ON public.student_safety_onboarding FOR SELECT TO authenticated USING(app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta']));
CREATE POLICY persona_insert ON public.student_safety_onboarding FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY persona_update ON public.student_safety_onboarding FOR UPDATE TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY persona_delete ON public.student_safety_onboarding FOR DELETE TO authenticated USING(false);

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='anamnese_respostas' LOOP EXECUTE format('DROP POLICY %I ON public.anamnese_respostas',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.anamnese_respostas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.anamnese_respostas FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.anamnese_respostas FROM authenticated;
CREATE POLICY persona_select ON public.anamnese_respostas FOR SELECT TO authenticated USING(app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta']));
CREATE POLICY persona_insert ON public.anamnese_respostas FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY persona_update ON public.anamnese_respostas FOR UPDATE TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY persona_delete ON public.anamnese_respostas FOR DELETE TO authenticated USING(false);

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='treinos_ia_fila' LOOP EXECUTE format('DROP POLICY %I ON public.treinos_ia_fila',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.treinos_ia_fila ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.treinos_ia_fila FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.treinos_ia_fila FROM authenticated;
CREATE POLICY persona_select ON public.treinos_ia_fila FOR SELECT TO authenticated USING(app_private.student_matches(aluno_id,organization_id) AND app_private.org_role(organization_id,ARRAY['admin','manager','professor']));
CREATE POLICY persona_insert ON public.treinos_ia_fila FOR INSERT TO authenticated WITH CHECK(app_private.student_matches(aluno_id,organization_id) AND app_private.org_role(organization_id,ARRAY['admin','manager','professor']));
CREATE POLICY persona_update ON public.treinos_ia_fila FOR UPDATE TO authenticated USING(app_private.student_matches(aluno_id,organization_id) AND app_private.org_role(organization_id,ARRAY['admin','manager','professor'])) WITH CHECK(app_private.student_matches(aluno_id,organization_id) AND app_private.org_role(organization_id,ARRAY['admin','manager','professor']));
CREATE POLICY persona_delete ON public.treinos_ia_fila FOR DELETE TO authenticated USING(app_private.student_matches(aluno_id,organization_id) AND app_private.org_role(organization_id,ARRAY['admin','manager','professor']));

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='workout_sessions' LOOP EXECUTE format('DROP POLICY %I ON public.workout_sessions',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workout_sessions FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.workout_sessions FROM authenticated;
CREATE POLICY persona_select ON public.workout_sessions FOR SELECT TO authenticated USING(app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager','professor']));
CREATE POLICY persona_insert ON public.workout_sessions FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY persona_update ON public.workout_sessions FOR UPDATE TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY persona_delete ON public.workout_sessions FOR DELETE TO authenticated USING(false);

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='treino_execucoes' LOOP EXECUTE format('DROP POLICY %I ON public.treino_execucoes',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.treino_execucoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.treino_execucoes FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.treino_execucoes FROM authenticated;
CREATE POLICY persona_select ON public.treino_execucoes FOR SELECT TO authenticated USING(app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager','professor']));
CREATE POLICY persona_insert ON public.treino_execucoes FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY persona_update ON public.treino_execucoes FOR UPDATE TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY persona_delete ON public.treino_execucoes FOR DELETE TO authenticated USING(false);

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='planos_treino' LOOP EXECUTE format('DROP POLICY %I ON public.planos_treino',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.planos_treino ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.planos_treino FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.planos_treino FROM authenticated;
CREATE POLICY persona_select ON public.planos_treino FOR SELECT TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','professor']) OR EXISTS(SELECT 1 FROM public.treinos t WHERE t.plano_treino_id=planos_treino.id AND app_private.own_student(t.aluno_id)) OR (organization_id IS NULL AND publico=true AND ativo=true AND app_private.session_valid()));
CREATE POLICY persona_insert ON public.planos_treino FOR INSERT TO authenticated WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','professor']));
CREATE POLICY persona_update ON public.planos_treino FOR UPDATE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','professor'])) WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','professor']));
CREATE POLICY persona_delete ON public.planos_treino FOR DELETE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','professor']));

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='plano_exercicios' LOOP EXECUTE format('DROP POLICY %I ON public.plano_exercicios',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.plano_exercicios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.plano_exercicios FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.plano_exercicios FROM authenticated;
CREATE POLICY persona_select ON public.plano_exercicios FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.planos_treino p WHERE p.id=plano_treino_id));
CREATE POLICY persona_insert ON public.plano_exercicios FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.planos_treino p WHERE p.id=plano_treino_id AND app_private.org_role(p.organization_id,ARRAY['admin','manager','professor'])));
CREATE POLICY persona_update ON public.plano_exercicios FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.planos_treino p WHERE p.id=plano_treino_id AND app_private.org_role(p.organization_id,ARRAY['admin','manager','professor']))) WITH CHECK(EXISTS(SELECT 1 FROM public.planos_treino p WHERE p.id=plano_treino_id AND app_private.org_role(p.organization_id,ARRAY['admin','manager','professor'])));
CREATE POLICY persona_delete ON public.plano_exercicios FOR DELETE TO authenticated USING(EXISTS(SELECT 1 FROM public.planos_treino p WHERE p.id=plano_treino_id AND app_private.org_role(p.organization_id,ARRAY['admin','manager','professor'])));

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='exercicios_biblioteca' LOOP EXECUTE format('DROP POLICY %I ON public.exercicios_biblioteca',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.exercicios_biblioteca ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exercicios_biblioteca FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.exercicios_biblioteca FROM authenticated;
CREATE POLICY persona_select ON public.exercicios_biblioteca FOR SELECT TO authenticated USING(app_private.admin() OR (app_private.session_valid() AND (organization_id IS NULL OR app_private.org_member(organization_id))));
CREATE POLICY persona_insert ON public.exercicios_biblioteca FOR INSERT TO authenticated WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','professor']));
CREATE POLICY persona_update ON public.exercicios_biblioteca FOR UPDATE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','professor'])) WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','professor']));
CREATE POLICY persona_delete ON public.exercicios_biblioteca FOR DELETE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','professor']));

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='exercise_substitution_rules' LOOP EXECUTE format('DROP POLICY %I ON public.exercise_substitution_rules',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.exercise_substitution_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exercise_substitution_rules FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.exercise_substitution_rules FROM authenticated;
CREATE POLICY persona_select ON public.exercise_substitution_rules FOR SELECT TO authenticated USING(app_private.session_valid() AND EXISTS(SELECT 1 FROM public.exercicios_biblioteca e WHERE e.id=exercise_substitution_rules.exercise_id) AND EXISTS(SELECT 1 FROM public.exercicios_biblioteca e WHERE e.id=exercise_substitution_rules.substitute_exercise_id));
CREATE POLICY persona_insert ON public.exercise_substitution_rules FOR INSERT TO authenticated WITH CHECK(app_private.admin());
CREATE POLICY persona_update ON public.exercise_substitution_rules FOR UPDATE TO authenticated USING(app_private.admin()) WITH CHECK(app_private.admin());
CREATE POLICY persona_delete ON public.exercise_substitution_rules FOR DELETE TO authenticated USING(app_private.admin());

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='organization_facilities' LOOP EXECUTE format('DROP POLICY %I ON public.organization_facilities',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.organization_facilities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.organization_facilities FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.organization_facilities FROM authenticated;
CREATE POLICY persona_select ON public.organization_facilities FOR SELECT TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','sindico','professor']));
CREATE POLICY persona_insert ON public.organization_facilities FOR INSERT TO authenticated WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));
CREATE POLICY persona_update ON public.organization_facilities FOR UPDATE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','sindico'])) WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));
CREATE POLICY persona_delete ON public.organization_facilities FOR DELETE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='eventos_condominio' LOOP EXECUTE format('DROP POLICY %I ON public.eventos_condominio',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.eventos_condominio ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eventos_condominio FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.eventos_condominio FROM authenticated;
CREATE POLICY persona_select ON public.eventos_condominio FOR SELECT TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']) OR (status='publicado' AND ativo=true AND app_private.org_member(organization_id)));
CREATE POLICY persona_insert ON public.eventos_condominio FOR INSERT TO authenticated WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));
CREATE POLICY persona_update ON public.eventos_condominio FOR UPDATE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','sindico'])) WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));
CREATE POLICY persona_delete ON public.eventos_condominio FOR DELETE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='health_day_inscricoes' LOOP EXECUTE format('DROP POLICY %I ON public.health_day_inscricoes',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.health_day_inscricoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.health_day_inscricoes FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.health_day_inscricoes FROM authenticated;
CREATE POLICY persona_select ON public.health_day_inscricoes FOR SELECT TO authenticated USING(app_private.own_student(aluno_id) OR EXISTS(SELECT 1 FROM public.eventos_condominio e WHERE e.id=evento_id AND app_private.org_role(e.organization_id,ARRAY['admin','manager','sindico'])));
CREATE POLICY persona_insert ON public.health_day_inscricoes FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY persona_update ON public.health_day_inscricoes FOR UPDATE TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY persona_delete ON public.health_day_inscricoes FOR DELETE TO authenticated USING(false);

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='organization_announcements' LOOP EXECUTE format('DROP POLICY %I ON public.organization_announcements',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.organization_announcements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.organization_announcements FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.organization_announcements FROM authenticated;
CREATE POLICY persona_select ON public.organization_announcements FOR SELECT TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']) OR (status='publicado' AND app_private.org_member(organization_id) AND (publico='condominio' OR EXISTS(SELECT 1 FROM public.health_day_inscricoes r WHERE r.evento_id=event_id AND app_private.own_student(r.aluno_id) AND r.status IN('confirmado','checkin')))));
CREATE POLICY persona_insert ON public.organization_announcements FOR INSERT TO authenticated WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));
CREATE POLICY persona_update ON public.organization_announcements FOR UPDATE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','sindico'])) WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));
CREATE POLICY persona_delete ON public.organization_announcements FOR DELETE TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='area_reservations' LOOP EXECUTE format('DROP POLICY %I ON public.area_reservations',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.area_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.area_reservations FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.area_reservations FROM authenticated;
CREATE POLICY persona_select ON public.area_reservations FOR SELECT TO authenticated USING(app_private.own_student(aluno_id) OR app_private.org_role(organization_id,ARRAY['admin','manager','sindico','professor']));
CREATE POLICY persona_insert ON public.area_reservations FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY persona_update ON public.area_reservations FOR UPDATE TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY persona_delete ON public.area_reservations FOR DELETE TO authenticated USING(false);

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='service_requests' LOOP EXECUTE format('DROP POLICY %I ON public.service_requests',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.service_requests FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.service_requests FROM authenticated;
CREATE POLICY persona_select ON public.service_requests FOR SELECT TO authenticated USING(app_private.own_student(aluno_id) OR app_private.org_role(organization_id,ARRAY['admin','manager','sindico']));
CREATE POLICY persona_insert ON public.service_requests FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY persona_update ON public.service_requests FOR UPDATE TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY persona_delete ON public.service_requests FOR DELETE TO authenticated USING(false);

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='professional_booking_requests' LOOP EXECUTE format('DROP POLICY %I ON public.professional_booking_requests',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.professional_booking_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.professional_booking_requests FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.professional_booking_requests FROM authenticated;
CREATE POLICY persona_select ON public.professional_booking_requests FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=aluno_id AND (app_private.own_student(a.id) OR app_private.org_role(a.organization_id,ARRAY['admin','manager']))));
CREATE POLICY persona_insert ON public.professional_booking_requests FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY persona_update ON public.professional_booking_requests FOR UPDATE TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY persona_delete ON public.professional_booking_requests FOR DELETE TO authenticated USING(false);

DO $replace$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='staff_bookings' LOOP EXECUTE format('DROP POLICY %I ON public.staff_bookings',p.policyname); END LOOP;
END $replace$;
ALTER TABLE public.staff_bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_bookings FROM anon;
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.staff_bookings FROM authenticated;
CREATE POLICY persona_select ON public.staff_bookings FOR SELECT TO authenticated USING(app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager']));
CREATE POLICY persona_insert ON public.staff_bookings FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY persona_update ON public.staff_bookings FOR UPDATE TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY persona_delete ON public.staff_bookings FOR DELETE TO authenticated USING(false);
-- Defense in depth for every existing tenant-owned public table. Restrictive rules
-- intersect existing permissive policies, including historical global-role policies.
DO $fence$
DECLARE t record;shared text;
BEGIN
 FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
  WHERE n.nspname='public' AND c.relkind IN('r','p') AND a.attname='organization_id' AND a.atttypid='uuid'::regtype AND a.attnum>0 AND NOT a.attisdropped LOOP
  shared:=CASE t.relname
   WHEN 'exercicios_biblioteca' THEN '(organization_id IS NULL AND ativo=true AND app_private.session_valid())'
   WHEN 'planos_treino' THEN '(organization_id IS NULL AND publico=true AND ativo=true AND app_private.session_valid())'
   ELSE 'false' END;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t.relname);
  EXECUTE format('DROP POLICY IF EXISTS condominium_tenant_fence ON public.%I',t.relname);
  EXECUTE format('CREATE POLICY condominium_tenant_fence ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(app_private.org_member(organization_id) OR %s) WITH CHECK(app_private.org_member(organization_id))',t.relname,shared);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon',t.relname);
 END LOOP;
END $fence$;

DO $organizations$ DECLARE p record;BEGIN
 FOR p IN SELECT policyname,tablename FROM pg_policies WHERE schemaname='public' AND tablename IN('organizations','funcionarios') LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename); END LOOP;
END $organizations$;
CREATE POLICY organization_read ON public.organizations FOR SELECT TO authenticated USING(app_private.org_member(id));
CREATE POLICY organization_admin_write ON public.organizations FOR ALL TO authenticated USING(app_private.admin()) WITH CHECK(app_private.admin());
CREATE POLICY employee_read ON public.funcionarios FOR SELECT TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager']) OR (user_id=(SELECT auth.uid()) AND app_private.session_valid() AND app_private.org_member(organization_id)));
CREATE POLICY employee_write ON public.funcionarios FOR ALL TO authenticated USING(app_private.org_role(organization_id,ARRAY['admin','manager'])) WITH CHECK(app_private.org_role(organization_id,ARRAY['admin','manager']));
REVOKE ALL ON public.organizations,public.funcionarios FROM anon;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
-- Future migrations must explicitly expose each new table.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon,authenticated;
-- Prescriptions and exercises must go through the validated publication transaction.
REVOKE INSERT,UPDATE,DELETE ON public.treinos,public.planos_treino,public.plano_exercicios FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.user_roles,public.organization_members FROM authenticated;
-- A professor's student scope is responsibility or the unassigned intake queue.
CREATE OR REPLACE FUNCTION app_private.student_role(p_student uuid,p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.admin() OR EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=p_student AND (
  app_private.org_role(a.organization_id,array_remove(p_roles,'professor'))
  OR ('professor'=ANY(p_roles) AND app_private.org_role(a.organization_id,ARRAY['professor']) AND (
   EXISTS(SELECT 1 FROM public.treinos t WHERE t.aluno_id=a.id AND t.organization_id=a.organization_id AND t.professor_id=auth.uid())
   OR EXISTS(SELECT 1 FROM public.aulas_inscritos r JOIN public.aulas c ON c.id=r.aula_id JOIN public.funcionarios f ON f.id=c.professor_id WHERE r.aluno_id=a.id AND c.organization_id=a.organization_id AND f.user_id=auth.uid() AND f.ativo=true AND r.status IN('inscrito','presente'))
   OR (EXISTS(SELECT 1 FROM public.student_safety_onboarding s WHERE s.aluno_id=a.id AND s.organization_id=a.organization_id)
       AND NOT EXISTS(SELECT 1 FROM public.treinos t WHERE t.aluno_id=a.id AND t.status='ativo')
       AND NOT EXISTS(SELECT 1 FROM public.aulas_inscritos r JOIN public.aulas c ON c.id=r.aula_id WHERE r.aluno_id=a.id AND c.professor_id IS NOT NULL AND c.data_aula>=current_date-30 AND r.status IN('inscrito','presente')))
  ))));
$$;
-- Clinical professionals obtain a whitelisted roster, never raw pupil billing fields.
DROP POLICY IF EXISTS tenant_select ON public.alunos;
CREATE POLICY tenant_select ON public.alunos FOR SELECT TO authenticated
 USING(app_private.own_student(id) OR app_private.org_role(organization_id,ARRAY['admin','manager']));
CREATE OR REPLACE FUNCTION public.coach_student_roster(p_org uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT app_private.org_role(p_org,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta']) THEN RAISE EXCEPTION 'Carteira fora do seu acesso' USING ERRCODE='42501'; END IF;
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'nome',a.nome,'email',a.email,'status',a.status,'lifecycle_status',a.lifecycle_status,'organization_id',a.organization_id,'user_id',a.user_id,'plano_id',a.plano_id) ORDER BY a.nome) FROM public.alunos a WHERE a.organization_id=p_org AND app_private.student_role(a.id,ARRAY['admin','manager','professor','nutricionista','fisioterapeuta'])),'[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION public.coach_student_roster(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.coach_student_roster(uuid) TO authenticated;
CREATE INDEX IF NOT EXISTS treino_student_professor_status_idx ON public.treinos(aluno_id,professor_id,status);
CREATE INDEX IF NOT EXISTS enrollment_student_class_status_idx ON public.aulas_inscritos(aluno_id,aula_id,status);
-- Clinical rows and plan titles are scoped to responsibility, not just the school.
DROP POLICY IF EXISTS tenant_select ON public.treinos;
CREATE POLICY tenant_select ON public.treinos FOR SELECT TO authenticated
 USING(app_private.student_matches(aluno_id,organization_id) AND (app_private.own_student(aluno_id) OR app_private.student_role(aluno_id,ARRAY['admin','manager','professor'])));
DROP POLICY IF EXISTS persona_select ON public.treinos_ia_fila;
CREATE POLICY persona_select ON public.treinos_ia_fila FOR SELECT TO authenticated
 USING(app_private.student_matches(aluno_id,organization_id) AND app_private.student_role(aluno_id,ARRAY['admin','manager','professor']));
DROP POLICY IF EXISTS persona_update ON public.treinos_ia_fila;
CREATE POLICY persona_update ON public.treinos_ia_fila FOR UPDATE TO authenticated
 USING(app_private.student_matches(aluno_id,organization_id) AND app_private.student_role(aluno_id,ARRAY['admin','manager','professor']))
 WITH CHECK(app_private.student_matches(aluno_id,organization_id) AND app_private.student_role(aluno_id,ARRAY['admin','manager','professor']));
DROP POLICY IF EXISTS persona_select ON public.planos_treino;
CREATE POLICY persona_select ON public.planos_treino FOR SELECT TO authenticated USING(
 app_private.org_role(organization_id,ARRAY['admin','manager'])
 OR (app_private.org_role(organization_id,ARRAY['professor']) AND (professor_id=auth.uid() OR publico=true))
 OR EXISTS(SELECT 1 FROM public.treinos t WHERE t.plano_treino_id=planos_treino.id AND (app_private.own_student(t.aluno_id) OR app_private.student_role(t.aluno_id,ARRAY['professor'])))
 OR (organization_id IS NULL AND publico=true AND ativo=true AND app_private.session_valid()));
-- Views must not bypass the table policies. Materialized snapshots are private.
DO $views$
DECLARE v record;
BEGIN
 FOR v IN SELECT c.relname,c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN('v','m') LOOP
  IF v.relkind='v' AND current_setting('server_version_num')::integer>=150000 THEN
   EXECUTE format('ALTER VIEW public.%I SET (security_invoker=true)',v.relname);
   EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon',v.relname);
  ELSE
   EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',v.relname);
  END IF;
 END LOOP;
END $views$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated;
COMMIT;
