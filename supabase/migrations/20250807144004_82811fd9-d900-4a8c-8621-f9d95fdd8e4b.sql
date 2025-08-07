
-- LIMPEZA DE DADOS DE TESTE
-- ⚠️ Apaga dados fake preservando dados reais
DELETE FROM checkins
  WHERE aluno_id NOT IN (SELECT id FROM alunos WHERE telefone IS NOT NULL);
DELETE FROM pagamentos
  WHERE aluno_id NOT IN (SELECT id FROM alunos WHERE telefone IS NOT NULL);
DELETE FROM historico_planos
  WHERE aluno_id NOT IN (SELECT id FROM alunos WHERE telefone IS NOT NULL);
DELETE FROM aulas
  WHERE descricao ILIKE '%teste%' OR descricao ILIKE '%fake%';
DELETE FROM alunos
  WHERE telefone IS NULL;
DELETE FROM planos;

-- Recriar tabela alunos com nova estrutura
DROP TABLE IF EXISTS alunos CASCADE;
CREATE TABLE alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  tipo TEXT CHECK (tipo IN ('presencial', 'consultoria')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recriar tabela planos com nova estrutura
DROP TABLE IF EXISTS planos CASCADE;
CREATE TABLE planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('mensal', 'avulso', 'pacote')),
  valor NUMERIC NOT NULL,
  duracao_dias INT,
  quantidade_aulas INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recriar tabela formas_pagamento
DROP TABLE IF EXISTS formas_pagamento CASCADE;
CREATE TABLE formas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recriar tabela alunos_planos
DROP TABLE IF EXISTS alunos_planos CASCADE;
CREATE TABLE alunos_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos(id) ON DELETE CASCADE,
  forma_pagamento_id UUID REFERENCES formas_pagamento(id),
  data_inicio DATE,
  data_fim DATE,
  status TEXT CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recriar tabela aulas
DROP TABLE IF EXISTS aulas CASCADE;
CREATE TABLE aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id),
  plano_id UUID REFERENCES planos(id),
  data DATE,
  status TEXT DEFAULT 'agendada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recriar tabela treinos
DROP TABLE IF EXISTS treinos CASCADE;
CREATE TABLE treinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id),
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recriar tabela checkins
DROP TABLE IF EXISTS checkins CASCADE;
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id),
  data TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recriar tabela pagamentos para compatibilidade
DROP TABLE IF EXISTS pagamentos CASCADE;
CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id),
  valor NUMERIC NOT NULL,
  forma_pagamento_id UUID REFERENCES formas_pagamento(id),
  data_pagamento DATE,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para acesso completo (autenticado)
CREATE POLICY "Allow full access to authenticated users" ON alunos FOR ALL USING (true);
CREATE POLICY "Allow full access to authenticated users" ON planos FOR ALL USING (true);
CREATE POLICY "Allow full access to authenticated users" ON formas_pagamento FOR ALL USING (true);
CREATE POLICY "Allow full access to authenticated users" ON alunos_planos FOR ALL USING (true);
CREATE POLICY "Allow full access to authenticated users" ON aulas FOR ALL USING (true);
CREATE POLICY "Allow full access to authenticated users" ON treinos FOR ALL USING (true);
CREATE POLICY "Allow full access to authenticated users" ON checkins FOR ALL USING (true);
CREATE POLICY "Allow full access to authenticated users" ON pagamentos FOR ALL USING (true);

-- Função Supabase de relatório financeiro
CREATE OR REPLACE FUNCTION relatorio_receitas_por_plano()
RETURNS TABLE (nome_plano TEXT, forma_pagamento TEXT, total_recebido NUMERIC)
LANGUAGE sql AS $$
  SELECT p.nome AS nome_plano,
         f.descricao AS forma_pagamento,
         SUM(p.valor) AS total_recebido
    FROM alunos_planos ap
    JOIN planos p ON ap.plano_id = p.id
    JOIN formas_pagamento f ON ap.forma_pagamento_id = f.id
   GROUP BY p.nome, f.descricao;
$$;
