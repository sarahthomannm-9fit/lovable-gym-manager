import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { PGlite } = await import(
  process.env.PGLITE_MODULE
    ? pathToFileURL(process.env.PGLITE_MODULE).href
    : "@electric-sql/pglite"
);
const db = new PGlite();
const uid = (n) => String(n).padStart(8, "0") + "-1111-4111-8111-111111111111";
const [
  actor,
  student,
  org,
  capture,
  queue,
  session,
  workout,
  request,
  foreign,
  oldCapture,
] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(uid);
await db.exec(`create role anon;create role authenticated;create schema auth;create schema app_private;
create table auth.users(id uuid primary key);insert into auth.users values('${actor}');
create table organizations(id uuid primary key);insert into organizations values('${org}');
create function auth.uid() returns uuid language sql as $$select '${actor}'::uuid$$;
create function app_private.session_valid() returns boolean language sql as $$select coalesce(current_setting('fixture.session',true),'true')<>'false'$$;
create function app_private.student_role(uuid,text[]) returns boolean language sql as $$select $1='${student}'::uuid$$;
create function app_private.student_matches(uuid,uuid) returns boolean language sql as $$select $1='${student}'::uuid and $2='${org}'::uuid$$;
create function app_private.org_role(uuid,text[]) returns boolean language sql as $$select $1='${org}'::uuid$$;
create function app_private.resident_active(text,text) returns boolean language sql as $$select $1='ativo' and $2='ativo'$$;
create table alunos(id uuid primary key,nome text,organization_id uuid,status text,lifecycle_status text);
insert into alunos values('${student}','Morador teste','${org}','ativo','ativo');
create table anamnese_respostas(id uuid primary key,aluno_id uuid,tipo text,status text,respostas jsonb,preenchido_em timestamptz);
insert into anamnese_respostas values('${capture}','${student}','par_q_portaria','preenchido','{"triagem_portaria":true,"captura":{"dor_atual":false}}',now()),('${oldCapture}','${student}','par_q_portaria','preenchido','{}',now()-interval '1 day');
create table student_safety_onboarding(id uuid,aluno_id uuid,organization_id uuid,consentimento boolean,risco text,restricoes text[],lesoes_atuais text[]);
insert into student_safety_onboarding values(gen_random_uuid(),'${student}','${org}',true,'baixo','{}','{}');
create table treinos_ia_fila(id uuid,aluno_id uuid,organization_id uuid,anamnese_id uuid,status text,created_at timestamptz,aprovado_em timestamptz,objetivo text);
insert into treinos_ia_fila values('${queue}','${student}','${org}','${capture}','pendente',now(),null,'Força'),(gen_random_uuid(),'${student}','${org}','${oldCapture}','pendente',now()-interval '1 day',null,'Força');
create function student_is_safe_for_workout(uuid) returns boolean language sql as $$select exists(select 1 from public.student_safety_onboarding s where s.aluno_id=$1 and s.risco='baixo') and exists(select 1 from public.treinos_ia_fila q where q.aluno_id=$1 and q.status='aprovado')$$;
create table treinos(id uuid primary key,aluno_id uuid,organization_id uuid,nome text,status text,created_at timestamptz default now());
insert into treinos values('${workout}','${student}','${org}','Plano original','ativo',now());
create table workout_publications(request_id uuid primary key,user_id uuid,payload jsonb,treino_id uuid);
create table workout_sessions(id uuid primary key,treino_id uuid,aluno_id uuid,data date,status text,feedback text,completed_at timestamptz,updated_at timestamptz);
insert into workout_sessions values('${session}','${workout}','${student}',current_date,'concluido','Preciso de orientação',now(),now());
create table organization_facilities(organization_id uuid,nome text,status text);
insert into organization_facilities values('${org}','Halteres','aprovado');
create table user_access_audit(user_id uuid,organization_id uuid,event text,metadata jsonb);
create table notificacoes(treino_id uuid);
create function coach_student_roster(uuid) returns jsonb language sql as $$select jsonb_agg(to_jsonb(a)) from public.alunos a where a.organization_id=$1$$;
create function publish_workout(uuid,jsonb) returns uuid language plpgsql as $$declare result uuid:=gen_random_uuid();begin
 insert into public.treinos values(result,($2->>'aluno_id')::uuid,'${org}',$2->>'nome','ativo',now());
 insert into public.workout_publications values($1,auth.uid(),$2,result);insert into public.notificacoes values(result);
 if coalesce(current_setting('fixture.fail',true),'false')='true' then raise exception 'publication unavailable';end if;return result;end;$$;
create function publish_triage_workout(uuid,uuid,jsonb) returns uuid language plpgsql as $$begin update public.treinos_ia_fila set status='aprovado' where id=$1;return public.publish_workout($2,$3);end;$$;`);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/20261110201603_coach_operation_workspace.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const read = async (id) =>
  (await db.query("select coach_student_case($1) result", [id])).rows[0].result;
