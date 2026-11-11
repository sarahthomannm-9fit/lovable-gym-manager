# Coach — diagnóstico, direção de produto e plano específico

Data: 10/11/2026. O diagnóstico abaixo registra a base anterior às correções. A implementação dos quatro pacotes está registrada em [Entrega técnica do coach](../ENTREGA_COACH_2026-11-10.md), incluindo testes, migrations e limites. A QA funcional permanece com o responsável; o frontend ainda está local e a operação real exige condomínio ativo.

Complemento de experiência: [Design da operação do coach](03_COACH_DESIGN.md), com decisões específicas de montagem/publicação, acompanhamento e agenda, mantendo o escopo funcional deste plano.

## 1. Resultado esperado

O professor transforma a entrada do morador em atendimento: identifica quem aguarda avaliação, consulta as respostas corretas, decide dentro de sua atribuição profissional, monta e confere a prescrição, publica e acompanha a prática. O sistema organiza o trabalho e preserva as decisões; a sugestão automática não substitui a confirmação do profissional.

O ciclo operacional é: entrada → triagem → avaliação quando necessária → montagem → conferência → publicação → primeira sessão → retorno → revisão. Uma fila vazia precisa significar ausência real de pendências. Um treino publicado precisa corresponder ao que o professor conferiu e ao que o morador consegue consultar.

## 2. Diagnóstico macro

O trabalho se distribui entre a Central do professor, a fila de sugestões, a página de segurança, o editor compartilhado, Treinos e Planos de treino. Há uma faixa de navegação do layout e abas adicionais na central. A carteira combina alunos de aulas, treinos atribuídos e triagens, enquanto algumas telas usam o roster autorizado completo. Essa diferença precisa ser uma regra explícita.

A base funcional existe. O problema principal é a continuidade: passar de uma pendência ao morador, revisar sua situação, publicar e voltar ao acompanhamento sem perder contexto. Também há diferenças entre critérios do frontend e a autorização final do servidor.

## 3. O que existe e o que precisa mudar

| Frente | Base encontrada | Lacuna concreta |
| --- | --- | --- |
| Central | Fila inicial, alunos, aulas, treinos, histórico e suporte | Carregamento extenso; erro pode conviver com contagem antiga; abas não persistem na URL |
| Carteira | Roster autorizado, filtro por alunos com aula/treino/triagem | A composição da central difere da carteira usada em outras telas; recém-vinculado pode não aparecer ali |
| Sugestão | Protocolo existente por objetivo/nível, prévia e editor com parâmetros | Falhas de consulta da fila, protocolo e nomes não têm estados completos de recuperação |
| Segurança | Justificativa obrigatória e decisão por RPC auditada; snapshot de captura | “Anamnese completa” usa também campos antigos e exibe informação parcial/duplicada; ausência pode parecer resposta negativa |
| Editor | Adicionar, ordenar, duplicar, remover e substituir exercícios | Biblioteca se recarrega ao mudar contexto de segurança/equipamento; precisa descartar respostas antigas e explicar filtros |
| Variáveis | Dia, séries, repetições, carga, descanso, observações, início e duração | Programação semanal repetida; ausência de carga aparece como zero na conferência |
| Infraestrutura | Inventário aprovado e compatibilidade por nome de equipamento | Correspondência textual é aproximada; substituição indisponível ainda pode aparecer como alternativa clicável |
| Publicação | Conferência e RPCs de publicação/revisão, com identificador de reenvio | Efeitos posteriores como notificação e aprovação legada ocorrem em chamadas separadas e sem checagem completa na central |
| Revisão | Nova versão, motivo e preservação do treino anterior no servidor | Carregamento do editor importa somente a primeira semana; pode eliminar variações das semanas seguintes |
| Protocolo reutilizável | Salvar primeira semana sem cargas e notas pessoais | Não é equivalente a preservar um ciclo periodizado; depende de migration ainda não implantada no último registro |
| Acompanhamento | Sem primeira sessão, sem conclusão há 14 dias e conclusão recente | Lista não oferece ação direta de abrir o morador/plano; função depende de implantação pendente no último registro |
| Aulas | Agenda do professor, inscritos, presença e cancelamento | Horários usam fuso do dispositivo em parte do código; diálogo pode mostrar inscritos anteriores durante nova consulta |
| Feedback | Últimos registros e chamados | Falta organizar resposta/encaminhamento e mostrar o que já foi atendido |

## 4. Fluxo específico de prescrição

