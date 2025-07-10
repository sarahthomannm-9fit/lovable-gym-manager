
-- Atualizar tabela de alunos para incluir controle de aulas
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS aulas_disponiveis INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS aulas_por_mes INTEGER;

-- Criar tabela de histórico de planos
CREATE TABLE IF NOT EXISTS public.historico_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES public.planos(id),
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.historico_planos ENABLE ROW LEVEL SECURITY;

-- Política para histórico de planos
CREATE POLICY "Acesso total para autenticados" ON public.historico_planos FOR ALL TO authenticated USING (true);

-- Atualizar tabela de aulas para incluir dia da semana e plano
ALTER TABLE public.aulas 
ADD COLUMN IF NOT EXISTS dia_semana VARCHAR(20),
ADD COLUMN IF NOT EXISTS plano_id UUID REFERENCES public.planos(id);

-- Habilitar realtime para todas as tabelas principais
ALTER TABLE public.alunos REPLICA IDENTITY FULL;
ALTER TABLE public.pagamentos REPLICA IDENTITY FULL; 
ALTER TABLE public.checkins REPLICA IDENTITY FULL;
ALTER TABLE public.aulas REPLICA IDENTITY FULL;
ALTER TABLE public.historico_planos REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.historico_planos;
