-- Create org_invites table for QR-based self-registration
CREATE TABLE public.org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  papel_padrao app_role NOT NULL DEFAULT 'user',
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  max_usos integer,
  usos_atuais integer NOT NULL DEFAULT 0,
  expira_em timestamptz,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_org_invites_token ON public.org_invites(token);
CREATE INDEX idx_org_invites_organization_id ON public.org_invites(organization_id);
CREATE INDEX idx_org_invites_ativo ON public.org_invites(ativo);

-- Enable Row Level Security
ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Staff (admin/manager/sindico) of organization can SELECT invites from their own organization
CREATE POLICY "org_invites_staff_select" ON public.org_invites
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = org_invites.organization_id
        AND om.papel = ANY (ARRAY['admin'::app_role,'manager'::app_role,'sindico'::app_role])
    )
  )
);

-- Policy: Staff (admin/manager/sindico) can INSERT, UPDATE, DELETE invites for their organization
CREATE POLICY "org_invites_staff_write" ON public.org_invites
FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = org_invites.organization_id
        AND om.papel = ANY (ARRAY['admin'::app_role,'manager'::app_role,'sindico'::app_role])
    )
  )
) WITH CHECK (
  auth.uid() IS NOT NULL AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = org_invites.organization_id
        AND om.papel = ANY (ARRAY['admin'::app_role,'manager'::app_role,'sindico'::app_role])
    )
  )
);

-- Policy: Prevent non-authenticated users from accessing this table directly
-- The token validation happens only in the edge function with service_role
CREATE POLICY "org_invites_no_public_access" ON public.org_invites
FOR ALL USING (false) WITH CHECK (false);