| Etapa | Informação necessária | Ação e saída |
| --- | --- | --- |
| Escolher morador | Nome, condomínio, vínculo, situação de segurança e plano atual | Abrir o atendimento correto; não iniciar com destinatário ambíguo |
| Avaliar | Última captura, respostas PAR-Q, contexto e decisões anteriores | Registrar avaliação/encaminhamento com justificativa; sem liberação automática por sugestão |
| Escolher origem | Montagem manual, sugestão, protocolo ou revisão | Explicar o que será copiado e quais parâmetros são individuais |
| Escolher exercícios | Biblioteca ativa, grupo muscular, equipamento e compatibilidade | Seleção com motivo de indisponibilidade; alternativas efetivamente selecionáveis |
| Parametrizar | Dias, séries, repetições, carga, descanso e orientação | Prescrição completa, com distinção entre não informado e zero |
| Programar | Início, validade, frequência e comportamento por semana | Deixar explícito se a semana se repete; não anunciar periodização que o editor não representa |
| Conferir | Morador, segurança, inventário, calendário e cada exercício | Congelar o payload conferido; alterações posteriores exigem nova conferência |
| Publicar | Permissão e estado atual conferidos no servidor | Uma publicação, mesmo após resposta perdida; feedback de sucesso somente após confirmação |
| Acompanhar | Primeira sessão, última conclusão, feedback, vigência | Abrir contato, revisar ou registrar encaminhamento no contexto daquele morador |

## 5. Direção de arte aplicada à operação

Proposta de navegação: Atendimentos, Moradores, Agenda e Biblioteca. Atendimentos reúne avaliações, prescrições e retornos com filtros por situação. Revisões de segurança são uma visão identificável dessa operação. Treinos e protocolos ficam relacionados ao morador e à biblioteca, sem exigir navegar por módulos sobrepostos.

Cada pendência deve apresentar nome completo, condomínio, motivo, data de entrada e uma ação principal. Separar visualmente avaliação de segurança, conferência da prescrição e acompanhamento de uso. A cor acompanha um rótulo; não usar a mesma palavra “revisão” para todas as decisões.

No atendimento, o cabeçalho mantém o morador e o plano selecionados. A prescrição usa espaço principal; resumo de segurança e infraestrutura fica acessível por expansão, sem expor saúde em listas desnecessariamente. No celular, abrir uma etapa por vez, com controles de toque e nomes legíveis. Evitar detalhes de anamnese em JSON bruto.

No editor, organizar exercícios por dia. A conferência deve parecer a prescrição que o morador recebe. Carga não informada, carga zero, descanso zero e parâmetro inválido são situações diferentes. A indicação de rascunho salvo precisa refletir o resultado da gravação no dispositivo, não uma mensagem fixa.

## 6. Checklist de implementação

P0: confiança na avaliação/publicação. P1: continuidade da operação. P2: acabamento e eficiência. Esta é a lista que orientou a implementação; consultar o registro de entrega para resultados e condições de aceite.

| ID | Prioridade | Implementação específica | Critério de conclusão |
| --- | --- | --- | --- |
| COA-01 | P0 | Unificar estados de carregamento, erro, vazio e atualização por bloco | Falha de fila ou biblioteca não aparece como ausência de pendência; contagens não ficam antigas após erro |
| COA-02 | P0 | Conferir carteira e autorização em todas as entradas | Regra explícita para recém-vinculados, triados, alunos de aula e atribuições; nenhuma tela amplia o escopo do servidor |
| COA-03 | P0 | Proteger contexto e respostas assíncronas | Troca de pessoa/condomínio fecha ou reinicializa diálogos; consultas tardias não substituem dados atuais |
| COA-04 | P0 | Apresentar a captura de segurança completa e sem ambiguidade | PAR-Q, medicamentos, dor, restrições, lesões, histórico, cirurgias, objetivo e observações vêm da mesma captura; não informado é distinto de Não |
| COA-05 | P0 | Distinguir avaliação, encaminhamento e publicação | Decisão profissional auditada; UI não chama de “automática” a avaliação; ausência de protocolo não significa necessariamente risco de saúde |
| COA-06 | P0 | Usar situação de segurança autoritativa no editor | “Risco baixo” isolado não equivale a liberação enquanto captura/fila atual exigir avaliação; frontend e servidor apresentam a mesma razão de bloqueio |
| COA-07 | P0 | Robustecer biblioteca e compatibilidade | Erro de inventário separado de inventário vazio; atualização não deixa seleção antiga autorizada; alternativa indisponível não se apresenta como ação funcional |
| COA-08 | P0 | Garantir prescrição completa e conferência fiel | Carga ausente não vira zero; nomes, orientação e variáveis aparecem integralmente; payload enviado corresponde à conferência |
| COA-09 | P0 | Preservar revisão de planos com várias semanas | Identificar semanas distintas e preservar sua programação; se a capacidade do editor for limitada, bloquear conversão silenciosa e explicar o limite |
| COA-10 | P0 | Consolidar publicação e seus efeitos operacionais | Evitar “publicado” seguido de falha silenciosa na aprovação legada/notificação; reenvio não duplica plano, execução ou aviso |
| COA-11 | P0 | Implantar dependências do acompanhamento e protocolo | Verificar migrations, contratos de RPC e permissões; frontend e banco disponíveis na mesma versão de entrega |
| COA-12 | P1 | Organizar atendimentos por situação e tempo de espera | Filtros claros para avaliação, prescrição, sem primeira sessão, retorno e revisão por vigência; não inventar SLA |
| COA-13 | P1 | Criar visão de atendimento do morador com ações diretas | Da fila/acompanhamento ao cadastro autorizado, plano, sessões, feedback e chamado sem nova busca |
| COA-14 | P1 | Corrigir classificação de treino e nomes dos indicadores | Ativo exige status ativo, início vigente, validade e publicação; “Última aula” não usa check-in de academia; revisão próxima é distinta de vencida |
| COA-15 | P1 | Tornar rascunho recuperável e seguro | Validar conteúdo recuperado, identidade, aluno e origem; indicar falha de armazenamento e permitir descartar; não tratar origem copiada como nova sem avisar |
| COA-16 | P1 | Tornar feedback acionável | Mostrar data, plano, sessão e situação do atendimento; abrir chamado ou revisão e registrar o resultado dentro das permissões |
| COA-17 | P1 | Fechar agenda e presença | Horário do condomínio, inscritos corretos, erro recuperável e gravações protegidas de clique repetido; presença de aula distinta de check-in e sessão |
| COA-18 | P1 | Unificar navegação e URLs | Destinos e filtros essenciais retomáveis; reduzir faixa de módulos somada às abas; retorno previsível após publicação |
| COA-19 | P1 | Explicar biblioteca, plano individual e protocolo reutilizável | Reuso não copia saúde, carga pessoal ou observação individual; informar primeira semana e escopo do condomínio |
| COA-20 | P2 | Completar acessibilidade e eficiência | Foco após etapas/erros, teclado, nome de botões, alvos de toque, textos longos e carregamentos independentes; medir uso real antes de afirmar desempenho |

