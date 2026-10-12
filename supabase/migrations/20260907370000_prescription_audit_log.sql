-- Auditoria mínima de prescrição e alterações administrativas.
CREATE TABLE IF NOT EXISTS public.prescription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id UUID REFERENCES public.treinos(id) ON DELETE SET NULL,
  organization_id UUID,
  actor_user_id UUID,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prescription_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prescription_audit_read" ON public.prescription_audit_log;
CREATE POLICY "prescription_audit_read"
  ON public.prescription_audit_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR actor_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.audit_workout_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org UUID;
BEGIN
  SELECT organization_id INTO v_org FROM public.treinos WHERE id = NEW.treino_id;
  INSERT INTO public.prescription_audit_log (treino_id, organization_id, actor_user_id, action, details)
  VALUES (NEW.treino_id, v_org, NEW.user_id, 'publicado', jsonb_build_object('request_id', NEW.request_id, 'payload', NEW.payload));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workout_publication_audit ON public.workout_publications;
CREATE TRIGGER workout_publication_audit
AFTER INSERT ON public.workout_publications
FOR EACH ROW EXECUTE FUNCTION public.audit_workout_publication();

REVOKE ALL ON public.prescription_audit_log FROM anon;
GRANT SELECT ON public.prescription_audit_log TO authenticated;
