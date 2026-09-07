CREATE OR REPLACE FUNCTION public.bulk_import_residents(p_organization_id UUID, p_rows JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row JSONB; v_ok INTEGER := 0; v_errors JSONB := '[]'::jsonb; v_email TEXT; v_nome TEXT; v_unidade TEXT;
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = p_organization_id AND m.user_id = auth.uid() AND m.papel IN ('sindico','manager','admin'))) THEN
    RAISE EXCEPTION 'Sem permissão para importar moradores';
  END IF;
  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Formato de importação inválido'; END IF;
  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_email := lower(trim(coalesce(v_row->>'email','')));
    v_nome := trim(coalesce(v_row->>'nome',''));
    v_unidade := trim(coalesce(v_row->>'unidade',''));
    IF v_nome = '' OR v_email = '' OR position('@' in v_email) = 0 THEN
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row', v_row, 'error', 'nome e e-mail são obrigatórios'));
    ELSE
      INSERT INTO public.alunos(nome,email,organization_id,status,observacoes_medicas)
      VALUES (v_nome,v_email,p_organization_id,'ativo',CASE WHEN v_unidade = '' THEN NULL ELSE 'Unidade: ' || v_unidade END)
      ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, organization_id = EXCLUDED.organization_id;
      v_ok := v_ok + 1;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('importados', v_ok, 'erros', v_errors);
END;
$$;

REVOKE ALL ON FUNCTION public.bulk_import_residents(UUID,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_import_residents(UUID,JSONB) TO authenticated;
