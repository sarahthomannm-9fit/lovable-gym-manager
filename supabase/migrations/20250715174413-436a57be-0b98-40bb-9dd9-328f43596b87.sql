-- Criar tabelas necessárias para o sistema
-- Tabela alunos (atualizada)
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  tipo TEXT CHECK (tipo IN ('presencial', 'consultoria')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela planos (atualizada)
CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('mensal', 'avulso', 'pacote')),
  valor NUMERIC NOT NULL,
  duracao_dias INT,
  quantidade_aulas INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

-- Tabela aulas (atualizada)
CREATE TABLE IF NOT EXISTS aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id),
  plano_id UUID REFERENCES planos(id),
  data DATE,
  status TEXT DEFAULT 'agendada',
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

-- Tabela checkins (atualizada)
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id),
  data TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para todas as tabelas
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

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

INSERT INTO planos (nome, tipo, valor, duracao_dias, quantidade_aulas) 
SELECT * FROM (VALUES
  ('Mensal Básico', 'mensal', 149.90, 30, 12),
  ('Mensal Premium', 'mensal', 199.90, 30, 20),
  ('Pacote 10 aulas', 'pacote', 129.90, NULL, 10),
  ('Avulso', 'avulso', 19.90, NULL, 1)
) AS v(nome, tipo, valor, duracao_dias, quantidade_aulas)
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome = v.nome);

INSERT INTO alunos (nome, email, tipo) 
SELECT * FROM (VALUES
  ('João Silva', 'joao@email.com', 'presencial'),
  ('Maria Santos', 'maria@email.com', 'consultoria'),
  ('Pedro Oliveira', 'pedro@email.com', 'presencial')
) AS v(nome, email, tipo)
WHERE NOT EXISTS (SELECT 1 FROM alunos WHERE email = v.email);