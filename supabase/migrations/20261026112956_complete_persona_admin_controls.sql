
CREATE OR REPLACE FUNCTION public.set_user_global_role(p_user uuid,p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) OR p_role IS NULL OR p_role NOT IN('admin','manager','user','sindico','professor','corporate') THEN RAISE EXCEPTION 'Sem permissão ou papel inválido'; END IF;
 IF p_user=auth.uid() AND p_role<>'admin' THEN RAISE EXCEPTION 'Você não pode remover o próprio acesso de administrador'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user) THEN RAISE EXCEPTION 'Usuário não encontrado'; END IF;
 DELETE FROM public.user_roles WHERE user_id=p_user;
 INSERT INTO public.user_roles(user_id,role) VALUES(p_user,p_role::public.app_role);
END; $$;

CREATE OR REPLACE FUNCTION public.wipe_demo_organization(p_org uuid,p_confirmation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE t text;n integer;result jsonb:='{}'::jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) OR p_confirmation<>'LIMPAR DEMONSTRACAO' THEN RAISE EXCEPTION 'Confirmação inválida'; END IF;
 PERFORM 1 FROM public.organizations WHERE id=p_org AND coalesce((metadata->>'is_demo')::boolean,false)=true FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Esta organização não está marcada como demonstração'; END IF;
 FOREACH t IN ARRAY ARRAY['treinos','aulas','eventos_condominio','alunos','planos_treino','planos','equipamentos','funcionarios'] LOOP
  EXECUTE format('DELETE FROM public.%I WHERE organization_id=$1',t) USING p_org;
  GET DIAGNOSTICS n=ROW_COUNT;
  result:=result||jsonb_build_object(t,n);
 END LOOP;
 INSERT INTO public.user_access_audit(user_id,organization_id,event,metadata) VALUES(auth.uid(),p_org,'admin_action',jsonb_build_object('action','wipe_demo','counts',result));
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.syndic_operational_summary(p_org uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;result jsonb;
BEGIN
 IF NOT public.persona_has_role(p_org,ARRAY['sindico','manager']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 SELECT jsonb_build_object(
 'residents',coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'nome',a.nome,'status',a.status,'unidade',a.unidade) ORDER BY a.nome) FROM public.alunos a WHERE a.organization_id=p_org),'[]'::jsonb),
 'checkins_month',(SELECT count(*) FROM public.checkins c JOIN public.alunos a ON a.id=c.aluno_id WHERE a.organization_id=p_org AND c.data_checkin>=date_trunc('month',today)::date),
 'active_workouts',(SELECT count(*) FROM public.treinos t WHERE t.organization_id=p_org AND t.status='ativo' AND t.data_inicio<=today AND (t.data_fim IS NULL OR t.data_fim>=today)),
 'engagement',coalesce((SELECT jsonb_agg(jsonb_build_object('mes',x.ym,'checkins',x.n) ORDER BY x.ym) FROM(SELECT to_char(c.data_checkin,'YYYY-MM') AS ym,count(*) n FROM public.checkins c JOIN public.alunos a ON a.id=c.aluno_id WHERE a.organization_id=p_org AND c.data_checkin>=today-interval '6 months' GROUP BY 1)x),'[]'::jsonb),
 'classes',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'nome',c.nome,'data',c.data_aula,'horario_inicio',c.horario_inicio,'horario_fim',c.horario_fim,'professor',coalesce(f.nome,'A definir'),'capacidade',c.capacidade_maxima,'inscritos',c.inscritos_atual) ORDER BY c.data_aula,c.horario_inicio) FROM public.aulas c LEFT JOIN public.funcionarios f ON f.id=c.professor_id WHERE c.organization_id=p_org AND c.data_aula BETWEEN today AND today+7 AND c.status<>'cancelada'),'[]'::jsonb)
 ) INTO result;
 RETURN result;
