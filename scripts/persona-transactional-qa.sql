
BEGIN;
DO $test$
DECLARE admin_id uuid:=gen_random_uuid(); syndic_id uuid:=gen_random_uuid(); resident_id uuid:=gen_random_uuid(); coach_id uuid:=gen_random_uuid(); outsider_id uuid:=gen_random_uuid(); org_id uuid:=gen_random_uuid(); other_org uuid:=gen_random_uuid(); class_id uuid:=gen_random_uuid(); student_id uuid; inv public.organization_invites; coach_inv public.organization_invites; syndic_inv public.organization_invites; result uuid; request_id uuid; event_id uuid; workout_id uuid; revision_id uuid; payload jsonb; progress jsonb; booking_id uuid:=gen_random_uuid();
BEGIN
 INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES(syndic_id,syndic_id||'@example.invalid',now(),'{"nome":"Transactional syndic"}'),(admin_id,admin_id||'@example.invalid',now(),'{"nome":"Transactional admin"}'),(resident_id,resident_id||'@example.invalid',now(),'{"nome":"Transactional resident"}'),(coach_id,coach_id||'@example.invalid',now(),'{"nome":"Transactional coach"}'),(outsider_id,outsider_id||'@example.invalid',now(),'{"nome":"Transactional outsider"}');
 INSERT INTO public.user_roles(user_id,role) VALUES(admin_id,'admin') ON CONFLICT DO NOTHING;
 INSERT INTO public.organizations(id,nome,tipo) VALUES(org_id,'Transactional QA - rolled back','condominio'),(other_org,'Transactional isolation - rolled back','condominio');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
 syndic_inv:=public.create_organization_invite(org_id,syndic_id||'@example.invalid','sindico');
 inv:=public.create_organization_invite(org_id,resident_id||'@example.invalid','user');
 coach_inv:=public.create_organization_invite(org_id,coach_id||'@example.invalid','professor');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',resident_id,'role','authenticated')::text,true);
 PERFORM public.accept_organization_invite(inv.token);
 SELECT id INTO STRICT student_id FROM public.alunos WHERE user_id=resident_id AND organization_id=org_id;
 IF NOT EXISTS(SELECT 1 FROM public.organization_members WHERE user_id=resident_id AND organization_id=org_id AND papel='user') THEN RAISE EXCEPTION 'ASSERT: resident membership missing'; END IF;
 PERFORM public.save_resident_profile(student_id,'Updated transactional resident','11999999999','101',true);
 INSERT INTO public.aulas(id,nome,data_aula,horario_inicio,horario_fim,organization_id,capacidade_maxima) VALUES(class_id,'Transactional class',current_date+2,'10:00','11:00',org_id,1);
 PERFORM public.set_class_registration(class_id,student_id,true);
 PERFORM public.set_class_registration(class_id,student_id,true);
 IF (SELECT count(*) FROM public.aulas_inscritos WHERE aula_id=class_id AND aluno_id=student_id)<>1 THEN RAISE EXCEPTION 'ASSERT: duplicate enrollment'; END IF;
 PERFORM public.set_class_registration(class_id,student_id,false);
 IF NOT EXISTS(SELECT 1 FROM public.aulas_inscritos WHERE aula_id=class_id AND aluno_id=student_id AND status='cancelado') THEN RAISE EXCEPTION 'ASSERT: cancel failed'; END IF;
 PERFORM public.create_area_reservation(org_id,'academia','Transactional reservation',now()+interval '2 days',now()+interval '2 days 1 hour');
 BEGIN
  PERFORM public.create_area_reservation(org_id,'academia','Conflict',now()+interval '2 days',now()+interval '2 days 1 hour');
  RAISE EXCEPTION 'ASSERT: conflict allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='ASSERT: conflict allowed' THEN RAISE; END IF; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true);
 PERFORM public.accept_organization_invite(coach_inv.token);
 IF NOT EXISTS(SELECT 1 FROM public.funcionarios WHERE user_id=coach_id AND organization_id=org_id AND ativo) THEN RAISE EXCEPTION 'ASSERT: coach staff missing'; END IF;
 IF public.persona_has_role(other_org,ARRAY['professor']) THEN RAISE EXCEPTION 'ASSERT: cross organization authorized'; END IF;


 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',resident_id,'role','authenticated')::text,true);
 PERFORM public.set_class_registration(class_id,student_id,true);
 UPDATE public.aulas SET data_aula=(now() AT TIME ZONE 'America/Sao_Paulo')::date,horario_inicio=((now() AT TIME ZONE 'America/Sao_Paulo')-interval '5 minutes')::time,horario_fim=((now() AT TIME ZONE 'America/Sao_Paulo')+interval '45 minutes')::time,professor_id=(SELECT id FROM public.funcionarios WHERE user_id=coach_id AND organization_id=org_id) WHERE id=class_id;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true);
 PERFORM public.mark_class_attendance(class_id,student_id);
 IF NOT EXISTS(SELECT 1 FROM public.aulas_inscritos WHERE aula_id=class_id AND aluno_id=student_id AND status='presente') THEN RAISE EXCEPTION 'ASSERT: class attendance not persisted'; END IF;

 -- Test complete training, event, service and credit lifecycle without external calls.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',resident_id,'role','authenticated')::text,true);
 PERFORM public.submit_student_safety_onboarding(student_id,org_id,'{"consentimento":true,"objetivo":"Funcional","restricoes":[],"lesoes_atuais":[],"sinais_alerta":[]}'::jsonb);
 SELECT id INTO request_id FROM public.create_service_request(org_id,'personal',now()+interval '4 days','Transactional request');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true);
 PERFORM public.quote_service_request(request_id,100,'Transactional coach',now()+interval '4 days');
 SELECT jsonb_build_object('aluno_id',student_id,'nome','Transactional workout','objetivo','Funcional','nivel','iniciante','data_inicio',current_date,'semanas',4,'exercicios',jsonb_agg(jsonb_build_object('exercicio_id',e.id,'dia_semana',extract(isodow from current_date)::int,'series',3,'repeticoes','10','descanso_seg',60,'carga_kg',0,'observacoes','QA'))) INTO payload FROM(SELECT id FROM public.exercicios_biblioteca WHERE ativo=true AND organization_id IS NULL LIMIT 3)e;
 IF jsonb_array_length(payload->'exercicios')<3 THEN RAISE EXCEPTION 'ASSERT: exercise library missing'; END IF;
 workout_id:=public.publish_workout(gen_random_uuid(),payload);
 revision_id:=public.revise_workout(workout_id,'Transactional revision',gen_random_uuid(),payload);
 IF NOT EXISTS(SELECT 1 FROM public.treinos WHERE id=workout_id AND status='revisado') THEN RAISE EXCEPTION 'ASSERT: old workout still active'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
 event_id:=public.save_condominium_event(NULL,org_id,'Transactional Health Day','QA',current_date+3,'10:00','11:00',1,'Academia');
 PERFORM public.set_condominium_event_status(event_id,'publicado');

 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',syndic_id,'role','authenticated')::text,true);
 PERFORM public.accept_organization_invite(syndic_inv.token);
 IF jsonb_array_length(public.syndic_operational_summary(org_id)->'residents')<>1 THEN RAISE EXCEPTION 'ASSERT: syndic safe roster wrong'; END IF;
 PERFORM public.save_activation_goals(org_id,'{"moradores":10,"checkins":20,"eventos":1}');
 PERFORM public.event_participants(event_id);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',resident_id,'role','authenticated')::text,true);
 PERFORM public.register_health_day(event_id,student_id);
 PERFORM public.cancel_health_day_registration(event_id,student_id);
 PERFORM public.transition_service_request(request_id,'accept');
 IF NOT EXISTS(SELECT 1 FROM public.pagamentos WHERE aluno_id=student_id AND valor=100) THEN RAISE EXCEPTION 'ASSERT: accepted service has no payment'; END IF;

 PERFORM public.transition_service_request(request_id,'cancel');
 IF NOT EXISTS(SELECT 1 FROM public.service_requests r JOIN public.pagamentos p ON p.id=r.payment_id WHERE r.id=request_id AND r.status='cancelada' AND p.status='cancelado') THEN RAISE EXCEPTION 'ASSERT: service cancellation did not cancel unpaid charge'; END IF;
 SELECT id INTO request_id FROM public.create_service_request(org_id,'personal',now()+interval '4 days','Second transactional request');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true);
 PERFORM public.quote_service_request(request_id,100,'Transactional coach',now()+interval '4 days');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',resident_id,'role','authenticated')::text,true);
 PERFORM public.transition_service_request(request_id,'accept');
 PERFORM public.save_workout_session(revision_id,'start');
 SELECT jsonb_object_agg(e->>'id',jsonb_build_object('completed',true,'carga','0')) INTO progress FROM jsonb_array_elements(public.student_workout()->'exercicios')e;
 PERFORM public.save_workout_session(revision_id,'pause',progress,'QA pause');
 PERFORM public.save_workout_session(revision_id,'resume',progress,'QA resume');
 PERFORM public.save_workout_session(revision_id,'finish',progress,'QA finish');
 IF NOT EXISTS(SELECT 1 FROM public.workout_sessions WHERE treino_id=revision_id AND status='concluido') THEN RAISE EXCEPTION 'ASSERT: workout session not completed'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',coach_id,'role','authenticated')::text,true);
 PERFORM public.transition_service_request(request_id,'complete');
 UPDATE public.alunos SET aulas_disponiveis=2 WHERE id=student_id;
 PERFORM public.reserve_professional_credit(booking_id,resident_id,student_id,jsonb_build_object('freelancer_id',coach_id,'method','qa'));
 PERFORM public.reserve_professional_credit(booking_id,resident_id,student_id,jsonb_build_object('freelancer_id',coach_id,'method','qa'));
 IF (SELECT aulas_disponiveis FROM public.alunos WHERE id=student_id)<>1 THEN RAISE EXCEPTION 'ASSERT: duplicate credit debit'; END IF;
 PERFORM public.finish_professional_booking(booking_id,NULL,'Transactional failure',true);
 PERFORM public.finish_professional_booking(booking_id,NULL,'Duplicate failure',true);
 IF (SELECT aulas_disponiveis FROM public.alunos WHERE id=student_id)<>2 THEN RAISE EXCEPTION 'ASSERT: refund mismatch'; END IF;

 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',outsider_id,'role','authenticated')::text,true);
 BEGIN PERFORM public.set_class_registration(class_id,student_id,true); RAISE EXCEPTION 'ASSERT: foreign student allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='ASSERT: foreign student allowed' THEN RAISE; END IF; END;
 BEGIN PERFORM public.syndic_operational_summary(org_id); RAISE EXCEPTION 'ASSERT: foreign summary allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='ASSERT: foreign summary allowed' THEN RAISE; END IF; END;
END $test$;
ROLLBACK;
SELECT 'passed: invites, profiles, class enrollment/cancel, reservation conflict, triage, workout publish/revise/start/pause/resume/finish, events, service quote/accept/cancel/complete, credit idempotency/refund, organization guards; rolled back' result;

