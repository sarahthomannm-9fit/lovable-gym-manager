begin;
do $metrics$
declare signature regprocedure; source text;patched text;
begin
 foreach signature in array array['public.condominium_fitness_usage(uuid)'::regprocedure,'public.health_day_impact(uuid)'::regprocedure,'public.coach_fitness_followup(uuid)'::regprocedure,'public.coach_operation_summary(uuid)'::regprocedure] loop
  select pg_get_functiondef(signature) into source;
  patched:=replace(source,$old$session.status = 'concluido'$old$,$new$session.status = 'concluido' and coalesce(session.completion_kind,'complete')='complete'$new$);
  patched:=replace(patched,$old$s.status = 'concluido'$old$,$new$s.status = 'concluido' and coalesce(s.completion_kind,'complete')='complete'$new$);
  patched:=replace(patched,$old$s.status='concluido'$old$,$new$s.status='concluido' and coalesce(s.completion_kind,'complete')='complete'$new$);
  if source=patched then raise exception 'Revisar contrato de métricas: %',signature;end if;
  if signature='public.coach_operation_summary(uuid)'::regprocedure then
   patched:=replace(patched,$old$coalesce(f.resolved,false) as resolved$old$,$new$(coalesce(f.resolved,false) and f.updated_at>=s.updated_at) as resolved$new$);
  end if;
  execute patched;
 end loop;
end $metrics$;
commit;
