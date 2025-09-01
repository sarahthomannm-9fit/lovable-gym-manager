-- Criar tabela de produtos
CREATE TABLE public.produtos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('aplicativo_mobile', 'software', 'servicos', 'produtos')),
  descricao text,
  preco numeric,
  target_publico text,
  objetivos jsonb DEFAULT '[]'::jsonb,
  canais_preferidos jsonb DEFAULT '[]'::jsonb,
  orcamento_marketing numeric,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'analise'))
);

-- Habilitar RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Criar política para produtos
CREATE POLICY "Allow full access to authenticated users" 
ON public.produtos 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar trigger para updated_at
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Criar tabela de análises de produto
CREATE TABLE public.analises_produto (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id uuid REFERENCES public.produtos(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  analise_mercado jsonb DEFAULT '{}'::jsonb,
  estrategias_recomendadas jsonb DEFAULT '[]'::jsonb,
  campanhas_sugeridas jsonb DEFAULT '[]'::jsonb,
  metricas_projetadas jsonb DEFAULT '{}'::jsonb,
  score_viabilidade integer DEFAULT 0 CHECK (score_viabilidade >= 0 AND score_viabilidade <= 100)
);

-- Habilitar RLS para análises
ALTER TABLE public.analises_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to authenticated users" 
ON public.analises_produto 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar função para análise de faturamento avançada
CREATE OR REPLACE FUNCTION public.analise_faturamento_avancada()
RETURNS TABLE(
  periodo text,
  receita_atual numeric,
  receita_projetada numeric,
  taxa_crescimento numeric,
  variabilidade numeric,
  risco_inadimplencia text,
  estrategias_retencao jsonb,
  recomendacoes jsonb
)
LANGUAGE sql
AS $function$
  WITH dados_mensais AS (
    SELECT 
      TO_CHAR(date_trunc('month', pg.referencia_mes), 'Mon/YY') AS mes,
      date_trunc('month', pg.referencia_mes) AS mes_data,
      COALESCE(SUM(CASE WHEN pg.status = 'pago' THEN pg.valor ELSE 0 END), 0) AS receita,
      COUNT(DISTINCT pg.aluno_id) AS alunos_ativos,
      COUNT(CASE WHEN pg.status = 'pendente' AND pg.data_vencimento < CURRENT_DATE THEN 1 END) AS inadimplentes
    FROM public.pagamentos pg
    WHERE pg.referencia_mes >= date_trunc('month', CURRENT_DATE - INTERVAL '12 months')
    GROUP BY date_trunc('month', pg.referencia_mes)
    ORDER BY mes_data DESC
  ),
  analise_tendencia AS (
    SELECT 
      mes,
      receita,
      LAG(receita) OVER (ORDER BY mes_data) AS receita_anterior,
      CASE 
        WHEN LAG(receita) OVER (ORDER BY mes_data) > 0 THEN
          ((receita - LAG(receita) OVER (ORDER BY mes_data)) / LAG(receita) OVER (ORDER BY mes_data) * 100)
        ELSE 0 
      END AS crescimento_mensal,
      alunos_ativos,
      inadimplentes,
      CASE 
        WHEN inadimplentes::numeric / NULLIF(alunos_ativos, 0) > 0.15 THEN 'ALTO'
        WHEN inadimplentes::numeric / NULLIF(alunos_ativos, 0) > 0.08 THEN 'MÉDIO'
        ELSE 'BAIXO'
      END AS risco_nivel
    FROM dados_mensais
  )
  SELECT 
    at.mes AS periodo,
    at.receita AS receita_atual,
    CASE 
      WHEN at.crescimento_mensal > 0 THEN 
        at.receita * (1 + (at.crescimento_mensal / 100))
      ELSE at.receita * 1.05
    END AS receita_projetada,
    COALESCE(at.crescimento_mensal, 0) AS taxa_crescimento,
    ABS(at.crescimento_mensal) AS variabilidade,
    at.risco_nivel AS risco_inadimplencia,
    CASE 
      WHEN at.risco_nivel = 'ALTO' THEN 
        '[{"estrategia": "Programa de fidelidade", "prioridade": "alta"}, 
          {"estrategia": "Desconto para pagamento antecipado", "prioridade": "alta"},
          {"estrategia": "Comunicação personalizada", "prioridade": "média"}]'::jsonb
      WHEN at.risco_nivel = 'MÉDIO' THEN 
        '[{"estrategia": "Benefícios exclusivos", "prioridade": "média"}, 
          {"estrategia": "Programa de indicação", "prioridade": "média"}]'::jsonb
      ELSE 
        '[{"estrategia": "Upsell de planos", "prioridade": "baixa"}, 
          {"estrategia": "Cross-sell de serviços", "prioridade": "baixa"}]'::jsonb
    END AS estrategias_retencao,
    CASE 
      WHEN at.crescimento_mensal < -10 THEN 
        '[{"tipo": "urgente", "acao": "Revisar preços e ofertas"}, 
          {"tipo": "marketing", "acao": "Intensificar campanhas de captação"}]'::jsonb
      WHEN at.crescimento_mensal < 0 THEN 
        '[{"tipo": "atencao", "acao": "Analisar satisfação dos clientes"}, 
          {"tipo": "operacional", "acao": "Otimizar processos de cobrança"}]'::jsonb
      ELSE 
        '[{"tipo": "crescimento", "acao": "Expandir capacidade"}, 
          {"tipo": "investimento", "acao": "Aumentar orçamento de marketing"}]'::jsonb
    END AS recomendacoes
  FROM analise_tendencia at
  ORDER BY at.mes DESC
  LIMIT 6;
$function$;

-- Criar função para projeção de cenários
CREATE OR REPLACE FUNCTION public.projecao_cenarios()
RETURNS TABLE(
  cenario text,
  receita_projetada_3m numeric,
  receita_projetada_6m numeric,
  receita_projetada_12m numeric,
  investimento_necessario numeric,
  roi_estimado numeric
)
LANGUAGE sql
AS $function$
  WITH receita_atual AS (
    SELECT COALESCE(SUM(pg.valor), 0) AS base_mensal
    FROM public.pagamentos pg
    WHERE pg.status = 'pago' 
      AND date_trunc('month', pg.data_pagamento) = date_trunc('month', CURRENT_DATE)
  )
  SELECT 
    'Conservador' AS cenario,
    ra.base_mensal * 3 * 1.02 AS receita_projetada_3m,
    ra.base_mensal * 6 * 1.05 AS receita_projetada_6m,
    ra.base_mensal * 12 * 1.10 AS receita_projetada_12m,
    ra.base_mensal * 0.15 AS investimento_necessario,
    1.8 AS roi_estimado
  FROM receita_atual ra
  
  UNION ALL
  
  SELECT 
    'Moderado' AS cenario,
    ra.base_mensal * 3 * 1.08 AS receita_projetada_3m,
    ra.base_mensal * 6 * 1.15 AS receita_projetada_6m,
    ra.base_mensal * 12 * 1.25 AS receita_projetada_12m,
    ra.base_mensal * 0.25 AS investimento_necessario,
    2.5 AS roi_estimado
  FROM receita_atual ra
  
  UNION ALL
  
  SELECT 
    'Agressivo' AS cenario,
    ra.base_mensal * 3 * 1.20 AS receita_projetada_3m,
    ra.base_mensal * 6 * 1.35 AS receita_projetada_6m,
    ra.base_mensal * 12 * 1.50 AS receita_projetada_12m,
    ra.base_mensal * 0.40 AS investimento_necessario,
    3.2 AS roi_estimado
  FROM receita_atual ra;
$function$;