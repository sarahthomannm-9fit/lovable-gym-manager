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

await db.exec(`
alter table workout_sessions add started_at timestamptz default now();
alter table alunos add nome text;update alunos set nome='Teste';
create table organizations(id uuid primary key,nome text,horarios_academia jsonb,capacidade_academia integer);
insert into organizations values('${orgA}','Condomínio A','{}',10),('${orgB}','Condomínio B','{}',8);
create table organization_facilities(id uuid default gen_random_uuid(),organization_id uuid,nome text,status text,quantidade integer,updated_at timestamptz);
insert into organization_facilities(organization_id,nome,status,quantidade) values('${orgA}','Cabo','aprovado',1);
create table planos_treino(id uuid primary key default gen_random_uuid(),nome text,objetivo text,nivel text,semanas integer,dias_semana integer,organization_id uuid,professor_id uuid,ativo boolean,publico boolean);
alter table treinos alter id set default gen_random_uuid();alter table treinos add professor_id uuid,add nome text,add descricao text;
alter table workout_publications add request_id uuid unique,add user_id uuid,add payload jsonb;
alter table plano_exercicios alter id set default gen_random_uuid();
alter table exercicios_biblioteca add ativo boolean default true,add organization_id uuid,add restricoes_incompativeis text[],add equipamento text;
create table student_safety_onboarding(aluno_id uuid,restricoes text[],lesoes_atuais text[]);
create table user_access_audit(user_id uuid,organization_id uuid,event text,metadata jsonb);
create function app_private.student_role(uuid,text[]) returns boolean language sql as $$select $1='${a}'::uuid$$;
create function app_private.org_role(uuid,text[]) returns boolean language sql as $$select $1='${orgA}'::uuid and coalesce(current_setting('fixture.manage',true),'true')='true'$$;
create function coach_operation_summary(uuid) returns jsonb language plpgsql as $$begin return null; /* s.data,s.feedback,coalesce(f.resolved,false) where nullif(btrim(s.feedback),'') is not null */ end$$;
create function coach_student_case(uuid) returns jsonb language plpgsql as $$declare student record;begin return (select jsonb_agg(nome) from organization_facilities where organization_id=student.organization_id and status='aprovado');end$$;
`);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/20261110153906_resident_context_workout.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/20261110212240_integrated_workout_journey.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const alt = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  extra = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
await db.query(
  "insert into exercicios_biblioteca(id,nome,instrucoes) values($1,$2,$3)",
  [alt, "Alternativa com halter", "Orientação própria"],
);
const alternative = {
  exercicio_id: alt,
  series: 2,
  repeticoes: "15",
  carga_kg: 2,
  descanso_seg: 30,
  observacoes: "Orientação alternativa",
};
await db.query("update plano_exercicios set alternativas=$1 where id=$2", [
  [alternative],
  peA,
]);
await db.query(
  "insert into plano_exercicios select $1,exercicio_id,plano_treino_id,dia_semana,semana,series,repeticoes,carga_kg,descanso_seg,observacoes,2,alternativas from plano_exercicios where id=$2",
  [extra, peA],
);
const read = async (id) =>
  (await db.query("select resident_workout($1) result", [id])).rows[0].result;
const act = async (
  workout,
  action,
  progress = {},
  feedback = "",
  expected = null,
) =>
  (
    await db.query("select save_workout_journey($1,$2,$3,$4,$5) result", [
      workout,
      action,
      progress,
      feedback,
      expected,
    ])
  ).rows[0].result;
