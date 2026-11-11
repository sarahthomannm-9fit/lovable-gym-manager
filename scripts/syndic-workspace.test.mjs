import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const db = new PGlite();
const id = (n) => String(n).padStart(8, "0") + "-1111-4111-8111-111111111111";
const [actor, org, foreign, event, announcement, request] = [
  1, 2, 3, 4, 5, 6,
].map(id);
await db.exec(`create role anon;create role authenticated;create schema auth;create schema app_private;
create table auth.users(id uuid primary key);insert into auth.users values('${actor}');
create function auth.uid() returns uuid language sql as $$select '${actor}'::uuid$$;
create function app_private.org_role(uuid,text[]) returns boolean language sql as $$select $1='${org}'::uuid and coalesce(current_setting('fixture.allowed',true),'true')='true'$$;
create function app_private.resident_active(text,text) returns boolean language sql as $$select $1='ativo' and $2='ativo'$$;
create table organizations(id uuid primary key,nome text,status text,metadata jsonb,operational_profile jsonb);insert into organizations values('${org}','Condomínio','ativo','{"total_unidades":80}','{}');
create table alunos(id uuid default gen_random_uuid(),organization_id uuid,user_id uuid,unidade text,status text,lifecycle_status text);
insert into alunos(organization_id,user_id,unidade,status,lifecycle_status) values('${org}','${actor}','101','ativo','ativo'),('${org}','${actor}',' 101 ','ativo','ativo'),('${org}','${actor}',null,'ativo','ativo'),('${org}',null,'102','ativo','ativo');
create function condominium_dashboard(uuid) returns jsonb language sql as $$select '{"summary":{"residents":[]},"financial":{},"activation":{},"actions":[],"tickets":[]}'::jsonb$$;
create table service_requests(organization_id uuid,status text);create table area_reservations(organization_id uuid,status text,ends_at timestamptz);
create table eventos_condominio(id uuid primary key,organization_id uuid,nome text,data_evento date,horario_inicio time,status text);
insert into eventos_condominio values('${event}','${org}','Evento',current_date,'10:00','rascunho');
create table health_day_inscricoes(evento_id uuid,status text);insert into health_day_inscricoes values('${event}','confirmado'),('${event}','checkin'),('${event}','lista_espera');
create table health_day_preinscricoes(evento_id uuid,aluno_id uuid);insert into health_day_preinscricoes values('${event}',null);
create table organization_announcements(id uuid primary key,organization_id uuid,title text,message text,status text,created_at timestamptz default now());insert into organization_announcements values('${announcement}','${org}','Título','Mensagem','rascunho',now());
create table organization_announcement_reads(announcement_id uuid,organization_id uuid);insert into organization_announcement_reads values('${announcement}','${org}');
create table notificacoes(dados_extras jsonb);
create table user_access_audit(user_id uuid,organization_id uuid,event text,metadata jsonb);
create function save_condominium_event(uuid,uuid,text,text,date,time,time,integer,text) returns uuid language plpgsql set search_path=public as $$declare result uuid:=coalesce($1,gen_random_uuid());begin insert into eventos_condominio values(result,$2,$3,$5,$6,'rascunho') on conflict(id) do update set nome=excluded.nome;return result;end$$;
create function save_announcement(uuid,uuid,text,text,uuid) returns uuid language plpgsql set search_path=public as $$declare result uuid:=coalesce($1,gen_random_uuid());begin insert into organization_announcements(id,organization_id,title,message,status) values(result,$2,$3,$4,'rascunho');return result;end$$;
create function publish_organization_announcement(uuid) returns void language plpgsql set search_path=public as $$begin update organization_announcements set status='publicado' where id=$1;insert into notificacoes values(jsonb_build_object('announcement_id',$1));end$$;
create function archive_organization_announcement(uuid) returns void language sql as $$update organization_announcements set status='arquivado' where id=$1$$;
create function set_condominium_event_status(uuid,text) returns void language sql as $$update eventos_condominio set status=$2 where id=$1$$;`);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/20261110205325_syndic_operation_workspace.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const overview = async () =>
  (await db.query("select syndic_operation_overview($1) result", [org])).rows[0]
    .result;
assert.deepEqual((await overview()).coverage, {
  units_total: 80,
  units_linked: 1,
  people_linked: 3,
  without_unit: 1,
  percent: 1.3,
});
await db.exec(`update organizations set metadata='{}'`);
assert.equal((await overview()).coverage.percent, null);
await assert.rejects(
  () => db.query("select syndic_operation_overview($1)", [foreign]),
  (e) => e.code === "42501",
);
const events = (await db.query("select syndic_event_list($1) result", [org]))
  .rows[0].result;
assert.equal(events[0].confirmed, 2);
assert.equal(events[0].present, 1);
assert.equal(events[0].waiting, 1);
assert.equal(events[0].unverified, 1);
const save = async (req, kind, target, payload) =>
  (
    await db.query("select syndic_save_operation($1,$2,$3,$4,$5) result", [
      req,
      org,
      kind,
      target,
      payload,
    ])
  ).rows[0].result;
const payload = {
  name: "Novo evento",
  date: "2027-01-01",
  start: "10:00",
  end: "12:00",
  capacity: 50,
  location: "Academia",
};
const saved = await save(request, "event", null, payload);
assert.equal(await save(request, "event", null, payload), saved);
assert.equal(
  (await db.query("select count(*) n from eventos_condominio")).rows[0].n,
  2,
);
await assert.rejects(() =>
  save(request, "event", null, { ...payload, capacity: 80 }),
);
await save(id(7), "publish_announcement", announcement, {});
await save(id(7), "publish_announcement", announcement, {});
const news = (await db.query("select syndic_announcements($1) result", [org]))
  .rows[0].result;
assert.equal(news[0].reads, 1);
assert.equal(news[0].app_notifications, 1);
await db.exec(
  `create function reject_audit() returns trigger language plpgsql as $$begin raise exception 'audit failed';end$$;create trigger fail_audit before insert on user_access_audit for each row execute function reject_audit()`,
);
await assert.rejects(() => save(id(8), "event", null, payload));
assert.equal(
  (await db.query("select count(*) n from eventos_condominio")).rows[0].n,
  2,
);
await db.exec(`set fixture.allowed='false'`);
await assert.rejects(
  () => save(request, "event", null, payload),
  (e) => e.code === "42501",
);
assert.equal(
  (
    await db.query(
      "select has_function_privilege('anon','syndic_operation_overview(uuid)','execute') allowed",
    )
  ).rows[0].allowed,
  false,
);
assert.equal(
  (
    await db.query(
      "select has_table_privilege('authenticated','syndic_operation_requests','select') allowed",
    )
  ).rows[0].allowed,
  false,
);
assert.equal(
  (
    await db.query(
      "select relrowsecurity enabled from pg_class where oid='syndic_operation_requests'::regclass",
    )
  ).rows[0].enabled,
  true,
);
await db.close();
console.log(
  "PASS: coverage, scope, event counts, reads, exact replay, publication once, rollback, revoked anonymous access and private RLS ledger.",
);
