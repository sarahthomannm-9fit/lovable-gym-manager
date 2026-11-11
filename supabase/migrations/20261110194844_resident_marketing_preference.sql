begin;
create function public.resident_marketing_preference(p_aluno uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare student public.alunos; account_email text; preference public.marketing_subscribers;
begin
 if not app_private.session_valid() or not app_private.own_student(p_aluno) then raise exception 'Cadastro indisponível' using errcode='42501'; end if;
 select * into strict student from public.alunos where id=p_aluno;
 select lower(btrim(email)) into account_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if account_email is null then raise exception 'Confirme seu e-mail antes de alterar esta preferência'; end if;
 select * into preference from public.marketing_subscribers where organization_id=student.organization_id and email=account_email;
 return jsonb_build_object('subscribed',coalesce(preference.subscribed,false),'recorded_at',preference.updated_at);
end; $$;
create function public.set_resident_marketing_preference(p_aluno uuid,p_enabled boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare student public.alunos; account_email text; preference public.marketing_subscribers;
begin
 if not app_private.session_valid() or not app_private.own_student(p_aluno) then raise exception 'Cadastro indisponível' using errcode='42501'; end if;
 if p_enabled is null then raise exception 'Informe sua preferência'; end if;
 select * into strict student from public.alunos where id=p_aluno for update;
 select lower(btrim(email)) into account_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if account_email is null then raise exception 'Confirme seu e-mail antes de alterar esta preferência'; end if;
 select * into preference from public.marketing_subscribers where organization_id=student.organization_id and email=account_email for update;
 if preference.id is not null and preference.subscribed=p_enabled then return public.resident_marketing_preference(p_aluno); end if;
 insert into public.marketing_subscribers(organization_id,email,name,subscribed,consented_at,unsubscribed_at,source)
 values(student.organization_id,account_email,student.nome,p_enabled,case when p_enabled then now() end,case when not p_enabled then now() end,'resident_profile')
 on conflict(organization_id,email) do update set subscribed=excluded.subscribed,
  consented_at=case when excluded.subscribed then now() else marketing_subscribers.consented_at end,
  unsubscribed_at=case when not excluded.subscribed then now() else null end,source='resident_profile',updated_at=now();
 insert into public.user_access_audit(user_id,organization_id,event,metadata)
 values(auth.uid(),student.organization_id,'admin_action',jsonb_build_object('action','resident_marketing_preference','enabled',p_enabled,'aluno_id',p_aluno));
 return public.resident_marketing_preference(p_aluno);
end; $$;
revoke all on function public.resident_marketing_preference(uuid),public.set_resident_marketing_preference(uuid,boolean) from public,anon;
grant execute on function public.resident_marketing_preference(uuid),public.set_resident_marketing_preference(uuid,boolean) to authenticated;
commit;
