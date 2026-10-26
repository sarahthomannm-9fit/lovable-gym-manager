CREATE OR REPLACE FUNCTION public.fn_aluno_criar_entitlement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE sku uuid;
BEGIN
 SELECT s.id INTO sku FROM public.skus s WHERE s.plano_id=NEW.plano_id AND s.ativo=true LIMIT 1;
 IF sku IS NOT NULL THEN INSERT INTO public.entitlements(aluno_id,sku_id,status,data_inicio) VALUES(NEW.id,sku,'ativo',current_date) ON CONFLICT DO NOTHING; END IF;
 RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.fn_treino_notificar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.system_events(entity_type,entity_id,event_type,metadata) VALUES('treino',NEW.id,CASE WHEN TG_OP='INSERT' THEN 'training.created' ELSE 'training.updated' END,jsonb_build_object('aluno_id',NEW.aluno_id,'data_inicio',NEW.data_inicio,'data_fim',NEW.data_fim));
 IF TG_OP='INSERT' THEN INSERT INTO public.notificacoes(tipo,titulo,mensagem,destinatario_tipo,destinatario_id,status) VALUES('treino','Novo treino disponível','Seu professor cadastrou um novo treino. Confira no app!','aluno',NEW.aluno_id,'pendente'); END IF;
 RETURN NEW;
END; $$;
