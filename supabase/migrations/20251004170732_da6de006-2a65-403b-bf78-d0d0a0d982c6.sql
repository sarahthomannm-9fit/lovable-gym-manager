-- Corrigir search_path em todas as funções de relatório

CREATE OR REPLACE FUNCTION public.relatorio_faturamento_mensal()
RETURNS TABLE(mes date, total_faturado numeric, total_recebido numeric, total_pendente numeric, quantidade_pagamentos bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    date_trunc('month', pg.referencia_mes)::date AS mes,
    COALESCE(SUM(pg.valor), 0) AS total_faturado,
    COALESCE(SUM(CASE WHEN pg.status = 'pago' THEN pg.valor ELSE 0 END), 0) AS total_recebido,
    COALESCE(SUM(CASE WHEN pg.status = 'pendente' THEN pg.valor ELSE 0 END), 0) AS total_pendente,
    COUNT(*) AS quantidade_pagamentos
  FROM public.pagamentos pg
  WHERE pg.referencia_mes >= date_trunc('month', CURRENT_DATE - INTERVAL '6 months')
  GROUP BY date_trunc('month', pg.referencia_mes)
  ORDER BY mes DESC;
$$;

CREATE OR REPLACE FUNCTION public.relatorio_inadimplencia()
RETURNS TABLE(aluno_nome text, aluno_id uuid, valor_em_atraso numeric, dias_atraso integer, plano_nome text, metodo_pagamento text, telefone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.nome AS aluno_nome,
    a.id AS aluno_id,
    pg.valor AS valor_em_atraso,
    (CURRENT_DATE - pg.data_vencimento)::integer AS dias_atraso,
    COALESCE(p.nome, 'Sem plano') AS plano_nome,
    COALESCE(pg.metodo_pagamento, a.forma_pagamento, 'indefinido') AS metodo_pagamento,
    a.telefone
  FROM public.pagamentos pg
  LEFT JOIN public.alunos a ON pg.aluno_id = a.id
  LEFT JOIN public.planos p ON a.plano_id = p.id
  WHERE pg.status = 'pendente' 
    AND pg.data_vencimento < CURRENT_DATE
  ORDER BY dias_atraso DESC, pg.valor DESC;
$$;

CREATE OR REPLACE FUNCTION public.relatorio_metricas_gerais()
RETURNS TABLE(ticket_medio numeric, total_alunos_ativos bigint, total_receita_mes_atual numeric, total_receita_mes_anterior numeric, crescimento_percentual numeric, formas_pagamento_distintas bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH mes_atual AS (
    SELECT COALESCE(SUM(pg.valor), 0) AS receita_atual
    FROM public.pagamentos pg
    WHERE pg.status = 'pago' 
      AND date_trunc('month', pg.data_pagamento) = date_trunc('month', CURRENT_DATE)
  ),
  mes_anterior AS (
    SELECT COALESCE(SUM(pg.valor), 0) AS receita_anterior
    FROM public.pagamentos pg
    WHERE pg.status = 'pago' 
      AND date_trunc('month', pg.data_pagamento) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
  ),
  ticket_medio_calc AS (
    SELECT 
      CASE 
        WHEN COUNT(*) > 0 THEN COALESCE(SUM(pg.valor) / COUNT(*), 0)
        ELSE 0 
      END AS ticket_medio
    FROM public.pagamentos pg
    WHERE pg.status = 'pago' 
      AND pg.data_pagamento >= CURRENT_DATE - INTERVAL '30 days'
  ),
  alunos_ativos AS (
    SELECT COUNT(DISTINCT a.id) AS total_ativos
    FROM public.alunos a
    WHERE a.status = 'ativo'
  ),
  formas_pagamento AS (
    SELECT COUNT(DISTINCT COALESCE(pg.metodo_pagamento, a.forma_pagamento)) AS formas_distintas
    FROM public.pagamentos pg
    LEFT JOIN public.alunos a ON pg.aluno_id = a.id
    WHERE pg.status = 'pago'
  )
  SELECT 
    tm.ticket_medio,
    aa.total_ativos AS total_alunos_ativos,
    ma.receita_atual AS total_receita_mes_atual,
    mat.receita_anterior AS total_receita_mes_anterior,
    CASE 
      WHEN mat.receita_anterior > 0 THEN 
        ((ma.receita_atual - mat.receita_anterior) / mat.receita_anterior * 100)
      ELSE 0 
    END AS crescimento_percentual,
    fp.formas_distintas AS formas_pagamento_distintas
  FROM mes_atual ma, mes_anterior mat, ticket_medio_calc tm, alunos_ativos aa, formas_pagamento fp;
$$;

CREATE OR REPLACE FUNCTION public.relatorio_evolucao_receitas()
RETURNS TABLE(mes text, receita numeric, quantidade_pagamentos bigint, ticket_medio numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    TO_CHAR(date_trunc('month', pg.referencia_mes), 'Mon/YY') AS mes,
    COALESCE(SUM(CASE WHEN pg.status = 'pago' THEN pg.valor ELSE 0 END), 0) AS receita,
    COUNT(CASE WHEN pg.status = 'pago' THEN 1 END) AS quantidade_pagamentos,
    CASE 
      WHEN COUNT(CASE WHEN pg.status = 'pago' THEN 1 END) > 0 THEN
        COALESCE(SUM(CASE WHEN pg.status = 'pago' THEN pg.valor ELSE 0 END) / COUNT(CASE WHEN pg.status = 'pago' THEN 1 END), 0)
      ELSE 0 
    END AS ticket_medio
  FROM public.pagamentos pg
  WHERE pg.referencia_mes >= date_trunc('month', CURRENT_DATE - INTERVAL '6 months')
  GROUP BY date_trunc('month', pg.referencia_mes)
  ORDER BY date_trunc('month', pg.referencia_mes) ASC;
$$;

CREATE OR REPLACE FUNCTION public.analise_faturamento_avancada()
RETURNS TABLE(periodo text, receita_atual numeric, receita_projetada numeric, taxa_crescimento numeric, variabilidade numeric, risco_inadimplencia text, estrategias_retencao jsonb, recomendacoes jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.projecao_cenarios()
RETURNS TABLE(cenario text, receita_projetada_3m numeric, receita_projetada_6m numeric, receita_projetada_12m numeric, investimento_necessario numeric, roi_estimado numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.relatorio_receitas_por_plano()
RETURNS TABLE(nome_plano text, forma_pagamento text, total_recebido numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(p.nome, 'Sem plano') AS nome_plano,
    COALESCE(pg.metodo_pagamento, a.forma_pagamento, 'indefinido') AS forma_pagamento,
    COALESCE(SUM(pg.valor), 0) AS total_recebido
  FROM public.pagamentos pg
  LEFT JOIN public.alunos a ON pg.aluno_id = a.id
  LEFT JOIN public.planos p ON a.plano_id = p.id
  WHERE pg.status = 'pago'
  GROUP BY 
    COALESCE(p.nome, 'Sem plano'),
    COALESCE(pg.metodo_pagamento, a.forma_pagamento, 'indefinido');
$$;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_referencia_mes ON public.pagamentos(referencia_mes);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_pagamento ON public.pagamentos(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_aluno_id ON public.pagamentos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.alunos(status);
CREATE INDEX IF NOT EXISTS idx_alunos_plano_id ON public.alunos(plano_id);
CREATE INDEX IF NOT EXISTS idx_checkins_aluno_id ON public.checkins(aluno_id);
CREATE INDEX IF NOT EXISTS idx_checkins_data ON public.checkins(data_checkin);
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON public.campanhas_marketing(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);