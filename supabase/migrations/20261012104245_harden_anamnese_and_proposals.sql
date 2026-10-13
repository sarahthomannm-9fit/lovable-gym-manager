-- Keep the public PAR-Q link behind an Edge Function that checks its token.
-- The Data API no longer grants anonymous access to health answers.
revoke all on public.anamnese_respostas from anon;
drop policy if exists "Public read anamnese by token" on public.anamnese_respostas;
drop policy if exists "Public update anamnese by token" on public.anamnese_respostas;
drop policy if exists "Public read/write for anamnese by token" on public.anamnese_respostas;
drop policy if exists "Authenticated insert anamnese" on public.anamnese_respostas;

create policy anamnese_read_authorized on public.anamnese_respostas
for select to authenticated using (
  (select public.is_admin(auth.uid()))
  or exists (
    select 1 from public.alunos a
    where a.id = aluno_id and (
      a.user_id = (select auth.uid())
      or exists (
        select 1 from public.organization_members om
        where om.organization_id = a.organization_id
          and om.user_id = (select auth.uid())
          and om.papel in ('admin', 'manager', 'professor')
      )
    )
  )
);

create policy anamnese_insert_staff on public.anamnese_respostas
for insert to authenticated with check (
  (select public.is_admin(auth.uid()))
  or exists (
    select 1 from public.alunos a
    join public.organization_members om on om.organization_id = a.organization_id
    where a.id = aluno_id and om.user_id = (select auth.uid())
      and om.papel in ('admin', 'manager', 'professor')
  )
);

create policy anamnese_update_staff on public.anamnese_respostas
for update to authenticated using (
  (select public.is_admin(auth.uid()))
  or exists (
    select 1 from public.alunos a
    join public.organization_members om on om.organization_id = a.organization_id
    where a.id = aluno_id and om.user_id = (select auth.uid())
      and om.papel in ('admin', 'manager', 'professor')
  )
) with check (
  (select public.is_admin(auth.uid()))
  or exists (
    select 1 from public.alunos a
    join public.organization_members om on om.organization_id = a.organization_id
    where a.id = aluno_id and om.user_id = (select auth.uid())
      and om.papel in ('admin', 'manager', 'professor')
  )
);

-- Proposals without a creator remain visible to admins for assignment.
alter table public.proposals alter column created_by set default auth.uid();
drop policy if exists "proposals_auth_all" on public.proposals;
create policy proposals_read_owner_or_admin on public.proposals
for select to authenticated using (
  (select public.is_admin(auth.uid())) or created_by = (select auth.uid())
);
create policy proposals_insert_owner_or_admin on public.proposals
for insert to authenticated with check (
  (select public.is_admin(auth.uid())) or created_by = (select auth.uid())
);
create policy proposals_update_owner_or_admin on public.proposals
for update to authenticated using (
  (select public.is_admin(auth.uid())) or created_by = (select auth.uid())
) with check (
  (select public.is_admin(auth.uid())) or created_by = (select auth.uid())
);
create policy proposals_delete_admin on public.proposals
for delete to authenticated using ((select public.is_admin(auth.uid())));