## 7. Quatro pacotes específicos do coach

| Ordem | Pacote | Itens | Resultado verificável |
| --- | --- | --- | --- |
| 1 | Atendimento e segurança | COA-01 a 06, 12 e 13 | Professor encontra a pendência e avalia a captura correta com justificativa e escopo preservados |
| 2 | Editor e publicação | COA-07 a 10 e 15 | Prescrição legível, parâmetros conferidos, revisão sem perda de programação e publicação sem duplicação |
| 3 | Acompanhamento e agenda | COA-11, 14, 16 e 17 | Primeira sessão/retorno e feedback geram ações; agenda e presença têm estados reais |
| 4 | Biblioteca e acabamento | COA-18 a 20 e regressão | Uma navegação operacional, reuso seguro e experiência consistente em celular e desktop |

A direção visual começa no primeiro pacote. Não adiar correções essenciais de leitura e controle até o acabamento final.

## 8. Evento, pós-evento e rotina

| Momento | Impacto no professor | Resposta do produto |
| --- | --- | --- |
| Antes do Health Day | Preparar protocolos, inventário e capacidade de atendimento | Conferência de dependências e lista real do que pode ser prescrito |
| Durante o evento | Receber um grupo de novas triagens, incluindo encaminhamentos | Fila com horário, situação e decisão individual; confirmação profissional permanece obrigatória |
| Primeiros dias após o evento | Concluir avaliações e publicar planos | Priorizar pendências e verificar quem ainda não iniciou a prática |
| Semanas seguintes | Identificar dificuldade, falta de retorno e plano perto do fim | Sessões concluídas, feedback e vigência com ação por morador |
| Rotina contínua | Aulas, presença, ajustes, novas entradas e chamados | Agenda, atendimento e histórico conectados, com responsável e decisão rastreáveis |

O prédio de 80 apartamentos não equivale a 80 alunos. A preparação deve considerar os 40–50 participantes previstos e a capacidade real dos profissionais. Não há teste de carga nem tempo de atendimento medido nesta análise.

## 9. Checklist de QA do responsável

Registrar ambiente, versão, perfil, data e resultado esperado/observado, sem incluir dados de saúde identificáveis em evidências compartilhadas.

