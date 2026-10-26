CREATE OR REPLACE FUNCTION public.accept_organization_invite(p_token uuid)
RETURNS public.organization_invites LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE inv public.organization_invites; v_email text; student public.alunos; display_name text;
BEGIN
 SELECT lower(btrim(u.email)),coalesce(nullif(u.raw_user_meta_data->>'nome',''),split_part(u.email,'@',1)) INTO v_email,display_name FROM auth.users u WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL;
 IF auth.uid() IS NULL OR v_email IS NULL THEN RAISE EXCEPTION 'Confirme seu e-mail antes de aceitar'; END IF;
 SELECT * INTO inv FROM public.organization_invites WHERE token=p_token FOR UPDATE;
 IF inv.id IS NULL OR inv.status<>'pendente' OR inv.expires_at<=now() OR lower(btrim(inv.email))<>v_email THEN RAISE EXCEPTION 'Convite inválido, expirado ou destinado a outro e-mail'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.organizations WHERE id=inv.organization_id AND status='ativo') THEN RAISE EXCEPTION 'Organização indisponível'; END IF;
 INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(inv.organization_id,auth.uid(),inv.papel::public.app_role) ON CONFLICT(organization_id,user_id,papel) DO NOTHING;
 INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),inv.papel::public.app_role) ON CONFLICT(user_id,role) DO NOTHING;
 INSERT INTO public.profiles(id,nome,email) VALUES(auth.uid(),display_name,v_email) ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email;
 IF inv.papel::text='user' THEN
  PERFORM pg_advisory_xact_lock(hashtext(v_email));
  SELECT * INTO student FROM public.alunos a WHERE lower(btrim(a.email))=v_email FOR UPDATE;
  IF student.id IS NOT NULL AND ((student.user_id IS NOT NULL AND student.user_id<>auth.uid()) OR (student.organization_id IS NOT NULL AND student.organization_id<>inv.organization_id)) THEN RAISE EXCEPTION 'Cadastro vinculado a outro acesso ou condomínio. Solicite revisão ao administrador'; END IF;
  IF student.id IS NULL THEN
   INSERT INTO public.alunos(nome,email,user_id,organization_id,status,lifecycle_status,data_matricula,tipo) VALUES(display_name,v_email,auth.uid(),inv.organization_id,'ativo','ativo',current_date,'presencial');
  ELSE UPDATE public.alunos SET user_id=auth.uid(),organization_id=inv.organization_id WHERE id=student.id; END IF;
 ELSIF inv.papel::text='professor' THEN
  IF EXISTS(SELECT 1 FROM public.funcionarios f WHERE f.organization_id=inv.organization_id AND (f.user_id=auth.uid() OR lower(btrim(f.email))=v_email)) THEN
   UPDATE public.funcionarios SET user_id=auth.uid(),ativo=true WHERE organization_id=inv.organization_id AND (user_id=auth.uid() OR lower(btrim(funcionarios.email))=v_email);
  ELSE INSERT INTO public.funcionarios(nome,email,user_id,organization_id,cargo,ativo) VALUES(display_name,v_email,auth.uid(),inv.organization_id,'professor',true); END IF;
 END IF;
 UPDATE public.organization_invites SET status='aceito',accepted_by=auth.uid(),accepted_at=now() WHERE id=inv.id RETURNING * INTO inv;
 RETURN inv;
END; $$;

CREATE OR REPLACE FUNCTION public.event_participants(p_event uuid)
RETURNS TABLE(id uuid,aluno_id uuid,nome text,email text,status text,checkin_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE org uuid;
BEGIN
 SELECT organization_id INTO org FROM public.eventos_condominio WHERE eventos_condominio.id=p_event;
 IF org IS NULL OR NOT public.persona_has_role(org,ARRAY['manager','sindico']) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 RETURN QUERY SELECT r.id,r.aluno_id,a.nome::text,a.email::text,r.status,r.checkin_at FROM public.health_day_inscricoes r JOIN public.alunos a ON a.id=r.aluno_id AND a.organization_id=org WHERE r.evento_id=p_event ORDER BY r.created_at;
END; $$;
REVOKE ALL ON FUNCTION public.event_participants(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.event_participants(uuid) TO authenticated;
