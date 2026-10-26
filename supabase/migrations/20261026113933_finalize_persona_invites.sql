CREATE OR REPLACE FUNCTION public.accept_organization_invite(p_token uuid)
RETURNS public.organization_invites LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE inv public.organization_invites; email text; student public.alunos; display_name text;
BEGIN
 SELECT lower(btrim(u.email)),coalesce(nullif(u.raw_user_meta_data->>'nome',''),split_part(u.email,'@',1)) INTO email,display_name FROM auth.users u WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL;
 IF auth.uid() IS NULL OR email IS NULL THEN RAISE EXCEPTION 'Confirme seu e-mail antes de aceitar'; END IF;
 SELECT * INTO inv FROM public.organization_invites WHERE token=p_token FOR UPDATE;
 IF inv.id IS NULL OR inv.status<>'pendente' OR inv.expires_at<=now() OR lower(btrim(inv.email))<>email THEN RAISE EXCEPTION 'Convite inválido, expirado ou destinado a outro e-mail'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.organizations WHERE id=inv.organization_id AND status='ativo') THEN RAISE EXCEPTION 'Organização indisponível'; END IF;
 INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(inv.organization_id,auth.uid(),inv.papel) ON CONFLICT(organization_id,user_id,papel) DO NOTHING;
 INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),inv.papel) ON CONFLICT(user_id,role) DO NOTHING;
 INSERT INTO public.profiles(id,nome,email) VALUES(auth.uid(),display_name,email) ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email;
 IF inv.papel::text='user' THEN
  PERFORM pg_advisory_xact_lock(hashtext(email));
  SELECT * INTO student FROM public.alunos a WHERE lower(btrim(a.email))=email FOR UPDATE;
  IF student.id IS NOT NULL AND ((student.user_id IS NOT NULL AND student.user_id<>auth.uid()) OR (student.organization_id IS NOT NULL AND student.organization_id<>inv.organization_id)) THEN RAISE EXCEPTION 'Cadastro vinculado a outro acesso ou condomínio. Solicite revisão ao administrador'; END IF;
  IF student.id IS NULL THEN
   INSERT INTO public.alunos(nome,email,user_id,organization_id,status,lifecycle_status,data_matricula,tipo) VALUES(display_name,email,auth.uid(),inv.organization_id,'ativo','ativo',current_date,'presencial');
  ELSE UPDATE public.alunos SET user_id=auth.uid(),organization_id=inv.organization_id WHERE id=student.id; END IF;
 ELSIF inv.papel::text='professor' THEN
  IF EXISTS(SELECT 1 FROM public.funcionarios f WHERE f.organization_id=inv.organization_id AND (f.user_id=auth.uid() OR lower(btrim(f.email))=email)) THEN
   UPDATE public.funcionarios SET user_id=auth.uid(),ativo=true WHERE organization_id=inv.organization_id AND (user_id=auth.uid() OR lower(btrim(funcionarios.email))=email);
  ELSE INSERT INTO public.funcionarios(nome,email,user_id,organization_id,cargo,ativo) VALUES(display_name,email,auth.uid(),inv.organization_id,'Professor',true); END IF;
 END IF;
 UPDATE public.organization_invites SET status='aceito',accepted_by=auth.uid(),accepted_at=now() WHERE id=inv.id RETURNING * INTO inv;
 RETURN inv;
END; $$;
CREATE OR REPLACE FUNCTION public.accept_staff_invite(p_token uuid)
RETURNS public.staff_invites LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE inv public.staff_invites; staff public.funcionarios; email text;
BEGIN
 SELECT lower(btrim(u.email)) INTO email FROM auth.users u WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL;
 IF auth.uid() IS NULL OR email IS NULL THEN RAISE EXCEPTION 'Confirme seu e-mail antes de aceitar'; END IF;
 SELECT * INTO inv FROM public.staff_invites WHERE token=p_token FOR UPDATE;
 IF inv.id IS NULL OR inv.status<>'pendente' OR inv.expires_at<=now() OR lower(btrim(inv.email))<>email THEN RAISE EXCEPTION 'Convite inválido, expirado ou destinado a outro e-mail'; END IF;
 SELECT * INTO staff FROM public.funcionarios WHERE id=inv.funcionario_id FOR UPDATE;
 IF staff.id IS NULL OR NOT staff.ativo OR staff.organization_id<>inv.organization_id OR lower(btrim(staff.email))<>email OR (staff.user_id IS NOT NULL AND staff.user_id<>auth.uid()) THEN RAISE EXCEPTION 'Cadastro do coach indisponível'; END IF;
 UPDATE public.funcionarios SET user_id=auth.uid() WHERE id=staff.id;
 INSERT INTO public.organization_members(organization_id,user_id,papel) VALUES(inv.organization_id,auth.uid(),'professor') ON CONFLICT(organization_id,user_id,papel) DO NOTHING;
 INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),'professor') ON CONFLICT(user_id,role) DO NOTHING;
 UPDATE public.staff_invites SET status='aceito',accepted_by=auth.uid(),accepted_at=now() WHERE id=inv.id RETURNING * INTO inv;
 RETURN inv;
END; $$;
CREATE OR REPLACE FUNCTION public.get_alunos_sem_checkin(p_dias integer DEFAULT 15,p_org_id uuid DEFAULT NULL)
RETURNS TABLE(aluno_id uuid,nome varchar,email varchar,telefone varchar,ultimo_checkin date,dias_ausente integer,plano_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR (p_org_id IS NULL AND NOT public.is_admin(auth.uid())) OR (p_org_id IS NOT NULL AND NOT public.persona_has_role(p_org_id,ARRAY['manager','professor'])) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 RETURN QUERY SELECT a.id,a.nome,a.email,a.telefone,max(c.data_checkin)::date,(current_date-coalesce(max(c.data_checkin)::date,a.data_matricula::date))::int,a.plano_id FROM public.alunos a LEFT JOIN public.checkins c ON c.aluno_id=a.id WHERE a.lifecycle_status='ativo' AND (p_org_id IS NULL OR a.organization_id=p_org_id) GROUP BY a.id HAVING max(c.data_checkin)<current_date-greatest(p_dias,1) OR max(c.data_checkin) IS NULL ORDER BY max(c.data_checkin) NULLS FIRST;
END; $$;
CREATE OR REPLACE FUNCTION public.read_resident_notification(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.notificacoes n SET status='lida' WHERE n.id=p_id AND n.destinatario_tipo='aluno' AND EXISTS(SELECT 1 FROM public.alunos a WHERE a.id=n.destinatario_id AND a.user_id=auth.uid());
 IF NOT FOUND THEN RAISE EXCEPTION 'Notificação indisponível'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.accept_organization_invite(uuid),public.accept_staff_invite(uuid),public.get_alunos_sem_checkin(integer,uuid),public.read_resident_notification(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_organization_invite(uuid),public.accept_staff_invite(uuid),public.get_alunos_sem_checkin(integer,uuid),public.read_resident_notification(uuid) TO authenticated;
