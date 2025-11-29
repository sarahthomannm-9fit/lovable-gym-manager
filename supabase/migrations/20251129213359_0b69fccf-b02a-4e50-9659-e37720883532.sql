-- Fix dashboard_trust function
DROP FUNCTION IF EXISTS dashboard_trust();

CREATE OR REPLACE FUNCTION dashboard_trust()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_avaliacoes', COUNT(*)::integer,
    'avaliacoes_mes', COUNT(CASE WHEN ap.created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END)::integer,
    'score_medio', ROUND(AVG(ap.score_geral), 2),
    'areas_criticas_total', (
      SELECT COUNT(*)::integer 
      FROM avaliacoes_posturais, 
      jsonb_array_elements(areas_criticas) 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'avaliacoes_recentes', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', subq.id,
          'aluno_id', subq.aluno_id,
          'aluno_nome', subq.aluno_nome,
          'data_avaliacao', subq.data_avaliacao,
          'classificacao', subq.classificacao,
          'score_geral', subq.score_geral
        )
      )
      FROM (
        SELECT 
          ap2.id,
          ap2.aluno_id,
          a.nome as aluno_nome,
          ap2.data_avaliacao,
          ap2.classificacao,
          ap2.score_geral
        FROM avaliacoes_posturais ap2
        LEFT JOIN alunos a ON a.id = ap2.aluno_id
        ORDER BY ap2.data_avaliacao DESC
        LIMIT 10
      ) subq
    ), '[]'::jsonb),
    'tendencias', jsonb_build_object(
      'melhorando', (SELECT COUNT(*)::integer FROM avaliacoes_posturais WHERE classificacao IN ('otimo', 'bom') AND created_at >= CURRENT_DATE - INTERVAL '30 days'),
      'atencao', (SELECT COUNT(*)::integer FROM avaliacoes_posturais WHERE classificacao = 'atencao' AND created_at >= CURRENT_DATE - INTERVAL '30 days'),
      'critico', (SELECT COUNT(*)::integer FROM avaliacoes_posturais WHERE classificacao = 'critico' AND created_at >= CURRENT_DATE - INTERVAL '30 days')
    )
  ) INTO result
  FROM avaliacoes_posturais ap;
  
  RETURN result;
END;
$$;