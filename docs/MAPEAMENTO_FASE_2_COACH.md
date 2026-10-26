# Fase 2 — Coach

Atualizado em 26/10/2026 após implementação. Escopo: telas → ações → dados/permissões → lacunas → critérios de conclusão. A QA visual das quatro contas será realizada pelo usuário.

| Tela / rota | Ações implementadas | Dados e permissão |
|---|---|---|
| Convite `/convite-coach/:token` ou `/convite/:token` | Entrar/criar conta, confirmar e-mail e ativar vínculo de coach. | Convite válido, e-mail confirmado; cria/associa funcionário ativo e papel da organização. |
| Meu dia `/coach` | Consultar agenda e abrir chamada; cancelar aula autorizada. | Aulas do funcionário vinculado à conta no condomínio ativo. |
| Alunos, aba do painel | Buscar e filtrar ativos, treino pendente e revisão vencida; abrir criação/revisão. | Carteira de treinos e aulas, incluindo moradores que concluíram triagem na organização. |
| Anamnese, aba/diálogo | Ler respostas disponíveis e encaminhar criação de treino. | Leitura de saúde restrita à equipe autorizada. |
| Segurança `/coach/revisoes` | Ler triagem completa, informar justificativa e aprovar ou devolver revisão. | Fila pendente do condomínio; decisão registrada em auditoria; aprovação não publica treino. |
| Editor, diálogo | Selecionar aluno, consultar segurança e equipamento aprovado, adicionar exercícios/dias/séries/repetições/carga/descanso, revisar e publicar. | Biblioteca compatível com restrições; publicação transacional e identificador de repetição. |
| Revisão, diálogo | Carregar exercícios anteriores, editar plano e justificar revisão. | Publica nova versão e marca a anterior como revisada na mesma transação. |
| Treinos `/treinos` e planos `/planos-treino` | Consultar treinos/planos do contexto, usar editor completo e revisar fila IA. | Coach autorizado no condomínio; módulos de gestão financeira não são liberados para coach. |
| Chamada, diálogo do painel | Marcar presença na aula. | Inscrição, instrutor, organização e janela de horário validados; presença não é confundida com check-in de outro dia/aula. |
| Histórico, aba do painel | Consultar 30/90/365 dias, frequência, sessões e feedbacks. | Dados dos alunos autorizados no contexto. |

Lacunas operacionais: é necessário vincular a conta a um funcionário ativo e cadastrar a agenda real. O editor depende da triagem e do inventário aprovado; não gera uma prescrição fictícia para preencher a tela.

Critério de conclusão da QA: convite ativa coach → morador aparece após triagem → caso de risco exige decisão justificada → publicação chega ao morador → revisão substitui versão → chamada registra presença correta → feedback aparece no acompanhamento.

