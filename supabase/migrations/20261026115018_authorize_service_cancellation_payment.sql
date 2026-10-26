CREATE OR REPLACE FUNCTION public.transition_service_request(p_id uuid,p_action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.service_requests; owner boolean; staff boolean; previous_transition text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 SELECT * INTO r FROM public.service_requests WHERE id=p_id FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
 owner:=EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=r.aluno_id AND a.user_id=auth.uid());
 staff:=public.persona_has_role(r.organization_id,ARRAY['manager','sindico','professor']);
 IF NOT(owner OR staff) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF p_action='accept' AND owner AND r.status='cotada' THEN
  IF r.quoted_value IS NULL OR r.quoted_value<0 THEN RAISE EXCEPTION 'Proposta inválida'; END IF;
  IF r.payment_id IS NULL AND r.quoted_value>0 THEN
   INSERT INTO public.pagamentos(aluno_id,valor,data_vencimento,status,referencia_mes,observacoes)
   VALUES(r.aluno_id,r.quoted_value,current_date+7,'pendente',date_trunc('month',current_date)::date,'Serviço NINE LIVING: '||r.service_type)
   RETURNING id INTO r.payment_id;
  END IF;
  UPDATE public.service_requests SET status='confirmada',payment_id=r.payment_id,updated_at=now() WHERE id=r.id;
 ELSIF p_action='complete' AND staff AND r.status='confirmada' THEN UPDATE public.service_requests SET status='concluida',updated_at=now() WHERE id=r.id;
 ELSIF p_action='cancel' AND r.status IN('solicitada','cotada','confirmada') THEN
  IF r.payment_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.pagamentos WHERE id=r.payment_id AND status='pago') THEN RAISE EXCEPTION 'Pagamento confirmado. Solicite cancelamento e estorno à administração'; END IF;
  UPDATE public.service_requests SET status='cancelada',updated_at=now() WHERE id=r.id;
  previous_transition:=current_setting('app.payment_transition_authorized',true);
  PERFORM set_config('app.payment_transition_authorized','yes',true);
  UPDATE public.pagamentos SET status='cancelado' WHERE id=r.payment_id AND status<>'pago';
  PERFORM set_config('app.payment_transition_authorized',coalesce(previous_transition,''),true);
 ELSE RAISE EXCEPTION 'Ação indisponível neste status'; END IF;
END; $$;
