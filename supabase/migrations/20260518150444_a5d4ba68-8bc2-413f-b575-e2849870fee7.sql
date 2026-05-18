
-- 1. Expandir enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sindico';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'corporate';

-- 2. Tabela organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('condominio','corporate','professor','studio')),
  cnpj text,
  contato_nome text,
  contato_email text,
  contato_telefone text,
  status text NOT NULL DEFAULT 'ativo',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Tabela organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  papel public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id, papel)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

-- 4. Coluna organization_id em alunos
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
CREATE INDEX IF NOT EXISTS idx_alunos_org ON public.alunos(organization_id);

-- 5. Helper SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.user_has_org(_user uuid, _org uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user AND organization_id = _org
  );
$$;

-- 6. RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage organizations"
ON public.organizations FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Members read their organizations"
ON public.organizations FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.user_has_org(auth.uid(), id)
);

CREATE POLICY "Admins manage organization_members"
ON public.organization_members FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users read their memberships"
ON public.organization_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
