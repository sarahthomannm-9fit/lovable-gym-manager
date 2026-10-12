alter table public.agent_workflow_tasks
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists last_error text,
  add column if not exists started_at timestamptz,
  add column if not exists duration_ms integer;

create or replace function public.claim_agent_workflow_task(p_task_id uuid)
returns public.agent_workflow_tasks
language plpgsql security definer set search_path=public
as $$
declare v_task public.agent_workflow_tasks;
begin
  update public.agent_workflow_tasks
  set status='running', attempt_count=attempt_count+1, started_at=now()
  where id=p_task_id and status='queued' and attempt_count < max_attempts
  returning * into v_task;
  if v_task.id is null then raise exception 'Tarefa indisponível ou limite de tentativas atingido'; end if;
  return v_task;
end;
$$;

create or replace function public.retry_agent_workflow_task(p_task_id uuid, p_error text)
returns public.agent_workflow_tasks
language plpgsql security definer set search_path=public
as $$
declare v_task public.agent_workflow_tasks;
begin
  update public.agent_workflow_tasks
  set status = case when attempt_count < max_attempts then 'queued' else 'failed' end,
      last_error=p_error,
      duration_ms=case when started_at is null then null else floor(extract(epoch from (now()-started_at))*1000)::int end
  where id=p_task_id
  returning * into v_task;
  return v_task;
end;
$$;

create or replace function public.approve_agent_workflow_task(p_task_id uuid)
returns public.agent_workflow_tasks
language plpgsql security definer set search_path=public
as $$
declare v_task public.agent_workflow_tasks;
begin
  update public.agent_workflow_tasks
  set status='queued'
  where id=p_task_id and status='waiting_human'
  returning * into v_task;
  return v_task;
end;
$$;

grant execute on function public.claim_agent_workflow_task(uuid) to authenticated;
grant execute on function public.retry_agent_workflow_task(uuid,text) to authenticated;
grant execute on function public.approve_agent_workflow_task(uuid) to authenticated;
