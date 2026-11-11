begin;

create table public.health_day_preinscricoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos_condominio(id) on delete cascade,
  nome text not null,
  email text not null,
  whatsapp text not null,
  unidade text not null,
  objetivo text not null,
  aluno_id uuid references public.alunos(id),
  created_at timestamptz not null default now(),
  unique (evento_id, email)
);

alter table public.health_day_preinscricoes enable row level security;
revoke all on public.health_day_preinscricoes from public, anon, authenticated;
grant select on public.health_day_preinscricoes to authenticated;
create policy reception_read on public.health_day_preinscricoes for select to authenticated
using (exists (
  select 1 from public.eventos_condominio e where e.id = evento_id
    and app_private.org_role(e.organization_id, array['sindico','admin','manager'])
));

create function public.health_day_public_event(p_event uuid)
returns table (nome text, data_evento date, horario_inicio time, organization_id uuid)
language sql stable security definer set search_path = '' as $$
  select e.nome::text, e.data_evento, e.horario_inicio, e.organization_id
  from public.eventos_condominio e join public.organizations o on o.id=e.organization_id
  where e.id=p_event and e.status='publicado' and e.ativo and o.status='ativo' and o.tipo='condominio'
    and (case when e.horario_fim is null then e.data_evento + e.horario_inicio + interval '4 hours'
      when e.horario_fim < e.horario_inicio then e.data_evento + e.horario_fim + interval '1 day'
      else e.data_evento + e.horario_fim end)
      >= now() at time zone 'America/Sao_Paulo';
$$;

create function public.health_day_pre_register(
  p_event uuid, p_nome text, p_email text, p_whatsapp text, p_unidade text, p_objetivo text
)
returns void language plpgsql security definer set search_path = '' as $$
declare email_value text := lower(btrim(p_email)); phone text := regexp_replace(p_whatsapp,'[^0-9]','','g');
begin
  if not exists (select 1 from public.health_day_public_event(p_event)) then
    raise exception 'Inscrições indisponíveis';
  end if;
  if coalesce(length(btrim(p_nome)),0) not between 2 and 120
    or coalesce(length(email_value),0) not between 5 and 254
    or email_value !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    or coalesce(length(phone),0) not between 10 and 15
    or coalesce(length(btrim(p_unidade)),0) not between 1 and 40
    or p_objetivo is null or p_objetivo not in ('Emagrecimento','Ganho de massa','Condicionamento','Descompressão e saúde') then
    raise exception 'Confira os dados da inscrição';
  end if;
  insert into public.health_day_preinscricoes(evento_id,nome,email,whatsapp,unidade,objetivo)
  values(p_event,btrim(p_nome),email_value,phone,btrim(p_unidade),p_objetivo)
  on conflict(evento_id,email) do nothing;
end;
$$;

