CREATE UNIQUE INDEX IF NOT EXISTS checkins_one_per_student_day ON public.checkins(aluno_id,data_checkin);
DROP POLICY IF EXISTS "checkin_insert_own" ON public.checkins;
CREATE OR REPLACE FUNCTION public.record_daily_checkin(p_aluno_id uuid,p_date date DEFAULT NULL)
RETURNS public.checkins LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_student public.alunos%ROWTYPE; v_row public.checkins%ROWTYPE; v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; v_date date;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  SELECT * INTO v_student FROM public.alunos WHERE id=p_aluno_id;
  IF NOT FOUND OR v_student.status<>'ativo' OR v_student.organization_id IS NULL THEN RAISE EXCEPTION 'Aluno não elegível'; END IF;
  v_date:=coalesce(p_date,v_today);
  IF v_student.user_id=auth.uid() THEN
    IF v_date<>v_today THEN RAISE EXCEPTION 'Morador só pode registrar presença de hoje'; END IF;
  ELSIF NOT (public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.organization_members m WHERE m.organization_id=v_student.organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager','professor')
  )) OR v_date>v_today OR v_date<v_today-30 THEN RAISE EXCEPTION 'Sem permissão para esta presença'; END IF;
  INSERT INTO public.checkins(aluno_id,data_checkin,horario_entrada)
  VALUES(p_aluno_id,v_date,now())
  ON CONFLICT(aluno_id,data_checkin) DO UPDATE SET horario_entrada=public.checkins.horario_entrada
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.record_daily_checkin(uuid,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_daily_checkin(uuid,date) TO authenticated;

