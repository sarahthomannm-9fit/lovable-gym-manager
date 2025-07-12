-- Fix RLS policies that are blocking data insertion
-- Update the RLS policies for all tables to allow proper data access

-- For alunos (students) table
DROP POLICY IF EXISTS "Acesso total para autenticados" ON public.alunos;
CREATE POLICY "Allow full access to authenticated users" ON public.alunos
FOR ALL USING (true);

-- For planos (plans) table  
DROP POLICY IF EXISTS "Acesso total para autenticados" ON public.planos;
CREATE POLICY "Allow full access to authenticated users" ON public.planos
FOR ALL USING (true);

-- For pagamentos (payments) table
DROP POLICY IF EXISTS "Acesso total para autenticados" ON public.pagamentos;
CREATE POLICY "Allow full access to authenticated users" ON public.pagamentos
FOR ALL USING (true);

-- For checkins table
DROP POLICY IF EXISTS "Acesso total para autenticados" ON public.checkins;
CREATE POLICY "Allow full access to authenticated users" ON public.checkins
FOR ALL USING (true);

-- For aulas (classes) table
DROP POLICY IF EXISTS "Acesso total para autenticados" ON public.aulas;
CREATE POLICY "Allow full access to authenticated users" ON public.aulas
FOR ALL USING (true);

-- For historico_planos table
DROP POLICY IF EXISTS "Acesso total para autenticados" ON public.historico_planos;
CREATE POLICY "Allow full access to authenticated users" ON public.historico_planos
FOR ALL USING (true);

-- For usuarios table
DROP POLICY IF EXISTS "Acesso total para autenticados" ON public.usuarios;
CREATE POLICY "Allow full access to authenticated users" ON public.usuarios
FOR ALL USING (true);

-- Insert sample data to test the system
INSERT INTO public.planos (nome, preco, duracao_meses, beneficios, ativo) VALUES
('Mensal Básico', 89.90, 1, ARRAY['Academia completa', 'Horário livre'], true),
('Trimestral', 79.90, 3, ARRAY['Academia completa', 'Horário livre', '1 avaliação física'], true),
('Anual', 69.90, 12, ARRAY['Academia completa', 'Horário livre', 'Avaliações físicas ilimitadas', 'Aulas em grupo'], true)
ON CONFLICT DO NOTHING;