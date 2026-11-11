import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
// Use an isolated PGlite install; no connection to the product database.
const { PGlite } = await import(
  process.env.PGLITE_MODULE
    ? pathToFileURL(process.env.PGLITE_MODULE).href
    : "@electric-sql/pglite"
);
const db = new PGlite();
const user = "11111111-1111-1111-1111-111111111111";
const ids = Array.from(
  { length: 12 },
  (_, i) => `${String(i + 2).padStart(8, "0")}-2222-4222-8222-222222222222`,
);
const [a, b, foreign, orgA, orgB, wa, wb, planA, planB, exercise, peA, peB] =
  ids;
await db.exec(`set timezone='America/Sao_Paulo';create role anon;create role authenticated;create schema auth;create schema app_private;
create function auth.uid() returns uuid language sql as $$select '${user}'::uuid$$;
create function app_private.session_valid() returns boolean language sql as $$select true$$;
create table alunos(id uuid primary key,user_id uuid,organization_id uuid,status text,lifecycle_status text);
insert into alunos values('${a}','${user}','${orgA}','ativo','ativo'),('${b}','${user}','${orgB}','ativo','ativo'),('${foreign}','${orgB}','${orgB}','ativo','ativo');
create function app_private.own_student(uuid) returns boolean language sql as $$select exists(select 1 from public.alunos where id=$1 and user_id=auth.uid())$$;
create function app_private.resident_active(text,text) returns boolean language sql as $$select $1='ativo' and $2='ativo'$$;
create function student_is_safe_for_workout(uuid) returns boolean language sql as $$select coalesce(current_setting('fixture.safe',true),'true')<>'false'$$;
create table treinos(id uuid primary key,aluno_id uuid,organization_id uuid,status text,data_inicio date,data_fim date,plano_treino_id uuid,created_at timestamptz default now());
insert into treinos values('${wa}','${a}','${orgA}','ativo',current_date,current_date+27,'${planA}'),('${wb}','${b}','${orgB}','ativo',current_date,current_date+27,'${planB}');
create table workout_publications(treino_id uuid);insert into workout_publications values('${wa}'),('${wb}');
create table exercicios_biblioteca(id uuid,nome text,instrucoes text,video_url text);
insert into exercicios_biblioteca values('${exercise}','Exercício de teste','Orientação','https://example.invalid/video');
create table plano_exercicios(id uuid,exercicio_id uuid,plano_treino_id uuid,dia_semana integer,semana integer,series integer,repeticoes text,carga_kg numeric,descanso_seg integer,observacoes text,ordem integer);
insert into plano_exercicios values('${peA}','${exercise}','${planA}',extract(isodow from current_date),1,3,'10',5,60,'Orientação A',1),('${peB}','${exercise}','${planB}',extract(isodow from current_date),1,2,'12',2,30,'Orientação B',1);
create table workout_sessions(id uuid primary key default gen_random_uuid(),treino_id uuid,aluno_id uuid,data date,status text default 'em_andamento',progress jsonb default '{}',feedback text,updated_at timestamptz,completed_at timestamptz,unique(treino_id,aluno_id,data));
create table treino_execucoes(treino_id uuid,aluno_id uuid,data_execucao date,concluido boolean,carga_real jsonb,observacoes text);`);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/20261110153906_resident_context_workout.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const read = async (id) =>
  (await db.query("select resident_workout($1) result", [id])).rows[0].result;
const act = async (workout, action, progress = {}, feedback = "") =>
  (
    await db.query("select save_resident_workout_session($1,$2,$3,$4) result", [
      workout,
      action,
      progress,
      feedback,
    ])
  ).rows[0].result;
assert.equal((await read(a)).treino.id, wa);
assert.equal((await read(b)).treino.id, wb);
assert.equal((await read(b)).exercicios[0].observacoes, "Orientação B");
await assert.rejects(
  () => read(foreign),
  (e) => e.code === "42501",
);
await db.exec("select set_config('fixture.safe','false',false)");
assert.equal((await read(a)).treino, null);
await assert.rejects(() => act(wa, "start"), /indisponível/);
await db.exec("select set_config('fixture.safe','true',false)");
const first = await act(wa, "start"),
  progress = { [peA]: { completed: true, carga: "0" } };
await act(wa, "save", progress, "Observação preservada");
const replay = await act(wa, "start");
assert.equal(replay.id, first.id);
assert.equal(replay.feedback, "Observação preservada");
assert.deepEqual(replay.progress, progress);
await assert.rejects(
  () => act(wa, "save", { [peB]: { completed: true, carga: "3" } }),
  /inválido/,
);
await assert.rejects(
  () => act(wa, "save", { [peA]: { completed: true, carga: "-1" } }),
  /Carga inválida/,
);
await assert.rejects(() => act(wa, "finish", {}), /todos os exercícios/);
await act(wa, "pause", progress);
await assert.rejects(() => act(wa, "finish", progress), /Retome/);
await act(wa, "resume", progress);
await act(wa, "finish", progress);
await act(wa, "finish", progress);
await act(wb, "start");
await act(wb, "finish", { [peB]: { completed: true, carga: "2" } });
assert.equal(
  Number((await db.query("select count(*) n from treino_execucoes")).rows[0].n),
  2,
);
assert.equal((await read(a)).session.status, "concluido");
assert.equal((await read(b)).session.aluno_id, b);
console.log(
  "Resident context SQL passed: two condominiums, foreign denial, safety gate, full prescription, start replay preserves progress, load validation, pause/resume and exactly-once completion",
);
await db.close();