create function public.health_day_reception(p_event uuid, p_preinscricao uuid, p_aluno uuid, p_checkin boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare e public.eventos_condominio; lead public.health_day_preinscricoes;
  student public.alunos; registration public.health_day_inscricoes; target_status text;
  local_now timestamp := now() at time zone 'America/Sao_Paulo';
  start_at timestamp; end_at timestamp;
begin
  select * into e from public.eventos_condominio where id=p_event for update;
  if e.id is null or not app_private.org_role(e.organization_id,array['sindico','admin','manager']) then
    raise exception 'Evento indisponível' using errcode='42501';
  end if;
  start_at := e.data_evento + e.horario_inicio;
  end_at := case when e.horario_fim is null then start_at + interval '4 hours'
    when e.horario_fim < e.horario_inicio then e.data_evento + e.horario_fim + interval '1 day'
    else e.data_evento + e.horario_fim end;
  if e.status <> 'publicado' or e.ativo is not true or local_now > end_at
    or (p_checkin and local_now < start_at - interval '10 minutes') then
    raise exception 'Recepção indisponível neste horário';
  end if;
  if p_preinscricao is not null then
    select * into lead from public.health_day_preinscricoes where id=p_preinscricao and evento_id=e.id for update;
    if lead.id is null then raise exception 'Pré-inscrição não encontrada'; end if;
    perform pg_advisory_xact_lock(hashtextextended(lead.email,0));
    select * into student from public.alunos where organization_id=e.organization_id and lower(email)=lead.email;
    if student.id is null then
      if exists(select 1 from public.alunos where lower(email)=lead.email) then
        raise exception 'Cadastro vinculado a outro condomínio. Solicite revisão ao admin';
      end if;
      insert into public.alunos(organization_id,nome,email,unidade,status,lifecycle_status,tipo)
      values(e.organization_id,lead.nome,lead.email,lead.unidade,'ativo','ativo','presencial') returning * into student;
    end if;
    update public.health_day_preinscricoes set aluno_id=student.id where id=lead.id;
  else
    select * into student from public.alunos where id=p_aluno and organization_id=e.organization_id;
  end if;
  if student.id is null then raise exception 'Morador não encontrado'; end if;

  select * into registration from public.health_day_inscricoes where evento_id=e.id and aluno_id=student.id for update;
  if p_preinscricao is null and registration.id is null then raise exception 'Inscrição não encontrada'; end if;
  if registration.status='checkin' then return 'checkin'; end if;
  if registration.status='confirmado' then target_status := 'confirmado';
  elsif registration.status='lista_espera' then return 'lista_espera';
  elsif registration.status='cancelado' then raise exception 'Inscrição cancelada'; 
  elsif (select count(*) from public.health_day_inscricoes where evento_id=e.id and status in ('confirmado','checkin')) >= coalesce(e.vagas_totais,15)
    then target_status := 'lista_espera';
  else target_status := 'confirmado';
  end if;
  if p_checkin and target_status='confirmado' then target_status := 'checkin'; end if;
  insert into public.health_day_inscricoes(evento_id,aluno_id,status,checkin_at)
  values(e.id,student.id,target_status,case when target_status='checkin' then now() end)
  on conflict(evento_id,aluno_id) do update set status=excluded.status,checkin_at=excluded.checkin_at;
  return target_status;
end;
$$;

revoke all on function public.health_day_public_event(uuid), public.health_day_pre_register(uuid,text,text,text,text,text),
  public.health_day_reception(uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.health_day_public_event(uuid), public.health_day_pre_register(uuid,text,text,text,text,text) to anon,authenticated;
grant execute on function public.health_day_reception(uuid,uuid,uuid,boolean) to authenticated;
-- All capacity writers acquire the event lock before the registration lock.
do $locks$
declare definition text; patched text;
begin
  select pg_get_functiondef('public.manage_health_day_registration(uuid,text)'::regprocedure) into definition;
  patched := replace(definition,
    'WHERE id=p_registration_id FOR UPDATE;',
    'WHERE id=p_registration_id;');
  patched := replace(patched, 'WHERE id=v_row.evento_id FOR UPDATE;',
    'WHERE id=v_row.evento_id FOR UPDATE;
     SELECT * INTO STRICT v_row FROM public.health_day_inscricoes WHERE id=p_registration_id FOR UPDATE;');
  if patched=definition then raise exception 'Confira a ordem de travas da gestão do evento'; end if;
  execute patched;
end $locks$;

-- Reception approval can authorize entry to invitation-only condominiums
-- for the same confirmed email. The standard membership checks still apply elsewhere.
do $entry$
declare definition text; patched text;
begin
  select pg_get_functiondef('public.start_resident_onboarding(uuid,text,text,text)'::regprocedure) into definition;
  patched := replace(definition,
    'RAISE EXCEPTION ''Este condomínio usa convites. Solicite seu link à administração.'' USING ERRCODE=''42501'';',
    'IF NOT EXISTS (
      SELECT 1 FROM public.health_day_preinscricoes pre
      JOIN public.eventos_condominio event ON event.id=pre.evento_id
      JOIN public.alunos student ON student.id=pre.aluno_id AND student.organization_id=event.organization_id
      JOIN public.health_day_inscricoes registration ON registration.evento_id=event.id AND registration.aluno_id=student.id
      JOIN auth.users account ON account.id=auth.uid() AND account.email_confirmed_at IS NOT NULL
      WHERE event.organization_id=p_organization_id AND pre.email=lower(account.email)
        AND lower(student.email)=pre.email
        AND event.status IN (''publicado'',''encerrado'')
        AND registration.status IN (''confirmado'',''checkin'')
    ) THEN
      RAISE EXCEPTION ''Este condomínio usa convites. Solicite seu link à administração.'' USING ERRCODE=''42501'';
    END IF;');
  if patched=definition then raise exception 'Confira a regra de entrada do condomínio antes de migrar'; end if;
  execute patched;
end $entry$;

commit;
