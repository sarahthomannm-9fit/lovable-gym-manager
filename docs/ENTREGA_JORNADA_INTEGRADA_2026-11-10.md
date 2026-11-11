# Entrega — jornada integrada das quatro personas

Data: 10/11/2026. Implementação no checkout local; duas migrations aplicadas no Supabase. Sem commit/push ou publicação do frontend. QA visual e funcional com o responsável, conforme combinado.

## Jornada entregue

| Momento | Comportamento implementado | Evidência principal |
| --- | --- | --- |
| Admin prepara infraestrutura | Mantém cadastro/aprovação existente; consulta quantidade, capacidade/horários cadastrados e gerencia indisponibilidade separada da aprovação | OrganizationInfrastructure e FitnessInfrastructure |
| Síndico mantém contexto | Atendimento → Academia permite consultar equipamentos e registrar motivo público de indisponibilidade ou liberação | SindicoOperacao; RPC com papel/organização e auditoria |
| Coach prescreve | Até três alternativas opcionais por exercício, com parâmetros próprios; busca na biblioteca e validação de compatibilidade/infraestrutura | CoachAlternatives; publicação no servidor |
| Coach publica/revisa | Alternativas persistidas em todas as semanas; conferência na montagem e no preview; revisão preserva alternativas e identifica semanas distintas | publicationPayload, publish_workout, CoachPlanPreview |
| Morador inicia | A sessão registra uma cópia da prescrição, incluindo nomes, orientações e alternativas | workout_sessions.prescription; resident_workout |
| Morador executa | Alternativa aprovada, retorno ao principal, exercício pendente, carga/séries/repetições realizadas | WorkoutExecutionCard |
| Troca de exercício | Limpa o registro daquele exercício após confirmação, para não atribuir carga de uma opção à outra | Card de execução; validação de alternativa no servidor |
| Morador pausa/retoma | Progresso confirmado preservado; sessão iniciada pode atravessar meia-noite sem perder a prescrição | save_workout_journey; cenário SQL |
| Interrupção de conexão/tela | Progresso local pode ser recuperado na mesma sessão da aba; feedback clínico não é persistido nesse cache | Validação de recovery; comparação de versão do servidor |
| Morador finaliza | Encerramento completo ou parcial com confirmação e histórico distinto; reenvio não duplica execução | completion_kind; terminal replay no servidor |
| Desconforto | Interrompe/pausa com relato ao coach; separado de alternativa por aparelho ocupado | attention; fila profissional |
| Orientação e resposta | Exercício → Pedir orientação → suporte com destino profissional; coach atende chamados do aluno na ficha | SupportTickets com escopo do aluno e RLS existente |
| Coach acompanha | Prescrito × realizado, alternativas usadas, pendências, sessões parciais e desconforto; notas internas separadas das respostas ao morador | CoachCase; coach_operation_summary |
| Gestão acompanha | Indicadores de treinos completos excluem sessões parciais; consulta opcional de faixas de início no app | Migration workout_completion_metrics; FitnessInfrastructure |

O fluxo principal continua entrar → abrir treino → executar → encerrar. Não há obrigação de reservar aparelho, informar lotação ou acessar indicadores antes de treinar.

## Garantias de dados

- A alternativa possui carga própria; carga em branco não herda a principal. A publicação verifica permissões, triagem, catálogo e equipamento aprovado/disponível para principal e alternativas.
- A sessão iniciada preserva sua prescrição quando o coach publica uma revisão. A mesma sessão é apresentada durante aquele dia; a nova programação fica para as próximas sessões.
- O servidor aceita somente exercícios da sessão e alternativas nela aprovadas. Carga e quantidades realizadas são validadas; finalização completa exige todos os exercícios realizados.
- Gravação com versão antiga é recusada, preservando o registro confirmado de outra tela. A interface mantém o rascunho e permite conferir o servidor; não faz mesclagem silenciosa.
- Escrita direta de sessões por anon/authenticated revogada; leitura continua sujeita a RLS. APIs antigas de salvamento delegam à validação nova.
- Sessões parciais têm status terminal com classificação partial e execução concluido=false. Histórico as distingue; métricas de conclusão exigem complete ou classificação histórica nula.
- Relatos clínicos permanecem no acompanhamento autorizado. Síndico recebe infraestrutura e agregados; não recebe prescription/progress/attention por estas novas consultas.

## Implantação e verificação

Projeto Supabase: jobytedbdptuncvobarw.

