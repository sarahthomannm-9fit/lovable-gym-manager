CREATE OR REPLACE FUNCTION public.resident_announcements(p_aluno_id UUID)
RETURNS SETOF public.organization_announcements
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT a.*
    FROM public.organization_announcements a
    JOIN public.alunos aluno ON aluno.organization_id = a.organization_id AND aluno.id = p_aluno_id
    LEFT JOIN public.health_day_registrations r ON r.event_id = a.event_id AND r.aluno_id = p_aluno_id
   WHERE a.status = 'publicado'
     AND (a.publico IN ('condominio','moradores') OR (a.publico = 'evento' AND r.id IS NOT NULL));
$$;

REVOKE ALL ON FUNCTION public.resident_announcements(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resident_announcements(UUID) TO authenticated;
