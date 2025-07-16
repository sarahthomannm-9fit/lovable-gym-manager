-- Inserir mais dados de exemplo para testar o sistema

-- Inserir mais planos se não existirem
INSERT INTO planos (nome, tipo, valor, duracao_dias, quantidade_aulas, preco) 
SELECT * FROM (VALUES
  ('Mensal Premium', 'mensal', 199.90, 30, 20, 199.90),
  ('Pacote 10 aulas', 'pacote', 129.90, NULL, 10, 129.90),
  ('Avulso', 'avulso', 19.90, NULL, 1, 19.90)
) AS v(nome, tipo, valor, duracao_dias, quantidade_aulas, preco)
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome = v.nome);

-- Inserir mais alunos se não existirem
INSERT INTO alunos (nome, email, tipo) 
SELECT * FROM (VALUES
  ('Maria Santos', 'maria@email.com', 'consultoria'),
  ('Pedro Oliveira', 'pedro@email.com', 'presencial'),
  ('Ana Costa', 'ana@email.com', 'presencial'),
  ('Carlos Lima', 'carlos@email.com', 'consultoria')
) AS v(nome, email, tipo)
WHERE NOT EXISTS (SELECT 1 FROM alunos WHERE email = v.email);

-- Inserir vínculos aluno-plano para testar relatórios
INSERT INTO alunos_planos (aluno_id, plano_id, forma_pagamento_id, data_inicio, data_fim, status)
SELECT 
  a.id,
  p.id,
  f.id,
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '15 days',
  'ativo'
FROM alunos a, planos p, formas_pagamento f
WHERE a.email = 'joao@email.com' 
  AND p.nome = 'Mensal Básico' 
  AND f.descricao = 'PIX'
  AND NOT EXISTS (
    SELECT 1 FROM alunos_planos ap 
    WHERE ap.aluno_id = a.id AND ap.plano_id = p.id
  );

-- Inserir treinos de exemplo
INSERT INTO treinos (aluno_id, descricao, data_inicio, data_fim)
SELECT 
  a.id,
  'Treino de Força - Membros Superiores',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
FROM alunos a
WHERE a.email = 'joao@email.com'
  AND NOT EXISTS (
    SELECT 1 FROM treinos t 
    WHERE t.aluno_id = a.id AND t.descricao = 'Treino de Força - Membros Superiores'
  );

-- Inserir aulas de exemplo
INSERT INTO aulas (aluno_id, plano_id, data, status)
SELECT 
  a.id,
  p.id,
  CURRENT_DATE + INTERVAL '1 day',
  'agendada'
FROM alunos a, planos p
WHERE a.email = 'joao@email.com' 
  AND p.nome = 'Mensal Básico'
  AND NOT EXISTS (
    SELECT 1 FROM aulas au
    WHERE au.aluno_id = a.id AND au.data = CURRENT_DATE + INTERVAL '1 day'
  );