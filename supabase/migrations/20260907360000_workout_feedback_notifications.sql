-- Notifica o professor quando há feedback que exige revisão.
CREATE OR REPLACE FUNCTION public.notify_workout_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_name TEXT;
BEGIN
  IF NEW.feedback IS NULL OR length(trim(NEW.feedback)) = 0
     OR (TG_OP = 'UPDATE' AND NEW.feedback IS NOT DISTINCT FROM OLD.feedback) THEN
    RETURN NEW;
  END IF;
  SELECT nome INTO v_name FROM public.alunos WHERE id = NEW.aluno_id;
  INSERT INTO public.notificacoes
    (tipo, titulo, mensagem, destinatario_tipo, destinatario_id, prioridade, canal)
  SELECT 'treino_feedback',
         'Feedback de treino recebido',
         coalesce(v_name, 'Aluno') || ' enviou um feedback para revisão.',
         'professor',
         m.user_id,
         'normal',
         ARRAY['sistema']
    FROM public.organization_members m
    JOIN public.treinos t ON t.organization_id = m.organization_id
   WHERE t.id = NEW.treino_id
     AND m.papel::text IN ('professor','coach','manager')
     AND NOT EXISTS (
       SELECT 1 FROM public.notificacoes n
        WHERE n.tipo = 'treino_feedback'
          AND n.destinatario_id = m.user_id
          AND n.mensagem LIKE coalesce(v_name, 'Aluno') || '%'
          AND n.created_at > now() - interval '10 minutes'
     );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workout_feedback_notification ON public.workout_sessions;
CREATE TRIGGER workout_feedback_notification
AFTER INSERT OR UPDATE OF feedback ON public.workout_sessions
FOR EACH ROW EXECUTE FUNCTION public.notify_workout_feedback();
