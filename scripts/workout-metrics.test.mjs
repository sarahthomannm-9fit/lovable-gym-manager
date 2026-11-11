import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const db = new PGlite();
await db.exec(`create table workout_sessions(status text,completion_kind text);insert into workout_sessions values('concluido','complete'),('concluido','partial'),('concluido',null),('em_andamento',null);
create function condominium_fitness_usage(uuid) returns bigint language sql as $$select count(*) from workout_sessions session where session.status = 'concluido'$$;
create function health_day_impact(uuid) returns bigint language sql as $$select count(*) from workout_sessions session where session.status = 'concluido'$$;
create function coach_fitness_followup(uuid) returns bigint language sql as $$select count(*) from workout_sessions s where s.status = 'concluido'$$;
create function coach_operation_summary(uuid) returns bigint language sql as $$select count(*) from workout_sessions s where s.status='concluido'$$;`);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/20261110213809_workout_completion_metrics.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
for (const name of [
  "condominium_fitness_usage",
  "health_day_impact",
  "coach_fitness_followup",
  "coach_operation_summary",
])
  assert.equal((await db.query(`select ${name}(null) n`)).rows[0].n, 2);
await db.close();
console.log(
  "PASS: partial sessions excluded from complete-session metrics; historical null completion kind preserved.",
);
