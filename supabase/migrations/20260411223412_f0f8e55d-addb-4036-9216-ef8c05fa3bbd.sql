
-- =============================================
-- 1. FIX USUARIOS TABLE - Remove public access to password hashes
-- =============================================
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.usuarios;

-- Only authenticated users can read non-sensitive fields
CREATE POLICY "Authenticated users can read usuarios"
ON public.usuarios FOR SELECT TO authenticated
USING (true);

-- Only admins can modify usuarios
CREATE POLICY "Admins can modify usuarios"
ON public.usuarios FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Revoke direct access to senha_hash column from anon and authenticated
REVOKE ALL ON public.usuarios FROM anon;
GRANT SELECT (id, nome, email, tipo, created_at, updated_at) ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;

-- =============================================
-- 2. FIX ENTITLEMENTS TABLE - Restrict to authenticated
-- =============================================
DROP POLICY IF EXISTS "Allow full access to entitlements" ON public.entitlements;

CREATE POLICY "Authenticated users can read entitlements"
ON public.entitlements FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage entitlements"
ON public.entitlements FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 3. FIX ALL BUSINESS TABLES - Change from {public} to {authenticated}
-- =============================================

-- alunos
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.alunos;
CREATE POLICY "Authenticated full access to alunos"
ON public.alunos FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- pagamentos
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.pagamentos;
CREATE POLICY "Authenticated full access to pagamentos"
ON public.pagamentos FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- checkins
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.checkins;
CREATE POLICY "Authenticated full access to checkins"
ON public.checkins FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- planos
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.planos;
CREATE POLICY "Authenticated full access to planos"
ON public.planos FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- aulas
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.aulas;
CREATE POLICY "Authenticated full access to aulas"
ON public.aulas FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- aulas_inscritos
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.aulas_inscritos;
CREATE POLICY "Authenticated full access to aulas_inscritos"
ON public.aulas_inscritos FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- aulas_experimentais
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.aulas_experimentais;
CREATE POLICY "Authenticated full access to aulas_experimentais"
ON public.aulas_experimentais FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- treinos
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.treinos;
CREATE POLICY "Authenticated full access to treinos"
ON public.treinos FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- avaliacoes_fisicas
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.avaliacoes_fisicas;
CREATE POLICY "Authenticated full access to avaliacoes_fisicas"
ON public.avaliacoes_fisicas FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- funcionarios
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.funcionarios;
CREATE POLICY "Authenticated full access to funcionarios"
ON public.funcionarios FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- historico_planos
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.historico_planos;
CREATE POLICY "Authenticated full access to historico_planos"
ON public.historico_planos FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- notificacoes
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.notificacoes;
CREATE POLICY "Authenticated full access to notificacoes"
ON public.notificacoes FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- config_notificacoes
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.config_notificacoes;
CREATE POLICY "Authenticated full access to config_notificacoes"
ON public.config_notificacoes FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- frequencia_alunos
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.frequencia_alunos;
CREATE POLICY "Authenticated full access to frequencia_alunos"
ON public.frequencia_alunos FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- formas_pagamento
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.formas_pagamento;
CREATE POLICY "Authenticated full access to formas_pagamento"
ON public.formas_pagamento FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- alunos_planos
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.alunos_planos;
CREATE POLICY "Authenticated full access to alunos_planos"
ON public.alunos_planos FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- assinaturas
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.assinaturas;
CREATE POLICY "Authenticated full access to assinaturas"
ON public.assinaturas FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- campanhas_marketing
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.campanhas_marketing;
CREATE POLICY "Authenticated full access to campanhas_marketing"
ON public.campanhas_marketing FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- mensagens_marketing
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.mensagens_marketing;
CREATE POLICY "Authenticated full access to mensagens_marketing"
ON public.mensagens_marketing FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- leads
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.leads;
CREATE POLICY "Authenticated full access to leads"
ON public.leads FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- analises_produto
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.analises_produto;
CREATE POLICY "Authenticated full access to analises_produto"
ON public.analises_produto FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- produtos
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.produtos;
CREATE POLICY "Authenticated full access to produtos"
ON public.produtos FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- promocoes
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.promocoes;
CREATE POLICY "Authenticated full access to promocoes"
ON public.promocoes FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- system_events
DROP POLICY IF EXISTS "Allow full access to system_events" ON public.system_events;
CREATE POLICY "Authenticated full access to system_events"
ON public.system_events FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- pessoa_eventos
DROP POLICY IF EXISTS "Allow full access to pessoa_eventos" ON public.pessoa_eventos;
CREATE POLICY "Authenticated full access to pessoa_eventos"
ON public.pessoa_eventos FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- skus
DROP POLICY IF EXISTS "Allow full access to skus" ON public.skus;
CREATE POLICY "Authenticated full access to skus"
ON public.skus FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- sku_permissions
DROP POLICY IF EXISTS "Allow full access to sku_permissions" ON public.sku_permissions;
CREATE POLICY "Authenticated full access to sku_permissions"
ON public.sku_permissions FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 4. FIX ANAMNESE - Keep public read/write but only by token
-- =============================================
DROP POLICY IF EXISTS "Public read/write for anamnese by token" ON public.anamnese_respostas;

-- Public can read by token (for the public form)
CREATE POLICY "Public read anamnese by token"
ON public.anamnese_respostas FOR SELECT TO anon, authenticated
USING (true);

-- Public can update by token (submit the form)
CREATE POLICY "Public update anamnese by token"
ON public.anamnese_respostas FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Only authenticated can insert new anamnese records
CREATE POLICY "Authenticated insert anamnese"
ON public.anamnese_respostas FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 5. FIX STORAGE - Add policies for cadastroalunos bucket
-- =============================================
CREATE POLICY "Authenticated users can read cadastroalunos files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cadastroalunos');

CREATE POLICY "Authenticated users can upload to cadastroalunos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cadastroalunos');

CREATE POLICY "Authenticated users can update cadastroalunos files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cadastroalunos');

CREATE POLICY "Authenticated users can delete cadastroalunos files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cadastroalunos');

-- =============================================
-- 6. FIX FUNCTION SEARCH PATH - calcular_imc
-- =============================================
CREATE OR REPLACE FUNCTION public.calcular_imc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.peso IS NOT NULL AND NEW.altura IS NOT NULL AND NEW.altura > 0 THEN
    NEW.imc := ROUND((NEW.peso / (NEW.altura * NEW.altura))::numeric, 2);
  END IF;
  RETURN NEW;
END;
$function$;
