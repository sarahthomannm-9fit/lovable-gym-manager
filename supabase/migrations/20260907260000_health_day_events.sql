CREATE TABLE IF NOT EXISTS public.health_day_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ NOT NULL,
  capacidade INTEGER NOT NULL DEFAULT 15 CHECK (capacidade > 0),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado','encerrado','cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_day_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.health_day_events(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inscrito' CHECK (status IN ('inscrito','confirmado','checkin','cancelado','lista_espera')),
  checkin_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, aluno_id)
);

ALTER TABLE public.health_day_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_day_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_event_read" ON public.health_day_events FOR SELECT TO authenticated
USING (public.user_has_org(auth.uid(), organization_id) OR public.is_admin(auth.uid()));
CREATE POLICY "health_event_write" ON public.health_day_events FOR ALL TO authenticated
USING (public.user_has_org(auth.uid(), organization_id) OR public.is_admin(auth.uid()))
WITH CHECK (public.user_has_org(auth.uid(), organization_id) OR public.is_admin(auth.uid()));

CREATE POLICY "health_registration_read" ON public.health_day_registrations FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.health_day_events e WHERE e.id = event_id AND (public.user_has_org(auth.uid(), e.organization_id) OR public.is_admin(auth.uid()))));
CREATE POLICY "health_registration_write" ON public.health_day_registrations FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.health_day_events e WHERE e.id = event_id AND (public.user_has_org(auth.uid(), e.organization_id) OR public.is_admin(auth.uid()))))
WITH CHECK (EXISTS (SELECT 1 FROM public.health_day_events e WHERE e.id = event_id AND (public.user_has_org(auth.uid(), e.organization_id) OR public.is_admin(auth.uid()))));
