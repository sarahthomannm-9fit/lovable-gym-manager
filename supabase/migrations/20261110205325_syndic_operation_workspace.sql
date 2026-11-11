begin;
create table public.syndic_operation_requests(
 id uuid primary key,organization_id uuid not null references public.organizations(id),actor_id uuid not null references auth.users(id),
 kind text not null,target_id uuid,payload jsonb not null,result_id uuid not null,created_at timestamptz not null default now()
);
alter table public.syndic_operation_requests enable row level security;
revoke all on public.syndic_operation_requests from public,anon,authenticated;
create function public.syndic_operation_overview(p_org uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare snapshot jsonb; total integer; units_count integer; people integer; without_unit integer; org public.organizations;
begin
 if not app_private.org_role(p_org,array['admin','manager','sindico']) then raise exception 'Condomínio fora do seu acesso' using errcode='42501'; end if;
 snapshot:=public.condominium_dashboard(p_org);
 select * into strict org from public.organizations where id=p_org;
 if coalesce(org.metadata->>'total_unidades',org.metadata->>'unidades','') ~ '^[0-9]{1,6}$' then total:=coalesce(org.metadata->>'total_unidades',org.metadata->>'unidades')::integer; end if;
 if total is not null and total not between 1 and 100000 then total:=null; end if;
 select count(*),count(distinct lower(regexp_replace(btrim(unidade),'\s+',' ','g'))) filter(where nullif(btrim(unidade),'') is not null),count(*) filter(where nullif(btrim(unidade),'') is null)
 into people,units_count,without_unit from public.alunos where organization_id=p_org and user_id is not null and app_private.resident_active(status,lifecycle_status::text);
 return jsonb_build_object('organization_id',p_org,'name',org.nome,'status',org.status,'as_of',now(),
 'coverage',jsonb_build_object('units_total',total,'units_linked',units_count,'people_linked',people,'without_unit',without_unit,'percent',case when total>0 and units_count<=total then round(100.0*units_count/total,1) end),
 'summary',snapshot->'summary','financial',snapshot->'financial','activation',snapshot->'activation','actions',snapshot->'actions','tickets',snapshot->'tickets',
 'can_manage',true,'can_see_financials',true,
 'services_pending',(select count(*) from public.service_requests where organization_id=p_org and status in ('solicitada','cotada')),
 'reservations_pending',(select count(*) from public.area_reservations where organization_id=p_org and status='confirmada' and ends_at<=now()),
 'support',jsonb_build_object('phone',org.operational_profile->>'support_phone','hours',org.operational_profile->>'support_hours'));
end; $$;
create function public.syndic_event_list(p_org uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not app_private.org_role(p_org,array['admin','manager','sindico']) then raise exception 'Evento fora do seu acesso' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(to_jsonb(e)||jsonb_build_object(
 'confirmed',(select count(*) from public.health_day_inscricoes r where r.evento_id=e.id and r.status in ('confirmado','checkin')),
 'waiting',(select count(*) from public.health_day_inscricoes r where r.evento_id=e.id and r.status='lista_espera'),
 'present',(select count(*) from public.health_day_inscricoes r where r.evento_id=e.id and r.status='checkin'),
 'unverified',(select count(*) from public.health_day_preinscricoes r where r.evento_id=e.id and r.aluno_id is null)) order by e.data_evento desc,e.horario_inicio desc) from public.eventos_condominio e where e.organization_id=p_org),'[]'::jsonb);
end; $$;
create function public.syndic_announcements(p_org uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not app_private.org_role(p_org,array['admin','manager','sindico']) then raise exception 'Comunicados fora do seu acesso' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(to_jsonb(a)||jsonb_build_object(
 'reads',(select count(*) from public.organization_announcement_reads r where r.announcement_id=a.id and r.organization_id=p_org),
 'app_notifications',(select count(*) from public.notificacoes n where n.dados_extras->>'announcement_id'=a.id::text)) order by a.created_at desc) from public.organization_announcements a where a.organization_id=p_org),'[]'::jsonb);
end; $$;
create function public.syndic_save_operation(p_request uuid,p_org uuid,p_kind text,p_target uuid,p_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare previous public.syndic_operation_requests; result uuid;
begin
 if not app_private.org_role(p_org,array['admin','manager','sindico']) or p_request is null then raise exception 'Operação fora do seu acesso' using errcode='42501'; end if;
 if p_kind is null or jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'Operação inválida'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 select * into previous from public.syndic_operation_requests where id=p_request;
 if found then
  if previous.organization_id<>p_org or previous.actor_id<>auth.uid() or previous.kind<>p_kind or previous.target_id is distinct from p_target or previous.payload<>p_payload then raise exception 'Identificador já usado em outra operação'; end if;
  return previous.result_id;
 end if;
 if p_kind='event' then
  result:=public.save_condominium_event(p_target,p_org,p_payload->>'name',p_payload->>'description',(p_payload->>'date')::date,(p_payload->>'start')::time,(p_payload->>'end')::time,(p_payload->>'capacity')::integer,p_payload->>'location');
 elsif p_kind='announcement' then
  result:=public.save_announcement(p_target,p_org,p_payload->>'title',p_payload->>'message',nullif(p_payload->>'event','')::uuid);
 elsif p_kind in ('publish_announcement','archive_announcement') then
  if not exists(select 1 from public.organization_announcements where id=p_target and organization_id=p_org) then raise exception 'Comunicado fora do condomínio'; end if;
  if p_kind='publish_announcement' then perform public.publish_organization_announcement(p_target); else perform public.archive_organization_announcement(p_target); end if; result:=p_target;
 elsif p_kind='event_status' then
  if not exists(select 1 from public.eventos_condominio where id=p_target and organization_id=p_org) or coalesce(p_payload->>'status','') not in ('publicado','encerrado','cancelado') then raise exception 'Evento ou situação indisponível'; end if;
  perform public.set_condominium_event_status(p_target,p_payload->>'status');result:=p_target;
 else raise exception 'Operação não suportada'; end if;
 if result is null then raise exception 'Não foi possível confirmar o registro'; end if;
 insert into public.syndic_operation_requests(id,organization_id,actor_id,kind,target_id,payload,result_id) values(p_request,p_org,auth.uid(),p_kind,p_target,p_payload,result);
 insert into public.user_access_audit(user_id,organization_id,event,metadata) values(auth.uid(),p_org,'admin_action',jsonb_build_object('action','syndic_operation','kind',p_kind,'target',result));
 return result;
end; $$;
revoke all on function public.syndic_operation_overview(uuid),public.syndic_event_list(uuid),public.syndic_announcements(uuid),public.syndic_save_operation(uuid,uuid,text,uuid,jsonb) from public,anon;
grant execute on function public.syndic_operation_overview(uuid),public.syndic_event_list(uuid),public.syndic_announcements(uuid),public.syndic_save_operation(uuid,uuid,text,uuid,jsonb) to authenticated;
commit;
