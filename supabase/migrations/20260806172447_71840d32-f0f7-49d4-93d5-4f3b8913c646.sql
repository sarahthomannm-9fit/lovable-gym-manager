DELETE FROM public.organization_members om
USING public.organizations o
WHERE om.organization_id = o.id
  AND o.nome ILIKE '%Central Park%'
  AND om.papel = 'sindico'
  AND om.user_id IN (
    SELECT id FROM auth.users WHERE lower(email) = 'sarahthomannm@gmail.com'
  );