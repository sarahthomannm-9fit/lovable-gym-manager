-- Lote 1: banco, autorização e integridade do fluxo de condomínios.

-- Consultas do painel e das RPCs por condomínio.
CREATE INDEX IF NOT EXISTS idx_org_invites_org_status_created
  ON public.organization_invites (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_invites_email_org
  ON public.organization_invites (lower(email), organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_user_role
  ON public.organization_members (organization_id, user_id, papel);
CREATE INDEX IF NOT EXISTS idx_alunos_org_email
  ON public.alunos (organization_id, lower(email));

-- Apenas um convite pendente por pessoa/persona dentro do condomínio.
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_invites_pending_email_role
  ON public.organization_invites (organization_id, lower(email), papel)
  WHERE status = 'pendente';

-- Leitura administrativa das organizações sem abrir escrita pública.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read all organizations" ON public.organizations;
CREATE POLICY "Admins read all organizations" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.user_has_org(auth.uid(), id));

-- Acesso aos membros: cada usuário vê seus próprios vínculos; admins veem o condomínio inteiro.
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own organization memberships" ON public.organization_members;
CREATE POLICY "Users read own organization memberships" ON public.organization_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Expiração idempotente para ser chamada por cron ou antes de listar convites.
CREATE OR REPLACE FUNCTION public.expire_organization_invites()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.organization_invites
     SET status = 'expirado'
   WHERE status = 'pendente' AND expires_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_organization_invites() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_organization_invites() TO authenticated;