END; $$;
CREATE OR REPLACE FUNCTION public.save_activation_goals(p_org uuid,p_goals jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.persona_has_role(p_org,ARRAY['sindico','manager']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF p_goals IS NULL OR coalesce((p_goals->>'moradores')::integer,0)<1 OR coalesce((p_goals->>'checkins')::integer,0)<1 OR coalesce((p_goals->>'eventos')::integer,0)<1 THEN RAISE EXCEPTION 'Informe metas positivas'; END IF;
 UPDATE public.organizations SET metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('activation_goals',p_goals) WHERE id=p_org;
END; $$;

CREATE OR REPLACE FUNCTION public.dashboard_coach(p_prof_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f public.funcionarios;today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 SELECT * INTO f FROM public.funcionarios WHERE id=p_prof_id;
 IF auth.uid() IS NULL OR f.id IS NULL OR NOT(f.user_id=auth.uid() OR public.persona_has_role(f.organization_id,ARRAY['manager'])) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 RETURN jsonb_build_object(
 'aulas_hoje',(SELECT jsonb_agg(to_jsonb(c)) FROM public.aulas c WHERE c.professor_id=f.id AND c.data_aula=today AND c.status<>'cancelada'),
 'total_alunos',(SELECT count(DISTINCT ai.aluno_id) FROM public.aulas_inscritos ai JOIN public.aulas c ON c.id=ai.aula_id WHERE c.professor_id=f.id AND ai.status IN('inscrito','presente')),
 'checkins_hoje',(SELECT count(*) FROM public.aulas_inscritos ai JOIN public.aulas c ON c.id=ai.aula_id WHERE c.professor_id=f.id AND c.data_aula=today AND ai.status='presente'),
 'proximas_aulas',(SELECT jsonb_agg(to_jsonb(c)) FROM(SELECT * FROM public.aulas WHERE professor_id=f.id AND data_aula>today AND status<>'cancelada' ORDER BY data_aula,horario_inicio LIMIT 5)c));
END; $$;
CREATE OR REPLACE FUNCTION public.dashboard_morador(p_aluno_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.alunos;today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 SELECT * INTO a FROM public.alunos WHERE id=p_aluno_id;
 IF auth.uid() IS NULL OR a.id IS NULL OR NOT(a.user_id=auth.uid() OR public.is_admin(auth.uid())) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 RETURN jsonb_build_object(
 'proxima_aula',(SELECT to_jsonb(c) FROM public.aulas_inscritos ai JOIN public.aulas c ON c.id=ai.aula_id WHERE ai.aluno_id=a.id AND c.data_aula>=today AND c.status<>'cancelada' AND ai.status IN('inscrito','presente') ORDER BY c.data_aula,c.horario_inicio LIMIT 1),
 'presencas_mes',(SELECT count(*) FROM public.checkins WHERE aluno_id=a.id AND data_checkin>=date_trunc('month',today)::date),
 'pagamentos_pendentes',(SELECT count(*) FROM public.pagamentos WHERE aluno_id=a.id AND status IN('pendente','atrasado')),
 'valor_pendente',(SELECT coalesce(sum(valor),0) FROM public.pagamentos WHERE aluno_id=a.id AND status IN('pendente','atrasado')),
 'treino_hoje',(SELECT to_jsonb(t) FROM public.treinos t WHERE aluno_id=a.id AND status='ativo' AND data_inicio<=today AND (data_fim IS NULL OR data_fim>=today) ORDER BY created_at DESC LIMIT 1),
 'notificacoes_nao_lidas',(SELECT count(*) FROM public.notificacoes WHERE destinatario_id=a.id AND status='pendente'),
 'status_aluno',jsonb_build_object('lifecycle',a.lifecycle_status,'plano_id',a.plano_id,'mensalidade',a.valor_mensalidade,'data_matricula',a.data_matricula));
END; $$;
CREATE OR REPLACE FUNCTION public.criar_notificacao(p_tipo text,p_titulo text,p_mensagem text,p_destinatario_id uuid,p_destinatario_tipo text DEFAULT 'aluno',p_prioridade text DEFAULT 'normal',p_canal text[] DEFAULT ARRAY['app'])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.alunos;result uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 SELECT * INTO a FROM public.alunos WHERE id=p_destinatario_id;
 IF a.id IS NULL OR NOT public.persona_has_role(a.organization_id,ARRAY['manager','professor','sindico']) OR p_destinatario_tipo<>'aluno' THEN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 END IF;
 INSERT INTO public.notificacoes(tipo,titulo,mensagem,destinatario_tipo,destinatario_id,prioridade,status,canal)
 VALUES(p_tipo,left(p_titulo,200),left(p_mensagem,4000),p_destinatario_tipo,p_destinatario_id,p_prioridade,'pendente',p_canal) RETURNING id INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.set_user_global_role(uuid,text),public.wipe_demo_organization(uuid,text),public.syndic_operational_summary(uuid),public.save_activation_goals(uuid,jsonb),public.dashboard_coach(uuid),public.dashboard_morador(uuid),public.criar_notificacao(text,text,text,uuid,text,text,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_user_global_role(uuid,text),public.wipe_demo_organization(uuid,text),public.syndic_operational_summary(uuid),public.save_activation_goals(uuid,jsonb),public.dashboard_coach(uuid),public.dashboard_morador(uuid),public.criar_notificacao(text,text,text,uuid,text,text,text[]) TO authenticated;

