CREATE OR REPLACE FUNCTION public.audit_workout_prescription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE org uuid;action_value text;row_data jsonb;
BEGIN
 row_data:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 org:=(row_data->>'organization_id')::uuid;
 action_value:=CASE WHEN TG_OP='INSERT' THEN 'created' WHEN TG_OP='DELETE' THEN 'archived' WHEN NEW.status IN('ativo','publicado') AND OLD.status IS DISTINCT FROM NEW.status THEN 'published' ELSE 'updated' END;
 INSERT INTO public.prescription_audit_log(organization_id,student_id,treino_id,actor_user_id,actor_id,action,details,payload)
 VALUES(org,CASE WHEN TG_OP='DELETE' THEN NULL ELSE (row_data->>'aluno_id')::uuid END,CASE WHEN TG_OP='DELETE' THEN NULL ELSE (row_data->>'id')::uuid END,auth.uid(),auth.uid(),action_value,jsonb_build_object('workout_id',row_data->>'id','status',row_data->>'status','name',row_data->>'nome'),jsonb_build_object('status',row_data->>'status','name',row_data->>'nome'));
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END; $$;
