import {pathToFileURL} from 'node:url';
const {PGlite}=await import(pathToFileURL(process.env.PGLITE_MODULE).href);
import { readFileSync } from 'node:fs';
const db=new PGlite(), org='11111111-1111-1111-1111-111111111111', student='22222222-2222-2222-2222-222222222222', workout='33333333-3333-3333-3333-333333333333';
await db.exec(`
create role anon; create role authenticated;
create function organization_operation_readiness(uuid) returns jsonb language plpgsql as $$
begin
 if $1 <> '${org}'::uuid then raise exception 'Denied' using errcode='42501'; end if;
 return '{"checks":[{"key":"residents","count":1},{"key":"coach","count":1}]}'::jsonb;
end $$;
create table alunos(id uuid, organization_id uuid);
create table treinos(id uuid, aluno_id uuid, organization_id uuid);
create table workout_sessions(treino_id uuid, aluno_id uuid,status text,data date,completed_at timestamptz);
create table exercicios_biblioteca(id uuid,organization_id uuid,ativo boolean);
insert into exercicios_biblioteca values ('${workout}',null,true);
create table workout_protocol_templates(organization_id uuid,ativo boolean,nivel text,estrutura jsonb);
insert into alunos values('${student}','${org}');
insert into treinos values('${workout}','${student}','${org}');
insert into workout_sessions values ('${workout}','${student}','concluido',current_date-1,now()-interval '1 day'), ('${workout}','${student}','concluido',current_date,now());
insert into workout_protocol_templates values
(null,true,'iniciante','{"exercicios":[{"exercicio_id":"${workout}"},{"exercicio_id":"${workout}"},{"exercicio_id":"${workout}"}]}'),
(null,true,'iniciante','{"exercicios":{}}'),
('${student}',true,'iniciante','{"exercicios":[{"exercicio_id":"${workout}"},{"exercicio_id":"${workout}"},{"exercicio_id":"${workout}"}]}');
`);
await db.exec('alter table workout_sessions add completion_kind text');
await db.exec(readFileSync(new URL('../supabase/migrations/20261107010303_fitness_delivery_readiness.sql',import.meta.url),'utf8'));
const {rows}=await db.query('select * from fitness_delivery_readiness($1)',[org]);
const count=label=>Number(rows.find(row=>row.criterio.startsWith(label))?.quantidade);
if(rows.length!==7 || count('Moradores ativos')!==1 || count('Infraestrutura')!==0 || count('Protocolos')!==1 || count('Moradores que treinaram')!==1) throw Error(JSON.stringify(rows));
try {await db.query('select * from fitness_delivery_readiness($1)',[student]); throw Error('Cross-tenant allowed');} catch(e) { if(e.code!=='42501') throw e; }
console.log('Fitness readiness SQL passed');
await db.close();