assert.equal((await read(student)).can_prescribe, true);
assert.equal((await read(student)).can_publish_direct, false);
assert.equal((await read(student)).equipment[0], "Halteres");
await assert.rejects(
  () => read(foreign),
  (e) => e.code === "42501",
);
const summary = (
  await db.query("select coach_operation_summary($1) result", [org])
).rows[0].result;
assert.equal(summary.queue.length, 1);
assert.equal(summary.feedbacks[0].resolved, false);
await db.exec("update student_safety_onboarding set risco='alto'");
assert.equal((await read(student)).can_prescribe, false);
await db.exec("update student_safety_onboarding set risco='baixo'");
await db.query("select record_coach_followup($1,$2,$3)", [
  session,
  "Orientação registrada",
  true,
]);
assert.equal((await read(student)).followups[0].resolved, true);
await db.query("select record_coach_followup($1,$2,$3)", [
  session,
  "Encaminhamento atualizado",
  false,
]);
assert.equal((await read(student)).followups.length, 1);
const payload = { aluno_id: student, nome: "Novo plano" };
const publish = (
  id,
  p = payload,
  original = null,
  captureId = null,
  queueId = null,
) =>
  db.query("select coach_publish_workout($1,$2,$3,$4,$5,$6) result", [
    id,
    p,
    original,
    "Revisão técnica",
    queueId,
    captureId,
  ]);
await db.exec("select set_config('fixture.fail','true',false)");
await assert.rejects(
  () => publish(request, payload, null, null, queue),
  /publication unavailable/,
);
assert.equal(
  Number(
    (await db.query("select count(*) n from workout_publications")).rows[0].n,
  ),
  0,
);
assert.equal((await read(student)).queue.status, "pendente");
await db.exec("select set_config('fixture.fail','false',false)");
const result = (await publish(request, payload, null, null, queue)).rows[0]
  .result;
assert.equal(
  (await publish(request, payload, null, null, queue)).rows[0].result,
  result,
);
assert.equal(
  Number((await db.query("select count(*) n from notificacoes")).rows[0].n),
  1,
);
await assert.rejects(
  () => publish(request, { ...payload, nome: "Alterado" }),
  /Identificador/,
);
await publish(uid(11), payload, workout);
await publish(uid(11), payload, workout);
assert.equal(
  (await db.query("select status from treinos where id=$1", [workout])).rows[0]
    .status,
  "revisado",
);
assert.equal(
  Number((await db.query("select count(*) n from notificacoes")).rows[0].n),
  2,
);
await assert.rejects(() => publish(uid(12), payload, null, capture), /captura/);
await assert.rejects(
  () => publish(uid(13), { ...payload, aluno_id: foreign }),
  (e) => e.code === "42501",
);
await db.exec("select set_config('fixture.session','false',false)");
await assert.rejects(
  () => read(student),
  (e) => e.code === "42501",
);
assert.equal(
  (
    await db.query(
      "select has_table_privilege('authenticated','public.coach_followup_actions','INSERT') p",
    )
  ).rows[0].p,
  false,
);
console.log(
  "Coach SQL passed: canonical case, scope, latest queue, clinical gate, persisted followup, atomic rollback, exact replay, revision history, notification count and revoked session",
);
await db.close();
