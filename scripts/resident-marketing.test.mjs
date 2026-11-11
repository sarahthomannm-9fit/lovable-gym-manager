import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { PGlite } = await import(
  process.env.PGLITE_MODULE
    ? pathToFileURL(process.env.PGLITE_MODULE).href
    : "@electric-sql/pglite"
);
const db = new PGlite();
const user = "11111111-1111-1111-1111-111111111111",
  student = "22222222-2222-2222-2222-222222222222",
  org = "33333333-3333-3333-3333-333333333333";
await db.exec(`create role anon;create role authenticated;create schema auth;create schema app_private;
create table auth.users(id uuid,email text,email_confirmed_at timestamptz);insert into auth.users values('${user}','verified@example.invalid',now());
create function auth.uid() returns uuid language sql as $$select '${user}'::uuid$$;
create function app_private.session_valid() returns boolean language sql as $$select true$$;
create table alunos(id uuid,organization_id uuid,nome text,user_id uuid);insert into alunos values('${student}','${org}','Morador QA','${user}');
create function app_private.own_student(uuid) returns boolean language sql as $$select exists(select 1 from public.alunos where id=$1 and user_id=auth.uid())$$;
create table marketing_subscribers(id uuid default gen_random_uuid(),organization_id uuid,email text,name text,subscribed boolean,consented_at timestamptz,unsubscribed_at timestamptz,source text,updated_at timestamptz default now(),unique(organization_id,email));
create table user_access_audit(user_id uuid,organization_id uuid,event text,metadata jsonb);`);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/20261110194844_resident_marketing_preference.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const get = async (id) =>
  (await db.query("select resident_marketing_preference($1) result", [id]))
    .rows[0].result;
const set = async (enabled) =>
  (
    await db.query("select set_resident_marketing_preference($1,$2) result", [
      student,
      enabled,
    ])
  ).rows[0].result;
assert.equal((await get(student)).subscribed, false);
assert.equal((await set(true)).subscribed, true);
await set(true);
assert.equal(
  Number(
    (await db.query("select count(*) n from user_access_audit")).rows[0].n,
  ),
  1,
);
assert.equal((await set(false)).subscribed, false);
await set(false);
assert.equal(
  Number(
    (await db.query("select count(*) n from marketing_subscribers")).rows[0].n,
  ),
  1,
);
assert.equal(
  Number(
    (await db.query("select count(*) n from user_access_audit")).rows[0].n,
  ),
  2,
);
await assert.rejects(
  () => get(org),
  (e) => e.code === "42501",
);
await assert.rejects(() => set(null), /preferência/);
await db.exec("update auth.users set email_confirmed_at=null");
await assert.rejects(() => set(true), /Confirme seu e-mail/);
console.log(
  "Resident marketing SQL passed: explicit default, verified identity, own scope, opt-in/out, audit and replay",
);
await db.close();
