
ALTER TABLE public.organization_facilities ADD COLUMN IF NOT EXISTS observacoes text;

CREATE OR REPLACE FUNCTION public.revise_workout(p_original uuid,p_reason text,p_request_id uuid,p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old public.treinos; result uuid;
BEGIN
 SELECT * INTO old FROM public.treinos WHERE id=p_original FOR UPDATE;
 IF auth.uid() IS NULL OR old.id IS NULL OR NOT public.persona_has_role(old.organization_id,ARRAY['manager','professor']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF length(btrim(coalesce(p_reason,'')))<3 OR (p_payload->>'aluno_id')::uuid IS DISTINCT FROM old.aluno_id THEN RAISE EXCEPTION 'Revisão inválida'; END IF;
 SELECT treino_id INTO result FROM public.workout_publications WHERE request_id=p_request_id AND user_id=auth.uid();
 IF FOUND THEN RETURN result; END IF;
 IF old.status='revisado' THEN RAISE EXCEPTION 'Este treino já foi revisado. Atualize a lista'; END IF;
 result:=public.publish_workout(p_request_id,p_payload);
 UPDATE public.treinos SET status='revisado' WHERE id=old.id;
 INSERT INTO public.notificacoes(tipo,titulo,mensagem,destinatario_tipo,destinatario_id,prioridade,status,canal)
 VALUES('treino','Treino revisado',left(p_reason,2000),'aluno',old.aluno_id,'normal','pendente',ARRAY['app']);
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.mark_class_attendance(p_aula_id uuid,p_aluno_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.aulas;
BEGIN
 SELECT * INTO c FROM public.aulas WHERE id=p_aula_id FOR UPDATE;
 IF auth.uid() IS NULL OR c.id IS NULL OR NOT(public.is_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.funcionarios f WHERE f.id=c.professor_id AND f.user_id=auth.uid() AND f.ativo) OR public.persona_has_role(c.organization_id,ARRAY['manager'])) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF c.status='cancelada' OR (c.data_aula+c.horario_inicio)>(now() AT TIME ZONE 'America/Sao_Paulo')+interval '15 minutes' THEN RAISE EXCEPTION 'Chamada indisponível'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.aulas_inscritos WHERE aula_id=c.id AND aluno_id=p_aluno_id AND status IN('inscrito','presente')) THEN RAISE EXCEPTION 'Aluno não inscrito'; END IF;
 UPDATE public.aulas_inscritos SET status='presente' WHERE aula_id=c.id AND aluno_id=p_aluno_id;
 PERFORM public.record_daily_checkin(p_aluno_id,c.data_aula);
END; $$;

CREATE OR REPLACE FUNCTION public.assign_organization_member(p_org uuid,p_user uuid,p_role text,p_remove boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u auth.users; staff_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Ação exclusiva do administrador'; END IF;
 IF p_role IS NULL OR p_role NOT IN('sindico','professor','user','manager','corporate') THEN RAISE EXCEPTION 'Papel inválido'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.organizations WHERE id=p_org) THEN RAISE EXCEPTION 'Organização inválida'; END IF;
 SELECT * INTO u FROM auth.users WHERE id=p_user;
 IF u.id IS NULL THEN RAISE EXCEPTION 'Conta não encontrada'; END IF;
 IF p_remove THEN
  DELETE FROM public.organization_members WHERE organization_id=p_org AND user_id=p_user AND papel::text=p_role;
  IF p_role='professor' THEN UPDATE public.funcionarios SET ativo=false WHERE organization_id=p_org AND user_id=p_user; END IF;
 ELSE
  INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(p_org,p_user,p_role::public.app_role) ON CONFLICT DO NOTHING;
  IF p_role='professor' THEN
   SELECT id INTO staff_id FROM public.funcionarios WHERE organization_id=p_org AND user_id=p_user LIMIT 1;
   IF staff_id IS NOT NULL THEN UPDATE public.funcionarios SET ativo=true WHERE id=staff_id;
   ELSE INSERT INTO public.funcionarios(organization_id,user_id,nome,email,cargo,ativo) VALUES(p_org,p_user,coalesce(nullif(u.raw_user_meta_data->>'nome',''),split_part(u.email,'@',1)),u.email,'professor',true); END IF;
  END IF;
 END IF;
 INSERT INTO public.user_access_audit(user_id,organization_id,event,metadata) VALUES(auth.uid(),p_org,'admin_action',jsonb_build_object('action',CASE WHEN p_remove THEN 'remove_member' ELSE 'assign_member' END,'target',p_user,'role',p_role));
END; $$;

CREATE OR REPLACE FUNCTION public.save_announcement(p_id uuid,p_org uuid,p_title text,p_message text,p_event uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.persona_has_role(p_org,ARRAY['sindico','manager']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF length(btrim(coalesce(p_title,'')))<3 OR length(btrim(coalesce(p_message,'')))<3 THEN RAISE EXCEPTION 'Informe título e mensagem'; END IF;
 IF p_event IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.eventos_condominio WHERE id=p_event AND organization_id=p_org) THEN RAISE EXCEPTION 'Evento inválido'; END IF;
 IF p_id IS NULL THEN INSERT INTO public.organization_announcements(organization_id,titulo,mensagem,publico,event_id) VALUES(p_org,left(btrim(p_title),200),left(btrim(p_message),4000),CASE WHEN p_event IS NULL THEN 'condominio' ELSE 'evento' END,p_event) RETURNING id INTO result;
 ELSE
  UPDATE public.organization_announcements SET titulo=left(btrim(p_title),200),mensagem=left(btrim(p_message),4000),publico=CASE WHEN p_event IS NULL THEN 'condominio' ELSE 'evento' END,event_id=p_event WHERE id=p_id AND organization_id=p_org AND status='rascunho' RETURNING id INTO result;
  IF result IS NULL THEN RAISE EXCEPTION 'Somente rascunhos podem ser editados'; END IF;
 END IF;
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.save_condominium_event(p_id uuid,p_org uuid,p_name text,p_description text,p_date date,p_start time,p_end time,p_capacity integer,p_location text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result uuid; n integer; current_status text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.persona_has_role(p_org,ARRAY['sindico','manager']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF length(btrim(coalesce(p_name,'')))<3 OR p_date IS NULL OR p_start IS NULL OR p_end IS NULL OR p_end<=p_start OR p_capacity IS NULL OR p_capacity<1 OR (p_date+p_start)<=(now() AT TIME ZONE 'America/Sao_Paulo') THEN RAISE EXCEPTION 'Confira nome, data futura, horários e vagas'; END IF;
 IF p_id IS NULL THEN INSERT INTO public.eventos_condominio(organization_id,nome,descricao,data_evento,horario_inicio,horario_fim,vagas_totais,local,status,ativo)
 VALUES(p_org,left(btrim(p_name),200),left(p_description,4000),p_date,p_start,p_end,p_capacity,left(p_location,200),'rascunho',true) RETURNING id INTO result;
 ELSE
  SELECT status INTO current_status FROM public.eventos_condominio WHERE id=p_id AND organization_id=p_org FOR UPDATE;
  IF current_status IS NULL OR current_status NOT IN('rascunho','publicado') THEN RAISE EXCEPTION 'Evento encerrado ou indisponível'; END IF;
  SELECT count(*) INTO n FROM public.health_day_inscricoes WHERE evento_id=p_id AND status IN('confirmado','checkin');
  IF p_capacity<n THEN RAISE EXCEPTION 'Vagas não podem ser menores que as inscrições confirmadas'; END IF;
  UPDATE public.eventos_condominio SET nome=left(btrim(p_name),200),descricao=left(p_description,4000),data_evento=p_date,horario_inicio=p_start,horario_fim=p_end,vagas_totais=p_capacity,local=left(p_location,200) WHERE id=p_id RETURNING id INTO result;
 END IF;
 RETURN result;
END; $$;

REVOKE ALL ON FUNCTION public.revise_workout(uuid,text,uuid,jsonb),public.mark_class_attendance(uuid,uuid),public.assign_organization_member(uuid,uuid,text,boolean),public.save_announcement(uuid,uuid,text,text,uuid),public.save_condominium_event(uuid,uuid,text,text,date,time,time,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.revise_workout(uuid,text,uuid,jsonb),public.mark_class_attendance(uuid,uuid),public.assign_organization_member(uuid,uuid,text,boolean),public.save_announcement(uuid,uuid,text,text,uuid),public.save_condominium_event(uuid,uuid,text,text,date,time,time,integer,text) TO authenticated;

