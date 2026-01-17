-- =============================================
-- FASE 2: Criar função update_updated_at_column e tabelas
-- =============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tabela de Avaliações Físicas
CREATE TABLE IF NOT EXISTS avaliacoes_fisicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
  avaliador_id UUID REFERENCES funcionarios(id),
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Medidas corporais
  peso DECIMAL(5,2),
  altura DECIMAL(3,2),
  imc DECIMAL(4,2),
  percentual_gordura DECIMAL(4,2),
  massa_muscular DECIMAL(5,2),
  massa_ossea DECIMAL(4,2),
  agua_corporal DECIMAL(4,2),
  
  -- Circunferências (cm)
  circunferencia_pescoco DECIMAL(5,2),
  circunferencia_peitoral DECIMAL(5,2),
  circunferencia_cintura DECIMAL(5,2),
  circunferencia_quadril DECIMAL(5,2),
  circunferencia_braco_direito DECIMAL(5,2),
  circunferencia_braco_esquerdo DECIMAL(5,2),
  circunferencia_coxa_direita DECIMAL(5,2),
  circunferencia_coxa_esquerda DECIMAL(5,2),
  circunferencia_panturrilha_direita DECIMAL(5,2),
  circunferencia_panturrilha_esquerda DECIMAL(5,2),
  
  -- Dobras cutâneas (mm)
  dobra_triceps DECIMAL(4,2),
  dobra_biceps DECIMAL(4,2),
  dobra_subescapular DECIMAL(4,2),
  dobra_suprailiaca DECIMAL(4,2),
  dobra_abdominal DECIMAL(4,2),
  dobra_coxa DECIMAL(4,2),
  dobra_panturrilha DECIMAL(4,2),
  
  -- Testes funcionais
  teste_flexibilidade JSONB DEFAULT '{}',
  teste_forca JSONB DEFAULT '{}',
  teste_resistencia JSONB DEFAULT '{}',
  
  -- Observações e metas
  observacoes TEXT,
  metas JSONB DEFAULT '[]',
  proxima_avaliacao DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Notificações do Sistema
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('pagamento', 'aula', 'aniversario', 'avaliacao', 'promocao', 'lembrete', 'sistema')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  destinatario_tipo TEXT NOT NULL CHECK (destinatario_tipo IN ('aluno', 'funcionario', 'todos')),
  destinatario_id UUID,
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  
  -- Status e agendamento
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviada', 'lida', 'arquivada')),
  data_agendada TIMESTAMPTZ,
  data_envio TIMESTAMPTZ,
  data_leitura TIMESTAMPTZ,
  
  -- Canais de envio
  canal TEXT[] DEFAULT ARRAY['sistema'],
  enviado_email BOOLEAN DEFAULT false,
  enviado_whatsapp BOOLEAN DEFAULT false,
  enviado_push BOOLEAN DEFAULT false,
  
  -- Metadados
  dados_extras JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Aulas Experimentais (Funil de Conversão)
CREATE TABLE IF NOT EXISTS aulas_experimentais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do interessado
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  fonte TEXT CHECK (fonte IN ('instagram', 'facebook', 'google', 'indicacao', 'site', 'presencial', 'whatsapp', 'outro')),
  
  -- Aula experimental
  aula_id UUID REFERENCES aulas(id),
  data_agendada DATE NOT NULL,
  horario_agendado TIME,
  
  -- Status do funil
  status TEXT DEFAULT 'agendada' CHECK (status IN ('agendada', 'confirmada', 'realizada', 'nao_compareceu', 'convertida', 'nao_convertida', 'cancelada')),
  
  -- Follow-up
  notas TEXT,
  motivo_nao_conversao TEXT,
  data_conversao DATE,
  plano_convertido_id UUID REFERENCES planos(id),
  
  -- Métricas
  avaliacao_experiencia INTEGER CHECK (avaliacao_experiencia >= 1 AND avaliacao_experiencia <= 5),
  feedback TEXT,
  
  -- Responsável pelo atendimento
  atendido_por UUID REFERENCES funcionarios(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Configurações de Notificações Automáticas
CREATE TABLE IF NOT EXISTS config_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  dias_antecedencia INTEGER DEFAULT 0,
  hora_envio TIME DEFAULT '09:00',
  canais TEXT[] DEFAULT ARRAY['sistema'],
  template_titulo TEXT,
  template_mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir configurações padrão de notificações
INSERT INTO config_notificacoes (tipo, ativo, dias_antecedencia, template_titulo, template_mensagem) VALUES
  ('pagamento_vencendo', true, 3, 'Lembrete de Pagamento', 'Olá {nome}, seu pagamento vence em {dias} dias.'),
  ('pagamento_atrasado', true, 1, 'Pagamento em Atraso', 'Olá {nome}, seu pagamento está em atraso desde {data}.'),
  ('aniversario', true, 0, 'Feliz Aniversário! 🎂', 'Parabéns {nome}! A equipe deseja um feliz aniversário!'),
  ('avaliacao_agendada', true, 1, 'Avaliação Física Amanhã', 'Olá {nome}, lembre-se da sua avaliação física amanhã às {hora}.'),
  ('inatividade', true, 7, 'Sentimos sua falta!', 'Olá {nome}, não te vemos há {dias} dias. Volte logo!'),
  ('aula_experimental', true, 1, 'Aula Experimental Amanhã', 'Olá {nome}, confirmamos sua aula experimental amanhã às {hora}.')
ON CONFLICT (tipo) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_aluno ON avaliacoes_fisicas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes_fisicas(data_avaliacao DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_destinatario ON notificacoes(destinatario_id, status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo, status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_agendada ON notificacoes(data_agendada) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_experimentais_status ON aulas_experimentais(status);
CREATE INDEX IF NOT EXISTS idx_experimentais_data ON aulas_experimentais(data_agendada);

-- Habilitar RLS
ALTER TABLE avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas_experimentais ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para acesso autenticado
CREATE POLICY "Allow full access to authenticated users" ON avaliacoes_fisicas FOR ALL USING (true);
CREATE POLICY "Allow full access to authenticated users" ON notificacoes FOR ALL USING (true);
CREATE POLICY "Allow full access to authenticated users" ON aulas_experimentais FOR ALL USING (true);
CREATE POLICY "Allow full access to authenticated users" ON config_notificacoes FOR ALL USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_avaliacoes_fisicas_updated_at
  BEFORE UPDATE ON avaliacoes_fisicas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aulas_experimentais_updated_at
  BEFORE UPDATE ON aulas_experimentais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_config_notificacoes_updated_at
  BEFORE UPDATE ON config_notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular IMC automaticamente
CREATE OR REPLACE FUNCTION calcular_imc()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.peso IS NOT NULL AND NEW.altura IS NOT NULL AND NEW.altura > 0 THEN
    NEW.imc := ROUND((NEW.peso / (NEW.altura * NEW.altura))::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calcular_imc
  BEFORE INSERT OR UPDATE ON avaliacoes_fisicas
  FOR EACH ROW
  EXECUTE FUNCTION calcular_imc();