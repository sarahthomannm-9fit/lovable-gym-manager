-- Corrigir função sem search_path
CREATE OR REPLACE FUNCTION atualizar_contador_inscritos()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE aulas 
  SET inscritos_atual = (
    SELECT COUNT(*) 
    FROM aulas_inscritos 
    WHERE aula_id = COALESCE(NEW.aula_id, OLD.aula_id)
    AND status IN ('inscrito', 'presente')
  )
  WHERE id = COALESCE(NEW.aula_id, OLD.aula_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;