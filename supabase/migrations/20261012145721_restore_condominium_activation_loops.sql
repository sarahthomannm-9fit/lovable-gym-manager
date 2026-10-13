CREATE TABLE IF NOT EXISTS public.organization_activation_alert_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  action_label text NOT NULL,
  acted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.organization_activation_alert_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organization members can view activation actions" ON public.organization_activation_alert_actions;
DROP POLICY IF EXISTS "organization members can insert activation actions" ON public.organization_activation_alert_actions;
CREATE POLICY "activation_actions_read" ON public.organization_activation_alert_actions FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=organization_activation_alert_actions.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))
);

CREATE OR REPLACE FUNCTION public.organization_activation_metrics(p_organization_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_moradores integer; v_treinos integer; v_eventos integer; v_checkins integer;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=p_organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT count(*) INTO v_moradores FROM public.alunos WHERE organization_id=p_organization_id AND status='ativo';
  SELECT count(*) INTO v_treinos FROM public.treinos WHERE organization_id=p_organization_id AND status='ativo';
  SELECT count(*) INTO v_eventos FROM public.health_day_events WHERE organization_id=p_organization_id AND status='publicado';
  SELECT count(*) INTO v_checkins FROM public.checkins c JOIN public.alunos a ON a.id=c.aluno_id WHERE a.organization_id=p_organization_id AND c.data_checkin>=current_date-30;
  RETURN jsonb_build_object('moradores_ativos',v_moradores,'treinos_ativos',v_treinos,'eventos_publicados',v_eventos,'checkins_30_dias',v_checkins);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_activation_alert_action(p_organization_id uuid,p_alert_type text,p_action_label text)
RETURNS public.organization_activation_alert_actions LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_row public.organization_activation_alert_actions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR length(trim(coalesce(p_alert_type,'')))=0 OR length(trim(coalesce(p_action_label,'')))=0 OR NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=p_organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  INSERT INTO public.organization_activation_alert_actions(organization_id,alert_type,action_label,acted_by) VALUES(p_organization_id,left(p_alert_type,100),left(p_action_label,240),auth.uid()) RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_activation_alert_action(p_action_id uuid)
RETURNS public.organization_activation_alert_actions LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_row public.organization_activation_alert_actions%ROWTYPE;
BEGIN
  UPDATE public.organization_activation_alert_actions a SET resolved_at=now(),resolved_by=auth.uid() WHERE a.id=p_action_id AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=a.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','sindico'))) RETURNING a.* INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ação não encontrada ou sem acesso'; END IF; RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.eligible_exercises(p_restrictions text[] DEFAULT '{}')
RETURNS SETOF public.exercicios_biblioteca LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT e.* FROM public.exercicios_biblioteca e WHERE e.ativo=true AND NOT (coalesce(e.restricoes_incompativeis,'{}'::text[]) && coalesce(p_restrictions,'{}'::text[])); $$;

REVOKE ALL ON FUNCTION public.organization_activation_metrics(uuid), public.record_activation_alert_action(uuid,text,text), public.resolve_activation_alert_action(uuid), public.eligible_exercises(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.organization_activation_metrics(uuid), public.record_activation_alert_action(uuid,text,text), public.resolve_activation_alert_action(uuid), public.eligible_exercises(text[]) TO authenticated;

