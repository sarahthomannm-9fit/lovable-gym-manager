begin;

create function public.approve_facility_for_workout(p_org uuid, p_facility uuid, p_analysis jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare item public.organization_facilities;
begin
  if auth.uid() is null or not app_private.org_role(p_org,array['admin','manager']) then
    raise exception 'Sem permissão para aprovar infraestrutura' using errcode='42501';
  end if;
  select * into item from public.organization_facilities where id=p_facility and organization_id=p_org for update;
  if item.id is null or jsonb_typeof(p_analysis) is distinct from 'object' then
    raise exception 'Infraestrutura indisponível ou análise inválida';
  end if;
  update public.organization_facilities
    set image_analysis=p_analysis || jsonb_build_object('approved_at',now(),'approved_by',auth.uid()),
      analysis_status='aprovada',status='aprovado'
    where id=item.id;
  insert into public.user_access_audit(user_id,organization_id,event,metadata)
    values(auth.uid(),p_org,'admin_action',jsonb_build_object('action','approve_facility','facility',item.id));
end;
$$;
revoke all on function public.approve_facility_for_workout(uuid,uuid,jsonb) from public,anon;
grant execute on function public.approve_facility_for_workout(uuid,uuid,jsonb) to authenticated;

create table public.organization_acceptance (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id),
  actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  revision text not null,
  environment text not null check(environment in ('homologacao','producao')),
  passed boolean not null,
  evidence text not null,
  readiness_snapshot jsonb not null
);
alter table public.organization_acceptance enable row level security;
revoke all on public.organization_acceptance from public,anon,authenticated;
grant select on public.organization_acceptance to authenticated;
create policy acceptance_read on public.organization_acceptance for select to authenticated
  using (app_private.org_role(organization_id,array['admin','manager']));

create function public.record_organization_acceptance(
  p_request uuid, p_org uuid, p_revision text, p_environment text, p_passed boolean, p_evidence text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare readiness jsonb; previous public.organization_acceptance;
begin
  if auth.uid() is null or not app_private.org_role(p_org,array['admin','manager']) then
    raise exception 'Sem permissão para homologar' using errcode='42501';
  end if;
  if p_request is null or coalesce(length(btrim(p_revision)),0) not between 3 and 120
    or p_environment is null or p_environment not in ('homologacao','producao')
    or p_passed is null or coalesce(length(btrim(p_evidence)),0) not between 20 and 4000 then
    raise exception 'Informe versão, ambiente, resultado e evidências do ensaio';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
  select * into previous from public.organization_acceptance where id=p_request;
  if found then
    if previous.organization_id<>p_org or previous.actor_id<>auth.uid()
      or previous.revision<>btrim(p_revision) or previous.environment<>p_environment
      or previous.passed<>p_passed or previous.evidence<>btrim(p_evidence) then
      raise exception 'Identificador de ensaio já utilizado';
    end if;
    return previous.id;
  end if;
  readiness := public.organization_operation_readiness(p_org);
  if p_passed and coalesce((readiness->>'ready_for_activation')::boolean,false) is not true then
    raise exception 'Conclua os pré-requisitos antes de aprovar o ensaio';
  end if;
  insert into public.organization_acceptance(id,organization_id,actor_id,revision,environment,passed,evidence,readiness_snapshot)
    values(p_request,p_org,auth.uid(),btrim(p_revision),p_environment,p_passed,btrim(p_evidence),readiness);
  return p_request;
end;
$$;
revoke all on function public.record_organization_acceptance(uuid,uuid,text,text,boolean,text) from public,anon;
grant execute on function public.record_organization_acceptance(uuid,uuid,text,text,boolean,text) to authenticated;

commit;
