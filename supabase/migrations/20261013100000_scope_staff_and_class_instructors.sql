-- Staff records and classroom instructors belong to one organization.
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.funcionarios WHERE organization_id IS NULL) THEN
    RAISE EXCEPTION 'Classifique os funcionários existentes por organização antes de aplicar esta migração';
  END IF;
END $$;
ALTER TABLE public.funcionarios ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS funcionarios_organization_idx ON public.funcionarios(organization_id, ativo);
CREATE UNIQUE INDEX IF NOT EXISTS funcionarios_organization_user_unique ON public.funcionarios(organization_id, user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.protect_staff_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Organização e identidade vinculada do funcionário não podem ser alteradas diretamente';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_staff_identity ON public.funcionarios;
CREATE TRIGGER protect_staff_identity BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.protect_staff_identity();

DROP POLICY IF EXISTS "Authenticated full access to funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.funcionarios;
CREATE POLICY funcionarios_staff_read ON public.funcionarios FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=funcionarios.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
);
CREATE POLICY funcionarios_staff_insert ON public.funcionarios FOR INSERT TO authenticated WITH CHECK (
  user_id IS NULL AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=funcionarios.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')))
);
CREATE POLICY funcionarios_staff_update ON public.funcionarios FOR UPDATE TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=funcionarios.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
) WITH CHECK (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=funcionarios.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager'))
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.aulas WHERE professor_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Concilie os instrutores legados das aulas antes de alterar a referência';
  END IF;
END $$;
ALTER TABLE public.aulas DROP CONSTRAINT IF EXISTS aulas_professor_id_fkey;
ALTER TABLE public.aulas ADD CONSTRAINT aulas_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.funcionarios(id) ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION public.enforce_class_instructor_organization() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.professor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.funcionarios f WHERE f.id=NEW.professor_id AND f.organization_id=NEW.organization_id AND f.ativo AND f.cargo IN ('professor','personal')
  ) THEN RAISE EXCEPTION 'Instrutor inativo ou fora da organização'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS enforce_class_instructor_organization ON public.aulas;
CREATE TRIGGER enforce_class_instructor_organization BEFORE INSERT OR UPDATE OF professor_id, organization_id ON public.aulas FOR EACH ROW EXECUTE FUNCTION public.enforce_class_instructor_organization();

DROP POLICY IF EXISTS "Authenticated full access to aulas" ON public.aulas;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.aulas;
CREATE POLICY aulas_organization_read ON public.aulas FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=aulas.organization_id AND m.user_id=auth.uid())
);
CREATE POLICY aulas_organization_insert ON public.aulas FOR INSERT TO authenticated WITH CHECK (
  organization_id IS NOT NULL AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=aulas.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','professor')))
);
CREATE POLICY aulas_organization_update ON public.aulas FOR UPDATE TO authenticated USING (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=aulas.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','professor'))
) WITH CHECK (
  public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=aulas.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','professor'))
);

