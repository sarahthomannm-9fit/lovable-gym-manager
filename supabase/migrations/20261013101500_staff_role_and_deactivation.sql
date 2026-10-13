-- Keep the UI's commercial staff role valid and prevent inactive instructors
-- from remaining assigned to upcoming classes.
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_cargo_check;
ALTER TABLE public.funcionarios ADD CONSTRAINT funcionarios_cargo_check CHECK (
  cargo IN ('professor','personal','recepcionista','gerente','nutricionista','fisioterapeuta','agente_comercial')
);

CREATE OR REPLACE FUNCTION public.clear_future_classes_for_inactive_staff() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.ativo AND NOT NEW.ativo THEN
    UPDATE public.aulas
    SET professor_id=NULL
    WHERE professor_id=NEW.id AND data_aula>=current_date AND status IS DISTINCT FROM 'cancelada';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS clear_future_classes_for_inactive_staff ON public.funcionarios;
CREATE TRIGGER clear_future_classes_for_inactive_staff AFTER UPDATE OF ativo ON public.funcionarios
FOR EACH ROW EXECUTE FUNCTION public.clear_future_classes_for_inactive_staff();

