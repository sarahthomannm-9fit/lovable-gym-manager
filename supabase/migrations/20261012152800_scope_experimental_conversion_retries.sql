CREATE OR REPLACE FUNCTION public.convert_experimental_class(p_experimental_id uuid,p_plano_id uuid,p_organization_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_class public.aulas_experimentais%ROWTYPE; v_plan public.planos%ROWTYPE; v_aluno uuid; v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; v_email text;
BEGIN
  IF auth.uid() IS NULL OR p_organization_id IS NULL OR NOT (public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.organization_members m WHERE m.organization_id=p_organization_id AND m.user_id=auth.uid() AND m.papel::text IN ('admin','manager')
  )) THEN RAISE EXCEPTION 'Sem permissão para converter nesta organização'; END IF;
  SELECT * INTO v_class FROM public.aulas_experimentais WHERE id=p_experimental_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aula experimental não encontrada'; END IF;
  IF v_class.organization_id IS DISTINCT FROM p_organization_id THEN RAISE EXCEPTION 'Aula pertence a outra organização'; END IF;
  IF v_class.aula_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.aulas a WHERE a.id=v_class.aula_id AND a.organization_id=p_organization_id) THEN RAISE EXCEPTION 'Aula pertence a outra organização'; END IF;
  IF v_class.status='convertida' AND v_class.aluno_convertido_id IS NOT NULL THEN RETURN v_class.aluno_convertido_id; END IF;
  IF v_class.status<>'realizada' THEN RAISE EXCEPTION 'Aula experimental deve estar realizada'; END IF;
  v_email:=lower(trim(coalesce(v_class.email,'')));
  IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'E-mail válido é necessário para converter'; END IF;
  SELECT * INTO v_plan FROM public.planos WHERE id=p_plano_id AND ativo=true;
  IF NOT FOUND OR v_plan.preco<0 THEN RAISE EXCEPTION 'Plano indisponível'; END IF;
  IF EXISTS (SELECT 1 FROM public.alunos WHERE organization_id=p_organization_id AND lower(email)=v_email) THEN RAISE EXCEPTION 'Já existe aluno com este e-mail nesta organização'; END IF;
  INSERT INTO public.alunos(organization_id,nome,email,telefone,plano_id,tipo,status,categoria_aluno,valor_mensalidade,data_matricula,dia_pagamento)
  VALUES(p_organization_id,trim(v_class.nome),v_email,v_class.telefone,p_plano_id,'presencial','ativo','fixo',v_plan.preco,v_today,extract(day FROM v_today)::integer)
  RETURNING id INTO v_aluno;
  INSERT INTO public.pagamentos(aluno_id,valor,data_vencimento,referencia_mes,status,observacoes)
  VALUES(v_aluno,v_plan.preco,v_today,date_trunc('month',v_today::timestamp)::date,'pendente','Primeira cobrança da conversão de aula experimental');
  UPDATE public.aulas_experimentais SET status='convertida',data_conversao=v_today,plano_convertido_id=p_plano_id,organization_id=p_organization_id,aluno_convertido_id=v_aluno,updated_at=now()
  WHERE id=p_experimental_id;
  RETURN v_aluno;
END;
$$;
REVOKE ALL ON FUNCTION public.convert_experimental_class(uuid,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.convert_experimental_class(uuid,uuid,uuid) TO authenticated;

