BEGIN;
DO $setup$
DECLARE resident uuid:=gen_random_uuid();other_user uuid:=gen_random_uuid();org uuid:=gen_random_uuid();other_org uuid:=gen_random_uuid();mine uuid:=gen_random_uuid();other_student uuid:=gen_random_uuid();
BEGIN
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(resident,resident||'@example.invalid',now()),(other_user,other_user||'@example.invalid',now());
 INSERT INTO public.organizations(id,nome,tipo) VALUES(org,'RLS QA rolled back','condominio'),(other_org,'RLS other rolled back','condominio');
 INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(org,resident,'user'),(other_org,other_user,'user');
 INSERT INTO public.alunos(id,nome,email,user_id,organization_id,status,tipo,aulas_disponiveis) VALUES(mine,'RLS QA',resident||'@example.invalid',resident,org,'ativo','presencial',1),(other_student,'RLS other QA',other_user||'@example.invalid',other_user,other_org,'ativo','presencial',1);
 PERFORM set_config('test.persona.org',org::text,true);PERFORM set_config('test.persona.other_org',other_org::text,true);PERFORM set_config('test.persona.student',mine::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',resident,'role','authenticated')::text,true);
END $setup$;
SET LOCAL ROLE authenticated;
DO $assert$
DECLARE mine uuid:=current_setting('test.persona.student')::uuid;other_org uuid:=current_setting('test.persona.other_org')::uuid;
BEGIN
 IF (SELECT count(*) FROM public.alunos WHERE id=mine)<>1 THEN RAISE EXCEPTION 'ASSERT: own pupil hidden'; END IF;
 IF EXISTS(SELECT 1 FROM public.alunos WHERE organization_id=other_org) THEN RAISE EXCEPTION 'ASSERT: other condominium visible'; END IF;
 UPDATE public.alunos SET nome='RLS allowed profile edit' WHERE id=mine;
 BEGIN UPDATE public.alunos SET aulas_disponiveis=999 WHERE id=mine; RAISE EXCEPTION 'ASSERT: self credit allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='ASSERT: self credit allowed' THEN RAISE; END IF; END;
 BEGIN INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(other_org,auth.uid(),'professor'); RAISE EXCEPTION 'ASSERT: self promotion allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='ASSERT: self promotion allowed' THEN RAISE; END IF; END;
 IF has_function_privilege('authenticated','public.reserve_professional_credit(uuid,uuid,uuid,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'ASSERT: frontend can debit credits directly'; END IF;
 IF has_function_privilege('anon','public.accept_organization_invite(uuid)','EXECUTE') OR has_function_privilege('anon','public.set_class_registration(uuid,uuid,boolean)','EXECUTE') THEN RAISE EXCEPTION 'ASSERT: anonymous mutation exposed'; END IF;
END $assert$;
ROLLBACK;
SELECT 'passed: real authenticated RLS, own profile, foreign pupil isolation, no credit editing or role promotion, no direct credit RPC, anonymous mutations denied; rolled back' result;
