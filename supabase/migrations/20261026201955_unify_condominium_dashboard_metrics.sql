-- Canonical dashboard: one authorized snapshot, one tenant, one definition of active.
BEGIN;
CREATE OR REPLACE FUNCTION app_private.resident_active(p_status text,p_lifecycle text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT coalesce(p_status='ativo' AND p_lifecycle='ativo',false);
$$;

CREATE OR REPLACE FUNCTION app_private.condominium_snapshot(p_org uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;result jsonb;
BEGIN
 IF p_org IS NULL OR NOT app_private.org_role(p_org,ARRAY['admin','manager','sindico']) THEN
  RAISE EXCEPTION 'Sem permissão para os indicadores deste condomínio' USING ERRCODE='42501';
 END IF;
 SELECT jsonb_build_object(
 'organization_id',p_org,'metrics_version','2026-10-26.1','as_of',now(),'timezone','America/Sao_Paulo',
 'metadata',o.metadata,
 'activation',jsonb_build_object(
  'moradores_ativos',(SELECT count(*) FROM public.alunos a WHERE a.organization_id=p_org AND app_private.resident_active(a.status,a.lifecycle_status::text)),
  'treinos_ativos',(SELECT count(*) FROM public.treinos t WHERE t.organization_id=p_org AND t.status='ativo' AND t.data_inicio<=today AND (t.data_fim IS NULL OR t.data_fim>=today)),
  'eventos_publicados',(SELECT count(*) FROM public.eventos_condominio e WHERE e.organization_id=p_org AND e.status='publicado' AND e.ativo=true AND e.data_evento>=today),
  'checkins_30_dias',(SELECT count(*) FROM public.checkins c JOIN public.alunos a ON a.id=c.aluno_id WHERE a.organization_id=p_org AND c.data_checkin BETWEEN today-29 AND today)),
 'financial',jsonb_build_object(
  'organization_id',p_org,
  'alunos_ativos',(SELECT count(*) FROM public.alunos a WHERE a.organization_id=p_org AND app_private.resident_active(a.status,a.lifecycle_status::text)),
  'receita_mes',(SELECT coalesce(sum(p.valor),0) FROM public.pagamentos p JOIN public.alunos a ON a.id=p.aluno_id WHERE a.organization_id=p_org AND p.status='pago' AND p.data_pagamento BETWEEN date_trunc('month',today)::date AND today),
  'inadimplentes',(SELECT count(DISTINCT p.aluno_id) FROM public.pagamentos p JOIN public.alunos a ON a.id=p.aluno_id WHERE a.organization_id=p_org AND p.status IN('pendente','atrasado') AND p.data_vencimento<today),
  'valor_inadimplencia',(SELECT coalesce(sum(p.valor),0) FROM public.pagamentos p JOIN public.alunos a ON a.id=p.aluno_id WHERE a.organization_id=p_org AND p.status IN('pendente','atrasado') AND p.data_vencimento<today),
  'aulas_hoje',(SELECT count(*) FROM public.aulas c WHERE c.organization_id=p_org AND c.data_aula=today AND c.status<>'cancelada'),
  'ocupacao_media',(SELECT round(avg(c.inscritos_atual::numeric/nullif(c.capacidade_maxima,0)*100),1) FROM public.aulas c WHERE c.organization_id=p_org AND c.data_aula BETWEEN today-29 AND today AND c.status<>'cancelada'),
  'status',CASE WHEN EXISTS(SELECT 1 FROM public.pagamentos p JOIN public.alunos a ON a.id=p.aluno_id WHERE a.organization_id=p_org AND p.status IN('pendente','atrasado') AND p.data_vencimento<today) THEN 'atencao' ELSE 'saudavel' END),
 'summary',jsonb_build_object(
  'organization_id',p_org,
  'residents',coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'nome',a.nome,'status',a.status,'unidade',a.unidade,'is_active',app_private.resident_active(a.status,a.lifecycle_status::text)) ORDER BY a.nome) FROM public.alunos a WHERE a.organization_id=p_org),'[]'::jsonb),
  'checkins_month',(SELECT count(*) FROM public.checkins c JOIN public.alunos a ON a.id=c.aluno_id WHERE a.organization_id=p_org AND c.data_checkin BETWEEN date_trunc('month',today)::date AND today),
  'active_workouts',(SELECT count(*) FROM public.treinos t WHERE t.organization_id=p_org AND t.status='ativo' AND t.data_inicio<=today AND (t.data_fim IS NULL OR t.data_fim>=today)),
  'engagement',coalesce((SELECT jsonb_agg(jsonb_build_object('mes',x.ym,'checkins',x.n) ORDER BY x.ym) FROM(SELECT to_char(c.data_checkin,'YYYY-MM') ym,count(*) n FROM public.checkins c JOIN public.alunos a ON a.id=c.aluno_id WHERE a.organization_id=p_org AND c.data_checkin BETWEEN (date_trunc('month',today)-interval '5 months')::date AND today GROUP BY 1)x),'[]'::jsonb),
  'classes',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'nome',c.nome,'data',c.data_aula,'horario_inicio',c.horario_inicio,'horario_fim',c.horario_fim,'professor',coalesce(f.nome,'A definir'),'capacidade',c.capacidade_maxima,'inscritos',c.inscritos_atual) ORDER BY c.data_aula,c.horario_inicio) FROM public.aulas c LEFT JOIN public.funcionarios f ON f.id=c.professor_id AND f.organization_id=p_org WHERE c.organization_id=p_org AND c.data_aula BETWEEN today AND today+6 AND c.status<>'cancelada'),'[]'::jsonb)),
 'actions',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT id,alert_type,action_label,created_at,acted_by,resolved_at FROM public.organization_activation_alert_actions WHERE organization_id=p_org ORDER BY created_at DESC,id LIMIT 100)x),'[]'::jsonb),
 'tickets',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT id,message,status,created_at,agent_response FROM public.support_tickets WHERE organization_id=p_org AND (category IN('condominio','infraestrutura','areas','servicos') OR created_by=auth.uid() OR app_private.org_role(p_org,ARRAY['admin','manager'])) ORDER BY created_at DESC,id LIMIT 20)x),'[]'::jsonb)
 ) INTO result FROM public.organizations o WHERE o.id=p_org;
 IF result IS NULL THEN RAISE EXCEPTION 'Condomínio indisponível' USING ERRCODE='42501'; END IF;
 RETURN result;
END; $$;
CREATE OR REPLACE FUNCTION public.condominium_dashboard(p_org_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.condominium_snapshot(p_org_id);
$$;
CREATE OR REPLACE FUNCTION public.dashboard_sindico(p_org_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.condominium_snapshot(p_org_id)->'financial';
$$;
CREATE OR REPLACE FUNCTION public.organization_activation_metrics(p_organization_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT (app_private.condominium_snapshot(p_organization_id)->'activation')||jsonb_build_object('organization_id',p_organization_id);
$$;
CREATE OR REPLACE FUNCTION public.syndic_operational_summary(p_org uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.condominium_snapshot(p_org)->'summary';
$$;
REVOKE ALL ON FUNCTION app_private.resident_active(text,text),app_private.condominium_snapshot(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.resident_active(text,text),app_private.condominium_snapshot(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.condominium_dashboard(uuid),public.dashboard_sindico(uuid),public.organization_activation_metrics(uuid),public.syndic_operational_summary(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.condominium_dashboard(uuid),public.dashboard_sindico(uuid),public.organization_activation_metrics(uuid),public.syndic_operational_summary(uuid) TO authenticated;
COMMIT;
