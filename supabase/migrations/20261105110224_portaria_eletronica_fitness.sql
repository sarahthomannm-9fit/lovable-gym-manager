begin;

alter table public.treinos_ia_fila enable row level security;
create unique index treino_ia_por_anamnese
  on public.treinos_ia_fila(anamnese_id);

-- The existing staff policies continue to scope legacy records.
create policy triage_service_insert on public.treinos_ia_fila
  as restrictive for insert to authenticated with check (anamnese_id is null);
create policy triage_service_update on public.treinos_ia_fila
  as restrictive for update to authenticated using (anamnese_id is null) with check (anamnese_id is null);
create policy triage_service_delete on public.treinos_ia_fila
  as restrictive for delete to authenticated using (anamnese_id is null);

create function public.publish_triage_workout(p_queue uuid, p_request_id uuid, p_payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  entry public.treinos_ia_fila;
  workout_id uuid;
  plan_id uuid;
begin
  perform 1 from public.alunos student
    join public.treinos_ia_fila queue on queue.aluno_id = student.id
    where queue.id = p_queue for update of student;
  select * into entry from public.treinos_ia_fila where id = p_queue for update;
  if entry.id is null or not app_private.student_matches(entry.aluno_id, entry.organization_id)
    or not app_private.student_role(entry.aluno_id, array['manager', 'professor']) then
    raise exception 'Sem permissão para prescrever neste condomínio' using errcode = '42501';
  end if;

  if p_payload is null then
    raise exception 'Confira os parâmetros antes de confirmar a publicação';
  end if;

  if (p_payload->>'aluno_id')::uuid is distinct from entry.aluno_id then
    raise exception 'O treino deve pertencer ao morador da triagem';
  end if;
  if entry.status = 'aprovado' and entry.plano_treino_id is not null then
    select publication.treino_id into workout_id
    from public.workout_publications publication
    join public.treinos treino on treino.id = publication.treino_id
    where publication.request_id = p_request_id
      and publication.user_id = auth.uid() and treino.plano_treino_id = entry.plano_treino_id;
    if found then return workout_id; end if;
  end if;
  if entry.status <> 'pendente' then
    raise exception 'Esta triagem não está disponível para publicação';
  end if;
  if entry.anamnese_id is not null and not exists (
    select 1 from public.anamnese_respostas source
    where source.id = entry.anamnese_id and source.status = 'preenchido'
      and not exists (
        select 1 from public.anamnese_respostas newer
        where newer.aluno_id = entry.aluno_id and newer.status in ('preenchido', 'aprovado')
          and (newer.preenchido_em, newer.id) > (source.preenchido_em, source.id)
      )
  ) then
    raise exception 'Existe uma anamnese mais recente ou a triagem está indisponível';
  end if;

  update public.treinos_ia_fila set status = 'aprovado', aprovado_por = auth.uid(),
    aprovado_em = now() where id = entry.id;
  workout_id := public.publish_workout(p_request_id, p_payload);
  select plano_treino_id into strict plan_id from public.treinos where id = workout_id;
  update public.treinos_ia_fila set plano_treino_id = plan_id where id = entry.id;
  return workout_id;
end;
$$;

create function public.dismiss_triage_workout(p_queue uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare entry public.treinos_ia_fila;
begin
  select * into entry from public.treinos_ia_fila where id = p_queue for update;
  if entry.id is null or not app_private.student_matches(entry.aluno_id, entry.organization_id)
    or not app_private.student_role(entry.aluno_id, array['manager', 'professor']) then
    raise exception 'Sem permissão para revisar neste condomínio' using errcode = '42501';
  end if;
  if entry.status <> 'pendente' then raise exception 'A sugestão já foi encaminhada ou revisada'; end if;
  update public.treinos_ia_fila set status = 'rejeitado', aprovado_por = auth.uid(),
    aprovado_em = case when entry.anamnese_id is null then now() else null end,
    resumo = case when entry.anamnese_id is not null then 'Sugestão encaminhada para avaliação profissional.' else resumo end
    where id = entry.id;
end;
$$;

revoke all on function public.publish_triage_workout(uuid, uuid, jsonb), public.dismiss_triage_workout(uuid)
  from public, anon;
grant execute on function public.publish_triage_workout(uuid, uuid, jsonb), public.dismiss_triage_workout(uuid)
  to authenticated;

-- The current PAR-Q decision is an additional gate for publication and delivery.
create or replace function public.student_is_safe_for_workout(p_aluno_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.student_safety_onboarding safety
    join public.alunos student on student.id = safety.aluno_id
      and student.organization_id = safety.organization_id
    where safety.aluno_id = p_aluno_id and safety.risco = 'baixo' and safety.consentimento
  ) and coalesce((
    select coalesce(queue.status = 'aprovado', false)
    from public.anamnese_respostas source
    join public.alunos student on student.id = source.aluno_id
    left join public.treinos_ia_fila queue on queue.anamnese_id = source.id
      and queue.organization_id = student.organization_id
    where source.aluno_id = p_aluno_id
      and (queue.id is not null or source.respostas->'triagem_portaria' = 'true'::jsonb)
    order by source.preenchido_em desc nulls last, source.id desc
    limit 1
  ), true);
$$;

-- The same gate applies to direct reads of assigned plans through PostgREST.
create function app_private.own_student_with_workout_access(p_aluno_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.own_student(p_aluno_id) and public.student_is_safe_for_workout(p_aluno_id);
$$;
revoke all on function app_private.own_student_with_workout_access(uuid) from public, anon;
grant execute on function app_private.own_student_with_workout_access(uuid) to authenticated;
alter policy tenant_select on public.treinos using (
  app_private.student_matches(aluno_id, organization_id)
  and (
    app_private.own_student_with_workout_access(aluno_id)
    or app_private.student_role(aluno_id, array['admin', 'manager', 'professor'])
  )
);

-- Structured onboarding and referred PAR-Q cases use the audited professional review.
create or replace function public.review_student_safety_decision(p_queue uuid,p_decision text,p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare entry public.treinos_ia_fila;
begin
  select * into entry from public.treinos_ia_fila where id = p_queue;
  if entry.id is null or not app_private.student_matches(entry.aluno_id, entry.organization_id)
    or not app_private.student_role(entry.aluno_id, array['manager','professor']) then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;
  perform 1 from public.alunos where id = entry.aluno_id for update;
  select * into strict entry from public.treinos_ia_fila where id = p_queue for update;
  if entry.anamnese_id is null and exists (
    select 1 from public.anamnese_respostas source
    where source.aluno_id = entry.aluno_id and source.respostas->'triagem_portaria' = 'true'::jsonb
  ) then
    raise exception 'Revise a triagem da portaria mais recente do morador';
  end if;
  if not (
      (entry.anamnese_id is null and entry.status = 'pendente')
      or (entry.anamnese_id is not null and entry.status = 'rejeitado' and entry.aprovado_em is null)
    )
    or p_decision is null or p_decision not in ('aprovado','rejeitado')
    or length(btrim(coalesce(p_reason,''))) < 3 then
    raise exception 'Informe decisão e justificativa para uma revisão clínica pendente';
  end if;
  if entry.anamnese_id is not null and p_decision = 'aprovado' and not exists (
    select 1 from public.student_safety_onboarding
    where aluno_id = entry.aluno_id and organization_id = entry.organization_id and consentimento
  ) then
    raise exception 'O morador precisa concluir a etapa de consentimento no aplicativo';
  end if;
  if entry.anamnese_id is not null and exists (
    select 1 from public.anamnese_respostas source
    join public.anamnese_respostas newer on newer.aluno_id = source.aluno_id
      and (newer.preenchido_em, newer.id) > (source.preenchido_em, source.id)
    where source.id = entry.anamnese_id and newer.status in ('preenchido', 'aprovado')
  ) then
    raise exception 'Revise a anamnese mais recente do morador';
  end if;
  update public.treinos_ia_fila
    set status = p_decision::public.treino_ia_status, aprovado_por = auth.uid(), aprovado_em = now()
    where id = entry.id;
  update public.student_safety_onboarding
    set risco = case when p_decision = 'aprovado' then 'baixo' else 'bloqueado' end,
      validado_por = auth.uid(), validado_em = now(), updated_at = now(),
      review_notes = left(p_reason,2000)
    where aluno_id = entry.aluno_id and organization_id = entry.organization_id;
  insert into public.user_access_audit(user_id,organization_id,event,metadata)
    values (auth.uid(),entry.organization_id,'admin_action',
      jsonb_build_object('action','safety_review','queue',entry.id,'decision',p_decision,'clinical_reason_recorded',true));
end;
$$;

-- Keep the original projection and consent implementation internal. Legacy
-- callers can use the public wrapper until their first Portaria intake.
alter function public.submit_student_safety_onboarding(uuid, uuid, jsonb)
  set schema app_private;
revoke all on function app_private.submit_student_safety_onboarding(uuid, uuid, jsonb)
  from public, anon, authenticated;

create function public.submit_student_safety_onboarding(
  p_aluno_id uuid, p_organization_id uuid, p_payload jsonb
)
returns public.student_safety_onboarding
language plpgsql security definer set search_path = '' as $$
begin
  if not app_private.own_student(p_aluno_id)
    or not app_private.student_matches(p_aluno_id, p_organization_id) then
    raise exception 'Cadastro indisponível para esta sessão' using errcode = '42501';
  end if;
  perform 1 from public.alunos where id = p_aluno_id for update;
  if exists (
    select 1 from public.anamnese_respostas source
    where source.aluno_id = p_aluno_id
      and source.respostas->'triagem_portaria' = 'true'::jsonb
  ) then
    raise exception 'Atualize a triagem pelo onboarding da Portaria' using errcode = '42501';
  end if;
  return app_private.submit_student_safety_onboarding(p_aluno_id, p_organization_id, p_payload);
end;
$$;
revoke all on function public.submit_student_safety_onboarding(uuid, uuid, jsonb) from public, anon;
grant execute on function public.submit_student_safety_onboarding(uuid, uuid, jsonb) to authenticated;

-- The authenticated QR onboarding records consent and PAR-Q in one transaction.
create function public.submit_resident_portaria(
  p_aluno_id uuid, p_organization_id uuid, p_request_id uuid, p_payload jsonb
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  safety public.student_safety_onboarding;
  responses jsonb := p_payload->'par_q';
  captured_payload jsonb;
begin
  if p_request_id is null or not app_private.own_student(p_aluno_id)
    or not app_private.student_matches(p_aluno_id, p_organization_id) then
    raise exception 'Cadastro indisponível para esta sessão' using errcode = '42501';
  end if;
  perform 1 from public.alunos where id = p_aluno_id for update;
  if exists (
    select 1 from public.anamnese_respostas
    where id = p_request_id and aluno_id = p_aluno_id and tipo = 'par_q_portaria'
  ) then return p_request_id; end if;
  if jsonb_typeof(responses) is distinct from 'array' then
    raise exception 'Responda às sete perguntas';
  end if;
  if jsonb_array_length(responses) <> 7 or exists (
    select 1 from jsonb_array_elements(responses) answer
    where coalesce(answer->>'resposta','') not in ('sim','nao')
  ) then raise exception 'Responda às sete perguntas'; end if;

  -- Persist the intake first. The existing safety record is derived from the
  -- stored answers so consent auditing and the publication gate stay intact.
  insert into public.anamnese_respostas(id, aluno_id, token, tipo, respostas, status, preenchido_em)
  values (
    p_request_id, p_aluno_id, gen_random_uuid()::text, 'par_q_portaria',
    jsonb_build_object(
      'triagem_portaria', true, 'versao_captura', 1, 'par_q', responses,
      'nivel', left(p_payload->>'nivel', 30),
      'medicamentos', left(p_payload->>'medicamentos', 4000),
      'captura', jsonb_build_object(
        'consentimento', p_payload->'consentimento', 'consent_version', p_payload->'consent_version',
        'restricoes', coalesce(nullif(p_payload->'restricoes', 'null'::jsonb), '[]'::jsonb),
        'lesoes_atuais', coalesce(nullif(p_payload->'lesoes_atuais', 'null'::jsonb), '[]'::jsonb),
        'historico_lesoes', left(p_payload->>'historico_lesoes', 4000),
        'cirurgias', left(p_payload->>'cirurgias', 4000), 'dor_atual', p_payload->'dor_atual',
        'sinais_alerta', coalesce(nullif(p_payload->'sinais_alerta', 'null'::jsonb), '[]'::jsonb),
        'observacoes', left(p_payload->>'observacoes', 4000),
        'objetivo', left(p_payload->>'objetivo', 160)
      )
    ),
    'preenchido', now()
  )
  returning respostas->'captura' into captured_payload;

  select * into safety from app_private.submit_student_safety_onboarding(p_aluno_id, p_organization_id, captured_payload);
  update public.anamnese_respostas
    set respostas = respostas || jsonb_build_object(
      'revisao_estruturada', safety.risco <> 'baixo',
      'risco_inicial', safety.risco, 'consent_recorded_at', safety.consent_recorded_at,
      'objetivos', safety.objetivo, 'restricoes', array_to_string(safety.restricoes, ', '),
      'historico', safety.historico_lesoes
    )
    where id = p_request_id;

  update public.treinos_ia_fila set status = 'rejeitado', aprovado_em = now(),
    resumo = 'Substituída pela triagem da portaria.'
    where aluno_id = p_aluno_id and organization_id = p_organization_id
      and anamnese_id is null and status = 'pendente' and sugestao = '{}'::jsonb;

  return p_request_id;
end;
$$;
revoke all on function public.submit_resident_portaria(uuid, uuid, uuid, jsonb) from public, anon;
grant execute on function public.submit_resident_portaria(uuid, uuid, uuid, jsonb) to authenticated;

commit;
