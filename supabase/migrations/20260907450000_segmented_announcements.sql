CREATE TABLE IF NOT EXISTS public.organization_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.health_day_events(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  publico TEXT NOT NULL DEFAULT 'condominio' CHECK (publico IN ('condominio','evento','professores','moradores')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado','arquivado')),
  publicado_por UUID REFERENCES auth.users(id),
  publicado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_read" ON public.organization_announcements;
CREATE POLICY "announcements_read" ON public.organization_announcements FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR public.user_has_org(auth.uid(), organization_id));

CREATE OR REPLACE FUNCTION public.publish_organization_announcement(p_id UUID)
RETURNS public.organization_announcements
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.organization_announcements;
BEGIN
  UPDATE public.organization_announcements a SET status='publicado', publicado_por=auth.uid(), publicado_em=now()
   WHERE a.id=p_id AND (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id=a.organization_id AND m.user_id=auth.uid() AND m.papel IN ('sindico','admin','manager')))
   RETURNING a.* INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comunicado não encontrado ou sem permissão'; END IF;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_organization_announcement(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_organization_announcement(UUID) TO authenticated;
