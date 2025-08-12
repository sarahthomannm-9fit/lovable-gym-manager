
-- Recria a função para basear-se nos pagamentos reais
CREATE OR REPLACE FUNCTION public.relatorio_receitas_por_plano()
RETURNS TABLE (
  nome_plano text,
  forma_pagamento text,
  total_recebido numeric
)
LANGUAGE sql
AS $function$
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
$function$;
