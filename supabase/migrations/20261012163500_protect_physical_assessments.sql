ALTER TABLE public.avaliacoes_fisicas ADD COLUMN IF NOT EXISTS registered_by uuid REFERENCES auth.users(id);
ALTER TABLE public.avaliacoes_fisicas ALTER COLUMN registered_by SET DEFAULT auth.uid();
DROP POLICY IF EXISTS avaliacao_select ON public.avaliacoes_fisicas;
CREATE POLICY avaliacao_select ON public.avaliacoes_fisicas FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.alunos a WHERE a.id=avaliacoes_fisicas.aluno_id AND a.user_id=auth.uid()) OR EXISTS (
    SELECT 1 FROM public.alunos a JOIN public.organization_members m ON m.organization_id=a.organization_id
    WHERE a.id=avaliacoes_fisicas.aluno_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','professor','nutricionista','fisioterapeuta')
  )
);
DROP POLICY IF EXISTS avaliacao_update_staff ON public.avaliacoes_fisicas;
DROP POLICY IF EXISTS avaliacao_insert_staff ON public.avaliacoes_fisicas;
CREATE POLICY avaliacao_insert_staff ON public.avaliacoes_fisicas FOR INSERT TO authenticated WITH CHECK (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.alunos a JOIN public.organization_members m ON m.organization_id=a.organization_id WHERE a.id=avaliacoes_fisicas.aluno_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','professor','nutricionista','fisioterapeuta'))
);
CREATE POLICY avaliacao_update_staff ON public.avaliacoes_fisicas FOR UPDATE TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.alunos a JOIN public.organization_members m ON m.organization_id=a.organization_id WHERE a.id=avaliacoes_fisicas.aluno_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','professor','nutricionista','fisioterapeuta'))
) WITH CHECK (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.alunos a JOIN public.organization_members m ON m.organization_id=a.organization_id WHERE a.id=avaliacoes_fisicas.aluno_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','professor','nutricionista','fisioterapeuta'))
);
DROP POLICY IF EXISTS avaliacao_delete_admin ON public.avaliacoes_fisicas;

CREATE TABLE public.physical_assessment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assessment_id uuid NOT NULL,
  aluno_id uuid NOT NULL REFERENCES public.alunos(id), organization_id uuid NOT NULL REFERENCES public.organizations(id),
  actor_id uuid REFERENCES auth.users(id), action text NOT NULL CHECK (action IN ('created','revised')),
  snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_physical_assessment_audit_assessment ON public.physical_assessment_audit(assessment_id,created_at);
ALTER TABLE public.physical_assessment_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_audit_clinical_read ON public.physical_assessment_audit FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=physical_assessment_audit.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','professor','nutricionista','fisioterapeuta'))
);
CREATE FUNCTION public.audit_physical_assessment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_org uuid;
BEGIN
  SELECT organization_id INTO v_org FROM public.alunos WHERE id=NEW.aluno_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Avaliação requer aluno vinculado a organização'; END IF;
  INSERT INTO public.physical_assessment_audit(assessment_id,aluno_id,organization_id,actor_id,action,snapshot)
  VALUES(NEW.id,NEW.aluno_id,v_org,auth.uid(),CASE WHEN TG_OP='INSERT' THEN 'created' ELSE 'revised' END,to_jsonb(NEW));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_audit_physical_assessment AFTER INSERT OR UPDATE ON public.avaliacoes_fisicas FOR EACH ROW EXECUTE FUNCTION public.audit_physical_assessment();

