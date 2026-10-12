-- Backfill de convites antigos: vincula usuários já cadastrados aos alunos
-- e normaliza o papel global para o papel do condomínio.
UPDATE public.alunos a
SET user_id = u.id,
    organization_id = COALESCE(a.organization_id, m.organization_id)
FROM auth.users u
LEFT JOIN public.organization_members m
  ON m.user_id = u.id
 AND m.papel::text IN ('user','morador','residente','aluno')
WHERE a.user_id IS NULL
  AND lower(btrim(a.email)) = lower(btrim(u.email))
  AND (m.organization_id IS NULL OR m.organization_id = a.organization_id);

INSERT INTO public.user_roles(user_id, role)
SELECT m.user_id, m.papel::public.app_role
FROM public.organization_members m
WHERE m.papel::text IN ('user','morador','residente','aluno','sindico','professor','manager','admin')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- Reaplica o vínculo para convites aceitos, caso o convite tenha sido
-- consumido antes da migration de provisionamento do morador.
UPDATE public.alunos a
SET user_id = i.accepted_by,
    organization_id = COALESCE(a.organization_id, i.organization_id)
FROM public.organization_invites i
WHERE i.status = 'aceito'
  AND i.accepted_by IS NOT NULL
  AND i.papel::text IN ('user','morador','residente','aluno')
  AND lower(btrim(a.email)) = lower(btrim(i.email))
  AND (a.user_id IS NULL OR a.user_id = i.accepted_by);
