
-- Novas colunas em alunos
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS dias_aula text[] DEFAULT '{}';
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS dia_pagamento integer;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS categoria_aluno text DEFAULT 'fixo';

-- Comissão em funcionários
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS comissao_percentual numeric;

-- Datas extras em avaliações físicas
ALTER TABLE public.avaliacoes_fisicas ADD COLUMN IF NOT EXISTS data_entrega date;
ALTER TABLE public.avaliacoes_fisicas ADD COLUMN IF NOT EXISTS data_programa date;
