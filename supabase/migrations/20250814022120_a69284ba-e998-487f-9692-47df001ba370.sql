
-- Função para faturamento mensal detalhado
CREATE OR REPLACE FUNCTION public.relatorio_faturamento_mensal()
RETURNS TABLE (
  mes date,
  total_faturado numeric,
  total_recebido numeric,
  total_pendente numeric,
  quantidade_pagamentos bigint
)
LANGUAGE sql
AS $function$
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
$function$;

-- Função para análise de inadimplência
CREATE OR REPLACE FUNCTION public.relatorio_inadimplencia()
RETURNS TABLE (
  aluno_nome text,
  aluno_id uuid,
  valor_em_atraso numeric,
  dias_atraso integer,
  plano_nome text,
  metodo_pagamento text,
  telefone text
)
LANGUAGE sql
AS $function$
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
$function$;

-- Função para métricas de ticket médio e retenção
CREATE OR REPLACE FUNCTION public.relatorio_metricas_gerais()
RETURNS TABLE (
  ticket_medio numeric,
  total_alunos_ativos bigint,
  total_receita_mes_atual numeric,
  total_receita_mes_anterior numeric,
  crescimento_percentual numeric,
  formas_pagamento_distintas bigint
)
LANGUAGE sql
AS $function$
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
$function$;

-- Função para evolução mensal simplificada (últimos 6 meses)
CREATE OR REPLACE FUNCTION public.relatorio_evolucao_receitas()
RETURNS TABLE (
  mes text,
  receita numeric,
  quantidade_pagamentos bigint,
  ticket_medio numeric
)
LANGUAGE sql
AS $function$
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
$function$;
