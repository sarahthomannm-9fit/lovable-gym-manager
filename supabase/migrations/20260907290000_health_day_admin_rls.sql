-- Restringe alterações administrativas de inscrições do Health Day.
CREATE OR REPLACE FUNCTION public.health_day_manager()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ok boolean := false;
BEGIN
  IF public.is_admin(auth.uid()) THEN RETURN true; END IF;
  IF to_regclass('public.user_roles') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role::text IN (''sindico'',''admin'',''manager''))'
      INTO v_ok USING auth.uid();
  END IF;
  RETURN coalesce(v_ok, false);
END;
$$;

DROP POLICY IF EXISTS "health_registration_write" ON public.health_day_registrations;
CREATE POLICY "health_registration_insert_via_rpc" ON public.health_day_registrations
FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "health_registration_manage" ON public.health_day_registrations
FOR UPDATE TO authenticated
USING (public.health_day_manager())
WITH CHECK (public.health_day_manager());
CREATE POLICY "health_registration_cancel" ON public.health_day_registrations
FOR DELETE TO authenticated
USING (public.health_day_manager());

REVOKE ALL ON FUNCTION public.health_day_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.health_day_manager() TO authenticated;