- [ ] COA-Q01 — Professor ativo acessa somente os condomínios autorizados; profissional desativado perde a operação protegida.
- [ ] COA-Q02 — Morador recém-vinculado, morador com triagem, aluno de aula e aluno com plano aparecem conforme a regra de carteira documentada.
- [ ] COA-Q03 — Falha de fila, protocolo, biblioteca ou inventário gera erro com recuperação, nunca confirmação de lista vazia.
- [ ] COA-Q04 — Trocar condomínio/pessoa durante consulta lenta ou com editor aberto não mistura dados nem destinatário de publicação.
- [ ] COA-Q05 — Ler todas as respostas da última captura, incluindo Sim/Não/não informado, sem misturar projeção antiga e captura nova.
- [ ] COA-Q06 — Avaliação exige justificativa, respeita consentimento e captura atual e registra auditoria; aprovação de avaliação não publica treino sozinha.
- [ ] COA-Q07 — Sem protocolo compatível, abrir montagem manual ou encaminhamento adequado sem afirmar diagnóstico de risco inexistente.
- [ ] COA-Q08 — Buscar exercícios, filtrar, incluir, ordenar, duplicar, remover e substituir respeitando o inventário e as restrições do caso.
- [ ] COA-Q09 — Parametrizar dias, séries, repetições, carga, descanso, observações, início e duração; conferir campos vazios, zero e valores inválidos.
- [ ] COA-Q10 — Publicar uma sugestão após conferir o payload; o morador recebe exatamente a prescrição autorizada.
- [ ] COA-Q11 — Perder a resposta da publicação e reenviar sem duplicar plano ou notificação; erro preserva o rascunho.
- [ ] COA-Q12 — Revisar treino com motivo e versões históricas; plano com semanas diferentes não perde a programação silenciosamente.
- [ ] COA-Q13 — Salvar protocolo sem dados pessoais e reutilizá-lo em outro morador autorizado, com parâmetros individuais revistos.
- [ ] COA-Q14 — Acompanhamento distingue sem primeira sessão, retorno e conclusão recente, abrindo a ação do morador correto.
- [ ] COA-Q15 — Feedback de uma sessão concluída chega ao acompanhamento e pode ser encaminhado/atendido sem alterar o registro do morador.
- [ ] COA-Q16 — Iniciar aula, consultar inscritos, registrar presença e cancelar dentro da regra; clique repetido não duplica presença.
- [ ] COA-Q17 — Conferir agenda, vigência e histórico no fuso do condomínio, na virada de dia e de mês.
- [ ] COA-Q18 — Usar editor, revisão e fila por teclado, celular e zoom, com nomes longos e erros visíveis.
- [ ] COA-Q19 — Ensaio integrado: evento → triagem → coach → publicação → primeiro treino → feedback → revisão.
- [ ] COA-Q20 — Admin em pré-visualização não é confundido com professor ativo; saúde continua restrita aos profissionais autorizados e o síndico recebe somente sua visão permitida.

## 10. Implantação e dependências

A captura canônica, situação do morador, publicação de triagem e revisão de segurança receberam alterações no banco na frente anterior. Isso não comprova que o frontend novo está publicado nem que o ciclo do coach foi homologado.

No último registro de entrega, `20261105222724_fitness_usage.sql` e `20261107005330_workout_protocol_authoring.sql` permaneciam locais. São dependências de `coach_fitness_followup` e `create_protocol_from_workout`, já chamados pela interface. Reconsultar o histórico remoto antes de aplicar; não executar push geral com timestamps divergentes.

Do admin: vínculo profissional ativo, escopo, infraestrutura e serviços configurados. Do morador: identidade, consentimento, captura e execução. Do coach para o morador: avaliação, prescrição publicada, orientação e revisão. Para síndico/admin: informações operacionais autorizadas e acompanhamento agregado, preservando a anamnese.

## 11. Fontes verificadas

- [Central do professor](../../src/pages/coach/CoachHome.tsx), [revisões](../../src/pages/coach/ReviewQueue.tsx) e [acompanhamento](../../src/pages/coach/FitnessFollowup.tsx).
- [Editor](../../src/components/CriarTreinoDialog.tsx), [fila de sugestões](../../src/components/treinos/FilaIATreinos.tsx), [salvar protocolo](../../src/components/treinos/SaveWorkoutProtocol.tsx) e [planos](../../src/pages/treinos/PlanosTreino.tsx).
- [Validação de prescrição](../../src/lib/workout.ts), [carteira](../../src/hooks/useSupabaseStudents.ts) e [layout](../../src/layouts/PersonaLayout.tsx).
- [Captura e publicação](../../supabase/migrations/20261105110224_portaria_eletronica_fitness.sql), [acompanhamento no banco](../../supabase/migrations/20261105222724_fitness_usage.sql) e [autoria de protocolo](../../supabase/migrations/20261107005330_workout_protocol_authoring.sql).
- [Entrega do morador](../ENTREGA_MORADOR_2026-11-10.md) e [direção macro](../DIRECAO_PRODUTO_PERSONAS.md).

Os pacotes foram implementados no código local. O próximo passo operacional é publicar o frontend, preparar um condomínio ativo e executar o roteiro de QA, conforme o registro de entrega. A conferência técnica não marca os cenários funcionais como aprovados.
