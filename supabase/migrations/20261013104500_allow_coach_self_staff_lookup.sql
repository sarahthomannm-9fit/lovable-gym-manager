CREATE POLICY funcionarios_self_read ON public.funcionarios FOR SELECT TO authenticated
USING (user_id=auth.uid() AND ativo);

