create function public.resident_fitness_status(p_aluno uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
declare student public.alunos; safety public.student_safety_onboarding;
  decision public.treino_ia_status; triage_found boolean;
begin
  if not app_private.own_student(p_aluno) then
    raise exception 'Cadastro indisponível para esta sessão' using errcode = '42501';
  end if;
  select * into strict student from public.alunos where id=p_aluno;
  if not app_private.resident_active(student.status,student.lifecycle_status::text) then
    return 'cadastro';
  end if;
  select * into safety from public.student_safety_onboarding
    where aluno_id=p_aluno and organization_id=student.organization_id;
  if safety.id is null or safety.consentimento is not true then
    return 'preencher';
  end if;

  select queue.status into decision
  from public.anamnese_respostas source
  left join public.treinos_ia_fila queue on queue.anamnese_id=source.id
    and queue.aluno_id=p_aluno and queue.organization_id=student.organization_id
  where source.aluno_id=p_aluno
    and (queue.id is not null or source.respostas->'triagem_portaria'='true'::jsonb)
  order by source.preenchido_em desc nulls last, source.id desc
  limit 1;
  triage_found := found;
  if triage_found and decision is null then return 'processando'; end if;
  if decision='rejeitado' or safety.risco is distinct from 'baixo' then return 'avaliacao'; end if;
  return 'publicacao';
end;
$$;

revoke all on function public.resident_fitness_status(uuid) from public,anon;
grant execute on function public.resident_fitness_status(uuid) to authenticated;
