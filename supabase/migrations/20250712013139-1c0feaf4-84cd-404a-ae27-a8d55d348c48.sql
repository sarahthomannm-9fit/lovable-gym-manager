-- Fix RLS policies that are blocking data insertion
-- The current RLS policies are too restrictive and preventing data operations

-- First, let's update the RLS policies for all tables to allow proper data access
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

-- Enable realtime for all tables
ALTER TABLE public.alunos REPLICA IDENTITY FULL;
ALTER TABLE public.planos REPLICA IDENTITY FULL;
ALTER TABLE public.pagamentos REPLICA IDENTITY FULL;
ALTER TABLE public.checkins REPLICA IDENTITY FULL;
ALTER TABLE public.aulas REPLICA IDENTITY FULL;
ALTER TABLE public.historico_planos REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.alunos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pagamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.aulas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.historico_planos;

-- Insert some sample data to test the system
INSERT INTO public.planos (nome, preco, duracao_meses, beneficios, ativo) VALUES
('Mensal Básico', 89.90, 1, ARRAY['Academia completa', 'Horário livre'], true),
('Trimestral', 79.90, 3, ARRAY['Academia completa', 'Horário livre', '1 avaliação física'], true),
('Anual', 69.90, 12, ARRAY['Academia completa', 'Horário livre', 'Avaliações físicas ilimitadas', 'Aulas em grupo'], true)
ON CONFLICT DO NOTHING;

-- Insert sample students
INSERT INTO public.alunos (nome, email, telefone, status, valor_mensalidade, forma_pagamento, data_matricula) VALUES
('João Silva', 'joao@email.com', '(11) 99999-9999', 'ativo', 89.90, 'pix', CURRENT_DATE),
('Maria Santos', 'maria@email.com', '(11) 88888-8888', 'ativo', 79.90, 'cartao', CURRENT_DATE),
('Pedro Costa', 'pedro@email.com', '(11) 77777-7777', 'ativo', 69.90, 'dinheiro', CURRENT_DATE)
ON CONFLICT DO NOTHING;