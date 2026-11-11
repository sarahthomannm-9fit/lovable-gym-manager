begin;
create table public.coach_followup_actions(
 session_id uuid primary key references public.workout_sessions(id),
 aluno_id uuid not null references public.alunos(id),
 organization_id uuid not null references public.organizations(id),
 actor_id uuid not null references auth.users(id),
 note text not null check(length(btrim(note)) between 3 and 2000),
 resolved boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.coach_followup_actions enable row level security;
revoke all on public.coach_followup_actions from public,anon,authenticated;
grant select on public.coach_followup_actions to authenticated;
create policy coach_followup_read on public.coach_followup_actions for select to authenticated
 using(app_private.student_matches(aluno_id,organization_id) and app_private.student_role(aluno_id,array['admin','manager','professor']));

create function public.coach_student_case(p_student uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare student public.alunos; capture public.anamnese_respostas; safety public.student_safety_onboarding; queue public.treinos_ia_fila; ready boolean; eligible boolean;
begin
 if not app_private.session_valid() or not app_private.student_role(p_student,array['admin','manager','professor']) then raise exception 'Morador fora do seu atendimento' using errcode='42501'; end if;
 select * into strict student from public.alunos where id=p_student;
 select * into capture from public.anamnese_respostas where aluno_id=p_student and status in ('preenchido','aprovado') order by preenchido_em desc nulls last,id desc limit 1;
 select * into safety from public.student_safety_onboarding where aluno_id=p_student and organization_id=student.organization_id;
 select * into queue from public.treinos_ia_fila where aluno_id=p_student and organization_id=student.organization_id
  and ((capture.id is not null and anamnese_id=capture.id) or (capture.id is null and anamnese_id is null)) order by created_at desc,id desc limit 1;
 ready:=public.student_is_safe_for_workout(p_student);
 eligible:=app_private.resident_active(student.status,student.lifecycle_status::text) and safety.consentimento is true
  and (ready or (queue.status='pendente' and queue.anamnese_id=capture.id and safety.risco='baixo'));
 return jsonb_build_object(
  'student',jsonb_build_object('id',student.id,'nome',student.nome,'organization_id',student.organization_id,'status',student.status,'lifecycle_status',student.lifecycle_status),
  'capture',case when capture.id is not null then jsonb_build_object('id',capture.id,'tipo',capture.tipo,'status',capture.status,'preenchido_em',capture.preenchido_em,'respostas',capture.respostas) end,
  'safety',case when safety.id is not null then to_jsonb(safety) end,'queue',case when queue.id is not null then to_jsonb(queue) end,
  'can_prescribe',coalesce(eligible,false),'can_publish_direct',coalesce(ready,false),
  'workouts',coalesce((select jsonb_agg(row_data order by created_at desc) from (select to_jsonb(t)||jsonb_build_object('published',exists(select 1 from public.workout_publications p where p.treino_id=t.id)) as row_data,t.created_at from public.treinos t where t.aluno_id=p_student and t.organization_id=student.organization_id order by t.created_at desc limit 100) list),'[]'::jsonb),
  'sessions',coalesce((select jsonb_agg(to_jsonb(s) order by s.data desc) from (select * from public.workout_sessions where aluno_id=p_student order by data desc,updated_at desc limit 60) s),'[]'::jsonb),
  'followups',coalesce((select jsonb_agg(to_jsonb(f)) from public.coach_followup_actions f where f.aluno_id=p_student),'[]'::jsonb),
  'equipment',coalesce((select jsonb_agg(nome order by nome) from public.organization_facilities where organization_id=student.organization_id and status='aprovado'),'[]'::jsonb)
 );
end; $$;

create function public.record_coach_followup(p_session uuid,p_note text,p_resolved boolean)
returns void language plpgsql security definer set search_path='' as $$
declare session_row public.workout_sessions; student public.alunos;
begin
 select * into session_row from public.workout_sessions where id=p_session;
 if not app_private.session_valid() or session_row.id is null or not app_private.student_role(session_row.aluno_id,array['admin','manager','professor']) then raise exception 'Sessão fora do seu atendimento' using errcode='42501'; end if;
 if coalesce(length(btrim(p_note)),0) not between 3 and 2000 or p_resolved is null then raise exception 'Registre a orientação ou encaminhamento'; end if;
 select * into strict student from public.alunos where id=session_row.aluno_id;
 insert into public.coach_followup_actions(session_id,aluno_id,organization_id,actor_id,note,resolved)
 values(p_session,student.id,student.organization_id,auth.uid(),btrim(p_note),p_resolved)
 on conflict(session_id) do update set actor_id=auth.uid(),note=excluded.note,resolved=excluded.resolved,updated_at=now();
 insert into public.user_access_audit(user_id,organization_id,event,metadata) values(auth.uid(),student.organization_id,'admin_action',jsonb_build_object('action','coach_followup','session_id',p_session,'resolved',p_resolved));
end; $$;

create function public.coach_publish_workout(p_request uuid,p_payload jsonb,p_original uuid default null,p_reason text default null,p_queue uuid default null,p_capture uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare student public.alunos; previous public.workout_publications; result uuid; source public.anamnese_respostas; original public.treinos;
begin
 if not app_private.session_valid() or p_request is null or p_payload is null then raise exception 'Publicação indisponível' using errcode='42501'; end if;
 select * into student from public.alunos where id=(p_payload->>'aluno_id')::uuid for update;
 if student.id is null or not app_private.student_role(student.id,array['manager','professor']) then raise exception 'Morador fora do seu atendimento' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 select * into previous from public.workout_publications where request_id=p_request;
 if previous.request_id is not null then
  if previous.user_id<>auth.uid() or previous.payload<>p_payload or not exists(select 1 from public.treinos where id=previous.treino_id and aluno_id=student.id) then raise exception 'Identificador de publicação já utilizado'; end if;
  return previous.treino_id;
 end if;
 if p_original is not null and p_queue is not null then raise exception 'Escolha revisão ou publicação de triagem'; end if;
 if p_capture is not null then
  select * into source from public.anamnese_respostas where id=p_capture and aluno_id=student.id for update;
  if source.id is null or source.tipo='par_q_portaria' or source.respostas->'triagem_portaria'='true'::jsonb
   or exists(select 1 from public.anamnese_respostas newer where newer.aluno_id=student.id and newer.status in ('preenchido','aprovado') and (newer.preenchido_em,newer.id)>(source.preenchido_em,source.id)) then raise exception 'Atualize a captura antes de publicar'; end if;
 end if;
 if p_original is not null then
  select * into original from public.treinos where id=p_original for update;
  if original.id is null or original.aluno_id<>student.id or original.organization_id<>student.organization_id or original.status='revisado' or coalesce(length(btrim(p_reason)),0)<3 then raise exception 'Revisão inválida ou plano já revisado'; end if;
  result:=public.publish_workout(p_request,p_payload);
  update public.treinos set status='revisado' where id=original.id;
  insert into public.user_access_audit(user_id,organization_id,event,metadata) values(auth.uid(),student.organization_id,'admin_action',jsonb_build_object('action','coach_workout_revision','original',original.id,'workout',result,'reason',left(p_reason,2000)));

 elsif p_queue is not null then result:=public.publish_triage_workout(p_queue,p_request,p_payload);
 else result:=public.publish_workout(p_request,p_payload); end if;
 if p_capture is not null then update public.anamnese_respostas set status='aprovado' where id=p_capture; end if;
 return result;
end; $$;
revoke all on function public.coach_student_case(uuid),public.record_coach_followup(uuid,text,boolean),public.coach_publish_workout(uuid,jsonb,uuid,text,uuid,uuid) from public,anon;
grant execute on function public.coach_student_case(uuid),public.record_coach_followup(uuid,text,boolean),public.coach_publish_workout(uuid,jsonb,uuid,text,uuid,uuid) to authenticated;
create function public.coach_operation_summary(p_org uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not app_private.org_role(p_org,array['admin','manager','professor']) then raise exception 'Condomínio fora do seu acesso' using errcode='42501'; end if;
 return jsonb_build_object('students',public.coach_student_roster(p_org),
 'workouts',coalesce((select jsonb_agg(to_jsonb(t)||jsonb_build_object('published',exists(select 1 from public.workout_publications p where p.treino_id=t.id)) order by t.created_at desc) from public.treinos t where t.organization_id=p_org and app_private.student_role(t.aluno_id,array['admin','manager','professor'])),'[]'::jsonb),
 'activity',coalesce((select jsonb_agg(to_jsonb(x)) from (select s.treino_id,max(s.completed_at) as last_session,count(*) as completions from public.workout_sessions s join public.treinos t on t.id=s.treino_id where t.organization_id=p_org and s.status='concluido' and s.completed_at is not null and app_private.student_role(s.aluno_id,array['admin','manager','professor']) group by s.treino_id) x),'[]'::jsonb),
 'queue',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'aluno_id',q.aluno_id,'anamnese_id',q.anamnese_id,'status',q.status,'created_at',q.created_at,'objetivo',q.objetivo) order by q.created_at) from public.treinos_ia_fila q where q.organization_id=p_org and (q.anamnese_id is null or exists(select 1 from public.anamnese_respostas source where source.id=q.anamnese_id and not exists(select 1 from public.anamnese_respostas newer where newer.aluno_id=q.aluno_id and newer.status in ('preenchido','aprovado') and (newer.preenchido_em,newer.id)>(source.preenchido_em,source.id)))) and app_private.student_role(q.aluno_id,array['admin','manager','professor']) and (q.status='pendente' or (q.status='rejeitado' and q.anamnese_id is not null and q.aprovado_em is null))),'[]'::jsonb),
 'feedbacks',coalesce((select jsonb_agg(to_jsonb(x) order by x.data desc) from (select s.id,s.aluno_id,s.treino_id,s.data,s.feedback,coalesce(f.resolved,false) as resolved from public.workout_sessions s join public.alunos a on a.id=s.aluno_id left join public.coach_followup_actions f on f.session_id=s.id where a.organization_id=p_org and nullif(btrim(s.feedback),'') is not null and app_private.student_role(a.id,array['admin','manager','professor']) order by s.data desc,s.updated_at desc limit 100) x),'[]'::jsonb));
end; $$;
revoke all on function public.coach_operation_summary(uuid) from public,anon;
grant execute on function public.coach_operation_summary(uuid) to authenticated;

commit;
