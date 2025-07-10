
-- Limpar tabelas existentes se necessário
DROP TABLE IF EXISTS public.checkins CASCADE;
DROP TABLE IF EXISTS public.aulas CASCADE;
DROP TABLE IF EXISTS public.pagamentos CASCADE;
DROP TABLE IF EXISTS public.alunos CASCADE;
DROP TABLE IF EXISTS public.planos CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;

-- Criar tabela de usuários (professores, administradores)
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('admin', 'professor')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de planos
CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(50) NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  duracao_meses INTEGER NOT NULL,
  beneficios TEXT[],
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de alunos
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  data_nascimento DATE,
  endereco TEXT,
  plano_id UUID REFERENCES public.planos(id),
  data_matricula DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) CHECK (status IN ('ativo', 'inativo', 'suspenso')) DEFAULT 'ativo',
  valor_mensalidade DECIMAL(10,2),
  forma_pagamento VARCHAR(20) CHECK (forma_pagamento IN ('pix', 'cartao', 'dinheiro', 'transferencia')),
  contato_emergencia TEXT,
  observacoes_medicas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de aulas
CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  professor_id UUID REFERENCES public.usuarios(id),
  data_aula DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  capacidade_maxima INTEGER DEFAULT 20,
  tipo VARCHAR(50),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de pagamentos
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')) DEFAULT 'pendente',
  metodo_pagamento VARCHAR(20) CHECK (metodo_pagamento IN ('pix', 'cartao', 'dinheiro', 'transferencia')),
  referencia_mes DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de check-ins
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  data_checkin DATE DEFAULT CURRENT_DATE,
  horario_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  horario_saida TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir acesso total para usuários autenticados por enquanto)
CREATE POLICY "Acesso total para autenticados" ON public.usuarios FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso total para autenticados" ON public.planos FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso total para autenticados" ON public.alunos FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso total para autenticados" ON public.aulas FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso total para autenticados" ON public.pagamentos FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso total para autenticados" ON public.checkins FOR ALL TO authenticated USING (true);

-- Inserir planos padrão
INSERT INTO public.planos (nome, preco, duracao_meses, beneficios) VALUES
('Mensal', 100.00, 1, ARRAY['Acesso total à academia', 'Aulas coletivas']),
('Trimestral', 270.00, 3, ARRAY['Acesso total à academia', 'Aulas coletivas', 'Avaliação física']),
('Semestral', 500.00, 6, ARRAY['Acesso total à academia', 'Aulas coletivas', 'Avaliação física', 'Personal trainer']),
('Anual', 960.00, 12, ARRAY['Acesso total à academia', 'Aulas coletivas', 'Avaliação física', 'Personal trainer', 'Desconto especial']);

-- Inserir usuário admin padrão
INSERT INTO public.usuarios (nome, email, senha_hash, tipo) VALUES
('Administrador', 'admin@academia.com', 'hash_placeholder', 'admin');

-- Habilitar realtime para todas as tabelas
ALTER TABLE public.alunos REPLICA IDENTITY FULL;
ALTER TABLE public.pagamentos REPLICA IDENTITY FULL;
ALTER TABLE public.checkins REPLICA IDENTITY FULL;
ALTER TABLE public.aulas REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.alunos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pagamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.aulas;
