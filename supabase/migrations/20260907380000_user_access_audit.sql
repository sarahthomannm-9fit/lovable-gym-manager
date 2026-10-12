-- Registro de acessos operacionais e base para usuários inativos.
CREATE TABLE IF NOT EXISTS public.user_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  event TEXT NOT NULL CHECK (event IN ('login','logout','context_switch','access_denied')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_access_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_access_self_read" ON public.user_access_audit;
CREATE POLICY "user_access_self_read"
  ON public.user_access_audit FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.record_user_access(p_event TEXT, p_organization_id UUID DEFAULT NULL, p_metadata JSONB DEFAULT '{}'::jsonb)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF auth.uid() IS NULL OR p_event NOT IN ('login','logout','context_switch','access_denied') THEN
    RAISE EXCEPTION 'Evento de acesso inválido';
  END IF;
  INSERT INTO public.user_access_audit(user_id, organization_id, event, metadata)
  VALUES (auth.uid(), p_organization_id, p_event, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_user_access(TEXT, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_user_access(TEXT, UUID, JSONB) TO authenticated;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ultimo_acesso_em TIMESTAMPTZ;