| Migration local | Versão remota |
| --- | --- |
| 20261110212240_integrated_workout_journey.sql | 20261110213609 |
| 20261110213809_workout_completion_metrics.sql | 20261110213848 |

Verificações executadas: TypeScript app, lint dos arquivos alterados, build e 29 testes Node. PGlite integrado verificou publicação/validação de alternativas, versão imutável, repetição, concorrência, sessão parcial, sessão completa, desconforto, retomada na virada de dia e permissões de infraestrutura. Outro ensaio verificou exclusão de parciais dos indicadores e compatibilidade com sessões históricas.

Consultas reais, em transação de leitura com rollback e identidade administrativa válida, passaram para infraestrutura, ficha do coach, resumo, uso agregado e acompanhamento. Privilégios remotos confirmaram escrita anônima e UPDATE direto de sessão negados. Não foram alterados cadastros, condomínios, vínculos ou triagens reais para preparar o ensaio.

Reprodução Node:

```
node --test scripts/access.test.mjs scripts/resident.test.mjs scripts/coach.test.mjs scripts/syndic.test.mjs scripts/workout-execution.test.mjs
```

Ensaios isolados: configurar PGLITE_MODULE para o dist/index.js do PGlite 0.3.14 e executar scripts/integrated-workout.test.mjs e scripts/workout-metrics.test.mjs. As funções preexistentes de autorização são representadas por fixtures; isso não substitui contas reais.

## QA do responsável

- [ ] Publicar o frontend deste checkout e conferir a versão antes de testar.
- [ ] Preparar condomínio ativo, equipe, vínculo e triagem pelos fluxos autorizados.
- [ ] Coach publica três exercícios e uma alternativa com carga diferente; morador encontra a prescrição correta.
- [ ] Alternativa incompatível, inativa ou com equipamento indisponível é recusada pelo servidor.
- [ ] Morador seleciona alternativa e registra a carga realizada; coach vê exatamente a opção usada.
- [ ] Trocar de volta ao principal exige confirmação quando há registro e não reaproveita a carga.
- [ ] Exercício sem alternativa pode ficar pendente enquanto os demais continuam.
- [ ] Pausar, bloquear celular, voltar, recuperar progresso e retomar mantêm o estado correto.
- [ ] Resposta perdida, clique duplo e conflito em duas abas não duplicam conclusão nem sobrescrevem a versão mais recente.
- [ ] Revisar o treino enquanto o morador executa mantém a sessão antiga e disponibiliza a revisão para as próximas.
- [ ] Encerrar parcialmente mantém pendências e não aumenta indicador de treino completo.
- [ ] Desconforto gera relato para o coach sem sugerir substituição automática.
- [ ] Pedido de orientação abre o destino profissional; resposta aparece ao morador.
- [ ] Síndico registra indisponibilidade; coach atualiza inventário e morador consulta o aviso.
- [ ] Troca de condomínio e de conta não mistura sessão, infraestrutura, chamados ou rascunhos.
- [ ] Conferir horários, virada do dia/mês, celular, teclado, zoom e trajetos de acesso às tarefas.

## Limites explícitos

Ocupação física ao vivo não foi implementada: não há fonte confiável de entrada/saída da academia. O painel mostra capacidade cadastrada e faixas de início de sessões no aplicativo nos últimos 30 dias. Não mede todos os usuários presentes, duração física ou espera por equipamento.

O histórico de prescrição começa com sessões registradas pelo fluxo atualizado; não é possível reconstruir retroativamente a versão original de sessões antigas sem snapshot. O recovery depende de armazenamento da sessão do navegador, não oferece operação integralmente offline e não persiste feedback clínico. O registro realizado é por exercício, sem cronômetro obrigatório ou detalhamento de cada série individual.

Atualização da infraestrutura é consultada; não existe garantia de aviso em tempo real sem atualizar. Não houve teste de carga com moradores reais nem homologação da experiência em dispositivo. Build mantém avisos sobre bundle grande e Browserslist antigo.

Condomínios não ativos continuam bloqueados para a operação regular. Avisos gerais do advisor sobre funções legadas, Auth e versão do Postgres permanecem na consolidação de correções; as funções novas usam search_path fixo e autorização explícita. Referências: [funções privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [Auth](https://supabase.com/docs/guides/platform/going-into-prod#security), [Postgres](https://supabase.com/docs/guides/platform/upgrading).
