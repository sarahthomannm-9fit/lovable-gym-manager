CREATE OR REPLACE FUNCTION public.accept_organization_invite(p_token uuid)
RETURNS public.organization_invites LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE inv public.organization_invites; v_email text; student public.alunos; display_name text;
BEGIN
 SELECT lower(btrim(u.email)),coalesce(nullif(u.raw_user_meta_data->>'nome',''),split_part(u.email,'@',1)) INTO v_email,display_name FROM auth.users u WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL;
 IF auth.uid() IS NULL OR v_email IS NULL THEN RAISE EXCEPTION 'Confirme seu e-mail antes de aceitar'; END IF;
 SELECT * INTO inv FROM public.organization_invites WHERE token=p_token FOR UPDATE;
 IF inv.id IS NULL OR inv.status<>'pendente' OR inv.expires_at<=now() OR lower(btrim(inv.email))<>v_email THEN RAISE EXCEPTION 'Convite inválido, expirado ou destinado a outro e-mail'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.organizations WHERE id=inv.organization_id AND status='ativo') THEN RAISE EXCEPTION 'Organização indisponível'; END IF;
 INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(inv.organization_id,auth.uid(),inv.papel) ON CONFLICT(organization_id,user_id,papel) DO NOTHING;
 INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),inv.papel) ON CONFLICT(user_id,role) DO NOTHING;
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
CREATE OR REPLACE FUNCTION public.accept_staff_invite(p_token uuid)
RETURNS public.staff_invites LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE inv public.staff_invites; staff public.funcionarios; v_email text;
BEGIN
 SELECT lower(btrim(u.email)) INTO v_email FROM auth.users u WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL;
 IF auth.uid() IS NULL OR v_email IS NULL THEN RAISE EXCEPTION 'Confirme seu e-mail antes de aceitar'; END IF;
 SELECT * INTO inv FROM public.staff_invites WHERE token=p_token FOR UPDATE;
 IF inv.id IS NULL OR inv.status<>'pendente' OR inv.expires_at<=now() OR lower(btrim(inv.email))<>v_email THEN RAISE EXCEPTION 'Convite inválido, expirado ou destinado a outro e-mail'; END IF;
 SELECT * INTO staff FROM public.funcionarios WHERE id=inv.funcionario_id FOR UPDATE;
 IF staff.id IS NULL OR NOT staff.ativo OR staff.organization_id<>inv.organization_id OR lower(btrim(staff.email))<>v_email OR (staff.user_id IS NOT NULL AND staff.user_id<>auth.uid()) THEN RAISE EXCEPTION 'Cadastro do coach indisponível'; END IF;
 UPDATE public.funcionarios SET user_id=auth.uid() WHERE id=staff.id;
 INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(inv.organization_id,auth.uid(),'professor') ON CONFLICT(organization_id,user_id,papel) DO NOTHING;
 INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),'professor') ON CONFLICT(user_id,role) DO NOTHING;
 UPDATE public.staff_invites SET status='aceito',accepted_by=auth.uid(),accepted_at=now() WHERE id=inv.id RETURNING * INTO inv;
 RETURN inv;
END; $$;

CREATE OR REPLACE FUNCTION public.create_organization_invite(p_organization_id uuid,p_email text,p_papel text)
RETURNS public.organization_invites LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE org public.organizations;inv public.organization_invites;email_value text:=lower(btrim(coalesce(p_email,'')));role_value text:=lower(btrim(coalesce(p_papel,'')));
BEGIN
 IF auth.uid() IS NULL OR NOT public.persona_has_role(p_organization_id,ARRAY['manager','sindico','corporate']) THEN RAISE EXCEPTION 'Sem permissão para convidar'; END IF;
 IF email_value !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' THEN RAISE EXCEPTION 'E-mail inválido'; END IF;
 SELECT * INTO org FROM public.organizations WHERE id=p_organization_id AND status='ativo';
 IF org.id IS NULL THEN RAISE EXCEPTION 'Organização indisponível'; END IF;
 IF (org.tipo='corporate' AND role_value NOT IN('corporate','user')) OR (org.tipo='condominio' AND role_value NOT IN('sindico','professor','user')) OR (org.tipo IN('studio','professor') AND role_value NOT IN('professor','user')) THEN RAISE EXCEPTION 'Papel inválido para esta organização'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(p_organization_id::text||email_value||role_value));
 SELECT * INTO inv FROM public.organization_invites WHERE organization_id=p_organization_id AND email=email_value AND papel::text=role_value AND status='pendente' AND expires_at>now() ORDER BY created_at DESC LIMIT 1;
 IF inv.id IS NOT NULL THEN RETURN inv; END IF;
 INSERT INTO public.organization_invites(organization_id,email,papel,invited_by) VALUES(p_organization_id,email_value,role_value::public.app_role,auth.uid()) RETURNING * INTO inv;
 RETURN inv;
END; $$;
REVOKE ALL ON FUNCTION public.create_organization_invite(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_organization_invite(uuid,text,text) TO authenticated;
