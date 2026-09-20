-- Lote 5: rastreabilidade do envio de convites.
CREATE TABLE IF NOT EXISTS public.organization_invite_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES public.organization_invites(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'resend',
  status TEXT NOT NULL CHECK (status IN ('queued','sent','failed','not_configured')),
  message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.organization_invite_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invite delivery read" ON public.organization_invite_deliveries;
CREATE POLICY "Invite delivery read" ON public.organization_invite_deliveries
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.organization_invites i
    WHERE i.id = invite_id AND i.invited_by = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_invite_deliveries_invite_created
  ON public.organization_invite_deliveries (invite_id, created_at DESC);