await assert.rejects(
  () => read(foreign),
  (e) => e.code === "42501",
);
let session = await act(wa, "start");
assert.equal(session.prescription.exercicios.length, 2);
assert.equal(session.prescription.exercicios[0].alternativas[0].carga_kg, 2);
assert.equal((await act(wa, "start")).id, session.id);
await db.exec(
  "update plano_exercicios set series=20;update exercicios_biblioteca set nome='Nome alterado'",
);
assert.equal((await read(a)).exercicios[0].series, 3);
assert.equal((await read(a)).exercicios[0].nome, "Exercício de teste");
await assert.rejects(
  () =>
    act(wa, "save", {
      [peA]: { completed: true, carga: "2", alternative_id: foreign },
    }),
  /não aprovada/,
);
await assert.rejects(
  () => act(wa, "save", { [peA]: { completed: true, carga: "NaN" } }),
  /inválido/,
);
const progress = {
  [peA]: {
    completed: true,
    carga: "2",
    series: "2",
    repeticoes: "15",
    alternative_id: alt,
  },
};
session = await act(wa, "save", progress, "", session.updated_at);
await assert.rejects(
  () => act(wa, "save", progress, "", "2020-01-01T00:00:00Z"),
  (e) => e.code === "40001",
);
await assert.rejects(() => act(wa, "finish", progress), /pendentes/);
session = await act(
  wa,
  "discomfort",
  progress,
  "Relato de desconforto",
  session.updated_at,
);
assert.equal(session.attention, "discomfort");
assert.equal(session.status, "pausado");
session = await act(wa, "resume", {}, "", session.updated_at);
assert.deepEqual(session.progress, progress);
await db.query("update workout_sessions set data=current_date-1 where id=$1", [
  session.id,
]);
assert.equal((await read(a)).session.id, session.id);
session = await act(
  wa,
  "finish_partial",
  progress,
  "Sessão interrompida",
  session.updated_at,
);
assert.equal(session.completion_kind, "partial");
await db.query("update workout_sessions set data=current_date where id=$1", [
  session.id,
]);
await act(wa, "finish_partial", progress);
assert.equal(
  Number((await db.query("select count(*) n from treino_execucoes")).rows[0].n),
  1,
);
assert.equal(
  (await db.query("select concluido from treino_execucoes")).rows[0].concluido,
  false,
);
// The normal publication path validates and persists each alternative, not just the main exercise.
const exerciseRow = {
  exercicio_id: exercise,
  dia_semana: 1,
  series: 3,
  repeticoes: "10",
  carga_kg: 5,
  descanso_seg: 60,
  observacoes: "",
  alternativas: [alternative],
};
const payload = {
  aluno_id: a,
  nome: "Plano com alternativas",
  objetivo: "Força",
  nivel: "iniciante",
  data_inicio: new Date().toISOString().slice(0, 10),
  semanas: 4,
  exercicios: [exerciseRow, exerciseRow, exerciseRow],
};
const publication = (
  await db.query("select publish_workout(gen_random_uuid(),$1) id", [payload])
).rows[0].id;
assert.equal(
  (
    await db.query(
      "select count(*) n from plano_exercicios where plano_treino_id=(select plano_treino_id from treinos where id=$1) and alternativas<>'[]'::jsonb",
      [publication],
    )
  ).rows[0].n,
  12,
);
await db.query("update exercicios_biblioteca set ativo=false where id=$1", [
  alt,
]);
await assert.rejects(
  () => db.query("select publish_workout(gen_random_uuid(),$1)", [payload]),
  /incompatível/,
);
assert.equal(
  (await read(a)).treino.id,
  wa,
  "A new publication cannot silently replace the session of this day",
);
await act(wb, "start");
const finished = await act(wb, "finish", {
  [peB]: { completed: true, carga: "5", series: "3", repeticoes: "10" },
});
assert.equal(finished.completion_kind, "complete");
await act(wb, "finish", {});
assert.equal(
  Number((await db.query("select count(*) n from treino_execucoes")).rows[0].n),
  2,
);
const facility = (
  await db.query("select id from organization_facilities limit 1")
).rows[0].id;
await db.query("select set_fitness_equipment_availability($1,false,$2)", [
  facility,
  "Manutenção",
]);
assert.equal(
  (await db.query("select fitness_infrastructure($1) result", [orgA])).rows[0]
    .result.facilities[0].availability,
  "unavailable",
);
await db.exec("set fixture.manage='false'");
await assert.rejects(
  () =>
    db.query("select set_fitness_equipment_availability($1,true,$2)", [
      facility,
      "Liberado",
    ]),
  (e) => e.code === "42501",
);
assert.equal(
  (
    await db.query(
      "select has_table_privilege('authenticated','workout_sessions','update') allowed",
    )
  ).rows[0].allowed,
  false,
);
assert.equal(
  (
    await db.query(
      "select has_function_privilege('anon','save_workout_journey(uuid,text,jsonb,text,timestamptz)','execute') allowed",
    )
  ).rows[0].allowed,
  false,
);
await db.close();
console.log(
  "PASS integrated journey: approved alternatives, validation/publication, immutable prescription, replay, concurrency, partial finish, discomfort, midnight resume, infrastructure permissions.",
);
