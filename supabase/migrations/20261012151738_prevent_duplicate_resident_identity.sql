CREATE UNIQUE INDEX IF NOT EXISTS alunos_organization_email_unique
  ON public.alunos(organization_id, lower(email))
  WHERE organization_id IS NOT NULL AND email IS NOT NULL;

