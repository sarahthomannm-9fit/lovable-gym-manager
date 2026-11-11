# Validação da portaria eletrônica do fitness

A entrada do condomínio segue para o onboarding autenticado. O envio registra o consentimento e a anamnese na mesma transação. A função triagem-decidir processa o PAR-Q e grava uma decisão por anamnese. Links avulsos de anamnese alimentam a mesma fila.

A aba Fila do coach apresenta sugestões e encaminhamentos. Um PAR-Q positivo, informações de saúde que precisam de avaliação e casos sem protocolo compatível seguem para Revisões de segurança. O coach registra a decisão e a justificativa. Após liberação profissional, a prescrição manual usa o editor existente.

Protocolos com exercícios cadastrados podem ser conferidos e publicados em um clique na tela de detalhes. Os três modelos iniciais descritos na arquitetura têm frequência e foco, por isso o coach os completa no editor. Casos intermediários e avançados sem protocolo compatível seguem para avaliação profissional. O aplicativo usa os protocolos ativos do condomínio e os globais, sem enviar respostas de saúde ao gateway de IA.

## Homologação

1. Aplicar a migration de portaria no Supabase de homologação e publicar as funções anamnese-public e triagem-decidir. Publicar o frontend apontando para o mesmo ambiente.
2. Entrar pelo QR com um morador de teste. Aceitar o consentimento, responder Não às sete perguntas e selecionar Força com nível iniciante. Conferir a sugestão na fila do coach e a indisponibilidade do treino no aplicativo do morador.
3. Completar o protocolo no editor, aprovar e confirmar que o morador recebe o treino. Repetir o mesmo envio e conferir uma única linha de fila e uma única publicação.
4. Repetir com um Sim, com informação adicional de saúde e com um nível sem protocolo compatível. Conferir encaminhamento, bloqueio de publicação antes da avaliação e auditoria da decisão humana.
5. Para verificar a publicação em um clique, cadastrar um protocolo de teste completo com pelo menos três exercícios da biblioteca. A estrutura usa exercicios com exercicio_id, dia_semana, series, repeticoes e descanso_seg. Verificar que equipamento incompatível impede a publicação e mantém a sugestão pendente.
6. Conferir com outro condomínio que a equipe não vê nem consegue decidir sobre a fila de fora. Validar também a consulta do treino e o registro da sessão com o morador.

## Parâmetros opcionais do protocolo

A estrutura do protocolo pode definir ajustes por exercício e dia. A chave de primeiro nível é o UUID do exercício e a de segundo nível é o dia da semana de 1 a 7. Por exemplo, em estrutura.ajustes, o dia 1 de um exercício pode declarar series igual a 2 e descanso_seg igual a 75. Cadastre esses valores após revisão do responsável pelo protocolo.

A triagem preserva esses ajustes na sugestão. A prévia e o editor aplicam os valores válidos. Confira carga, orientações, início e duração na prévia. A publicação deve persistir os mesmos parâmetros apresentados e continuar rejeitando exercício incompatível com restrições ou inventário.
