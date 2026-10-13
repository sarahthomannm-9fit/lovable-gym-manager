CREATE TABLE IF NOT EXISTS public.user_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  event text NOT NULL CHECK (event IN ('login','logout','context_switch','access_denied')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_access_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_access_self_read" ON public.user_access_audit;
CREATE POLICY "user_access_admin_read" ON public.user_access_audit FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.record_user_access(p_event text,p_organization_id uuid DEFAULT NULL,p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ DECLARE v_id uuid; BEGIN
  IF auth.uid() IS NULL OR p_event NOT IN ('login','logout','context_switch','access_denied') OR jsonb_typeof(coalesce(p_metadata,'{}'::jsonb)) <> 'object' THEN RAISE EXCEPTION 'Evento de acesso inválido'; END IF;
  IF p_organization_id IS NOT NULL AND NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=p_organization_id AND m.user_id=auth.uid())) THEN RAISE EXCEPTION 'Sem acesso à organização'; END IF;
  INSERT INTO public.user_access_audit(user_id,organization_id,event,metadata) VALUES(auth.uid(),p_organization_id,p_event,p_metadata) RETURNING id INTO v_id; RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.record_user_access(text,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_user_access(text,uuid,jsonb) TO authenticated;

CREATE TABLE IF NOT EXISTS public.prescription_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), treino_id uuid REFERENCES public.treinos(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL, actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL, details jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prescription_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prescription_audit_admin_read" ON public.prescription_audit_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.audit_workout_publication() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ BEGIN INSERT INTO public.prescription_audit_log(treino_id,organization_id,actor_user_id,action,details) VALUES(new.id,new.organization_id,auth.uid(),'workout_published',jsonb_build_object('aluno_id',new.aluno_id,'nome',new.nome)); RETURN new; END; $$;
DROP TRIGGER IF EXISTS trg_audit_workout_publication ON public.treinos;
CREATE TRIGGER trg_audit_workout_publication AFTER INSERT ON public.treinos FOR EACH ROW EXECUTE FUNCTION public.audit_workout_publication();

CREATE TABLE IF NOT EXISTS public.workout_protocol_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome text NOT NULL, objetivo text NOT NULL, nivel text NOT NULL DEFAULT 'iniciante', descricao text,
  sessoes_semana integer NOT NULL DEFAULT 3 CHECK (sessoes_semana BETWEEN 1 AND 7), estrutura jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_protocol_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "protocol_templates_read" ON public.workout_protocol_templates;
DROP POLICY IF EXISTS "protocol_templates_write" ON public.workout_protocol_templates;
CREATE POLICY "protocol_templates_read" ON public.workout_protocol_templates FOR SELECT TO authenticated USING (ativo AND (organization_id IS NULL OR public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=workout_protocol_templates.organization_id AND m.user_id=auth.uid())));
CREATE POLICY "protocol_templates_write" ON public.workout_protocol_templates FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=workout_protocol_templates.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','professor'))) WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=workout_protocol_templates.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','professor')));
INSERT INTO public.workout_protocol_templates(organization_id,nome,objetivo,nivel,descricao,sessoes_semana,estrutura)
SELECT NULL,v.nome,v.objetivo,'iniciante',v.descricao,v.sessoes,v.estrutura::jsonb FROM (VALUES
 ('Base de força — iniciante','Força','Movimentos básicos com progressão gradual.',3,'{"foco":"força","dias":[1,3,5]}'),
 ('Mobilidade e postura — iniciante','Postural e mobilidade','Mobilidade global e controle motor.',3,'{"foco":"mobilidade","dias":[1,3,5]}'),
 ('Condicionamento — iniciante','Cardio','Sessões progressivas de condicionamento.',3,'{"foco":"cardio","dias":[1,3,5]}')
) AS v(nome,objetivo,descricao,sessoes,estrutura) WHERE NOT EXISTS (SELECT 1 FROM public.workout_protocol_templates t WHERE t.nome=v.nome AND t.organization_id IS NULL);

