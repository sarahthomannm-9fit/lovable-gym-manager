-- FASE 1: Limpeza e novas tabelas (CORRIGIDO)

-- 1.1: Remover planos duplicados usando row_number
WITH duplicados AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY nome, preco ORDER BY created_at) as rn
  FROM planos
)
DELETE FROM planos
WHERE id IN (
  SELECT id FROM duplicados WHERE rn > 1
);

-- 1.2: Criar tabela de frequência com suporte a QR Code
CREATE TABLE IF NOT EXISTS frequencia_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  horario_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  horario_saida TIMESTAMPTZ,
  tipo_entrada TEXT DEFAULT 'manual' CHECK (tipo_entrada IN ('manual', 'qrcode', 'app', 'biometria')),
  duracao_minutos INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN horario_saida IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (horario_saida - horario_entrada)) / 60
      ELSE NULL
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3: Criar tabela de funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  cargo TEXT NOT NULL CHECK (cargo IN ('professor', 'recepcionista', 'personal', 'nutricionista', 'fisioterapeuta', 'gerente')),
  especialidades TEXT[],
  horarios JSONB DEFAULT '{}',
  salario DECIMAL(10,2),
  data_contratacao DATE DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.4: Atualizar tabela de aulas com novos campos
ALTER TABLE aulas 
  ADD COLUMN IF NOT EXISTS categoria TEXT CHECK (categoria IN ('musculacao', 'funcional', 'yoga', 'pilates', 'spinning', 'crossfit', 'natacao', 'lutas', 'danca', 'alongamento', 'outro')),
  ADD COLUMN IF NOT EXISTS recorrencia TEXT DEFAULT 'unica' CHECK (recorrencia IN ('unica', 'diaria', 'semanal', 'mensal')),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_andamento', 'finalizada', 'cancelada')),
  ADD COLUMN IF NOT EXISTS inscritos_atual INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS modalidade TEXT DEFAULT 'presencial' CHECK (modalidade IN ('presencial', 'online', 'hibrida'));

-- 1.5: Criar tabela de inscritos em aulas
CREATE TABLE IF NOT EXISTS aulas_inscritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'inscrito' CHECK (status IN ('inscrito', 'presente', 'faltou', 'lista_espera', 'cancelado')),
  posicao_lista_espera INTEGER,
  data_inscricao TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aula_id, aluno_id)
);

-- 1.6: Criar tabela de assinaturas (preparação para Stripe)
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'pausada', 'pendente', 'expirada')),
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  data_proxima_cobranca DATE,
  valor_recorrente DECIMAL(10,2),
  metodo_pagamento TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_frequencia_alunos_data ON frequencia_alunos(data DESC);
CREATE INDEX IF NOT EXISTS idx_frequencia_alunos_aluno ON frequencia_alunos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aulas_inscritos_aula ON aulas_inscritos(aula_id);
CREATE INDEX IF NOT EXISTS idx_aulas_inscritos_aluno ON aulas_inscritos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aulas_data ON aulas(data_aula DESC);
CREATE INDEX IF NOT EXISTS idx_assinaturas_stripe ON assinaturas(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cargo ON funcionarios(cargo) WHERE ativo = true;

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE frequencia_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas_inscritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso completo para usuários autenticados)
CREATE POLICY "Allow full access to authenticated users" ON frequencia_alunos
  FOR ALL USING (true);

CREATE POLICY "Allow full access to authenticated users" ON funcionarios
  FOR ALL USING (true);

CREATE POLICY "Allow full access to authenticated users" ON aulas_inscritos
  FOR ALL USING (true);

CREATE POLICY "Allow full access to authenticated users" ON assinaturas
  FOR ALL USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_funcionarios_updated_at
  BEFORE UPDATE ON funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION set_current_timestamp_updated_at();

CREATE TRIGGER update_assinaturas_updated_at
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW
  EXECUTE FUNCTION set_current_timestamp_updated_at();

-- Função para atualizar contador de inscritos em aulas
CREATE OR REPLACE FUNCTION atualizar_contador_inscritos()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE aulas 
  SET inscritos_atual = (
    SELECT COUNT(*) 
    FROM aulas_inscritos 
    WHERE aula_id = COALESCE(NEW.aula_id, OLD.aula_id)
    AND status IN ('inscrito', 'presente')
  )
  WHERE id = COALESCE(NEW.aula_id, OLD.aula_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_contador_inscritos
  AFTER INSERT OR UPDATE OR DELETE ON aulas_inscritos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_contador_inscritos();