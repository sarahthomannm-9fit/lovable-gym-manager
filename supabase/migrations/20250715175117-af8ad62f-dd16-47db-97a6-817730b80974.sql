-- Tabela formas_pagamento
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela alunos_planos (vínculo entre aluno e plano)
CREATE TABLE IF NOT EXISTS alunos_planos (
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

-- Tabela treinos
CREATE TABLE IF NOT EXISTS treinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id),
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar coluna tipo à tabela alunos existente
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (tipo IN ('presencial', 'consultoria'));

-- Adicionar colunas à tabela planos existente
ALTER TABLE planos ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (tipo IN ('mensal', 'avulso', 'pacote'));
ALTER TABLE planos ADD COLUMN IF NOT EXISTS valor NUMERIC;
ALTER TABLE planos ADD COLUMN IF NOT EXISTS duracao_dias INT;
ALTER TABLE planos ADD COLUMN IF NOT EXISTS quantidade_aulas INT DEFAULT 0;

-- Atualizar dados existentes na tabela planos
UPDATE planos SET valor = preco WHERE valor IS NULL;
UPDATE planos SET tipo = 'mensal' WHERE tipo IS NULL;

-- Habilitar RLS para todas as tabelas
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para novas tabelas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'formas_pagamento' AND policyname = 'Allow full access to authenticated users'
  ) THEN
    CREATE POLICY "Allow full access to authenticated users" ON formas_pagamento FOR ALL USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'alunos_planos' AND policyname = 'Allow full access to authenticated users'
  ) THEN
    CREATE POLICY "Allow full access to authenticated users" ON alunos_planos FOR ALL USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'treinos' AND policyname = 'Allow full access to authenticated users'
  ) THEN
    CREATE POLICY "Allow full access to authenticated users" ON treinos FOR ALL USING (true);
  END IF;
END $$;

-- Função RPC para relatório de receitas por plano
CREATE OR REPLACE FUNCTION relatorio_receitas_por_plano()
RETURNS TABLE (nome_plano TEXT, forma_pagamento TEXT, total_recebido NUMERIC)
LANGUAGE sql AS $$
  SELECT p.nome AS nome_plano, f.descricao AS forma_pagamento, SUM(p.valor) AS total_recebido
  FROM alunos_planos ap
  JOIN planos p ON ap.plano_id = p.id
  JOIN formas_pagamento f ON ap.forma_pagamento_id = f.id
  GROUP BY p.nome, f.descricao
$$;

-- Inserir dados de exemplo nas novas tabelas
INSERT INTO formas_pagamento (descricao) 
SELECT * FROM (VALUES 
  ('Dinheiro'),
  ('Cartão de Crédito'),
  ('Cartão de Débito'),
  ('PIX'),
  ('Transferência Bancária')
) AS v(descricao)
WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE descricao = v.descricao);

-- Atualizar dados na tabela planos
UPDATE planos SET 
  nome = 'Mensal Básico',
  tipo = 'mensal',
  valor = 149.90,
  duracao_dias = 30,
  quantidade_aulas = 12
WHERE id = (SELECT id FROM planos LIMIT 1);

-- Atualizar dados na tabela alunos
UPDATE alunos SET 
  nome = 'João Silva',
  email = 'joao@email.com',
  tipo = 'presencial'
WHERE id = (SELECT id FROM alunos LIMIT 1);