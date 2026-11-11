# Síndico — diagnóstico, design e plano específico

Data: 10/11/2026. Referência: código local do Nine Living e documentos do Health Day. Quarta persona da sequência admin → morador → coach → síndico. Plano implementado em 10/11/2026, conforme [registro de entrega](../ENTREGA_SINDICO_2026-11-10.md). O diagnóstico abaixo preserva a situação anterior como referência. A QA funcional continua com o responsável e não está aprovada por este documento.

## 1. Resultado esperado

O síndico precisa saber se a operação está funcionando, o que depende de decisão e como encaminhar um problema. Deve conseguir organizar um evento, comunicar os moradores e acompanhar a rotina sem percorrer um painel extenso ou acessar a avaliação de saúde individual.

Sua visão é operacional: disponibilidade do serviço, uso registrado, agenda, solicitações, comunicação e resultados agregados. Avaliação clínica e prescrição pertencem ao profissional; implantação comercial e alterações de acesso continuam com o admin conforme as permissões.

## 2. Base existente e lacunas

| Frente | Existe no código | Ajuste necessário |
| --- | --- | --- |
| Visão geral | Snapshot por condomínio, moradores, uso, aulas, solicitações, implantação, metas e financeiro condicionado à permissão | Página extensa, indicadores e rotinas repetidos em abas e cartões; atualização periódica substitui toda a tela por carregamento |
| Adesão | Moradores ativos divididos por total de unidades | Pessoas e apartamentos são bases diferentes; vários moradores por unidade podem produzir mais de 100%. Separar cobertura de unidades e pessoas cadastradas |
| Diagnóstico operacional | Metas, lacunas e rótulos de saúde da ativação | Meta atingida não comprova jornada entregue; zero de moradores não prova falha de vínculo. Há termos e detalhes técnicos inadequados ao síndico |
| Moradores | Lista operacional fornecida pelo servidor | Uniformizar linguagem e campos permitidos; não reproduzir carteira clínica do coach |
| Aulas | Agenda resumida e ocupação calculada | Explicar período e cálculo; presença, inscrição e disponibilidade não são a mesma medida |
| Comunicados | Formulário no painel e página própria com rascunho/publicação/arquivo/leitura | Dois caminhos de criação com comportamento diferente; um faz insert e publicação em chamadas separadas. Falhas de leitura podem aparecer como zero |
| Health Day | Criação, edição, publicação, encerramento, cancelamento, participantes, espera, links e recepção | Lista e contagens exigem várias consultas; falha pode parecer ausência de inscritos; seleção e edição precisam de proteção de contexto |
| Recepção | Verificação pela equipe, reserva, check-in e fila local de reenvio | Solicitação pendente não equivale a confirmação. Reenvio na mesma aba não é operação totalmente offline |
| Pós-evento | Componente de impacto em 7/30 dias | A migration de impacto permanecia local no último registro de entrega; tratar janela incompleta e não atribuir causalidade ao evento |
| Rotina | Reservas, solicitações de serviço e suporte por componentes compartilhados | Todos aparecem em sequência na mesma página; priorizar pendências e conferir permissões por ação |
| Papéis | Gating de financeiro e comunicados | `useOrgRole` retorna `isComite: false`; não anunciar perfil consultivo de comitê como entregue. Conferir matriz de leitura/escrita no servidor |
| Exportação | CSV de participantes | Limitar dados, identificar evento/horário, tratar valores interpretáveis como fórmula e exportar somente registros autorizados |

## 3. Design da visão do síndico

Proposta de quatro destinos: **Meu condomínio, Eventos, Comunicação e Atendimento**. Reservas, serviços e chamados são filtros de Atendimento; implantação e detalhes de metas ficam em uma seção secundária da visão geral. Não acrescentar uma segunda faixa de abas com os mesmos destinos.

| Região da entrada | Conteúdo | Regra de apresentação |
| --- | --- | --- |
| Contexto | Condomínio, período e situação operacional | Identificação clara; estado cadastral separado de atividade de uso |
| Precisa de atenção | Pendência, motivo, responsável quando conhecido e ação | Priorizar o que o síndico pode resolver ou encaminhar |
| Rotina próxima | Próxima aula/evento e solicitações em andamento | Horário do condomínio e situação real |
| Uso registrado | Pessoas com sessão concluída, retornos e presenças, cada um com sua base | Poucos números, período explícito e acesso ao detalhe agregado |
| Detalhes | Histórico, implantação, metas e financeiro permitido | Por expansão ou destino específico; sem dominar a entrada |

O síndico não deve precisar interpretar nome de tabela, ID de vínculo ou erro técnico de integração. A mensagem explica a consequência operacional e oferece tentar novamente ou pedir apoio. Cadastro incompleto, condomínio suspenso, consulta indisponível e ausência de atividade têm mensagens distintas.

### Saúde dos dados e indicadores

- **Moradores cadastrados:** pessoas únicas, não apartamentos.
- **Cobertura das unidades:** unidades distintas com moradores vinculados divididas pelas unidades cadastradas, com regra explícita para unidade ausente e identificação inconsistente. Se não houver base confiável, mostrar Sem base.
- **Presença no condomínio:** check-ins diários registrados.
- **Presença em aula:** registros de presença na atividade.
- **Prática registrada:** sessões concluídas; retorno exige dias distintos conforme a definição do indicador.
- **Meta:** referência operacional configurada, sem transformar seu atingimento em homologação do produto.

Não classificar o condomínio como saudável só porque uma meta foi preenchida ou porque há poucos inadimplentes. A situação financeira é uma visão própria e condicionada à permissão.

## 4. Evento, pós-evento e uso diário

| Momento | Trabalho do síndico | Experiência esperada |
| --- | --- | --- |
| Preparação | Conferir operação, responsável, data/local, capacidade e comunicação | Evento com resumo para revisão antes de publicar; não usar automaticamente capacidade padrão como decisão operacional |
| Divulgação | Disponibilizar inscrição e entrada no aplicativo | Links com finalidades distintas: solicitar participação e ativar acesso; público/destino explícitos |
| Recepção | Confirmar vínculo, vaga e presença com a equipe | Tela de recepção focada em busca e próxima ação, separada da edição do evento |
| Lotação | Administrar confirmação e espera | Capacidade compartilhada e validada no servidor; ações repetidas não criam vagas extras |
| Encerramento | Encerrar inscrições ou cancelar o evento | Consequência revisada antes de confirmar; histórico preservado |
| Pós-evento | Conferir participação, ativação e prática posterior | Funil agregado com base e janela temporal; período ainda em curso visível |
| Dia a dia | Acompanhar aulas, solicitações, comunicação e uso | Abrir a pendência e agir sem retornar a módulos repetidos |

O prédio tem 80 apartamentos, não necessariamente 80 moradores ou contas. O playbook prevê 40–50 participantes e capacidade a confirmar pela operação. A tela atual inicia com 15 vagas; isso precisa ser uma sugestão editável, nunca uma confirmação de que atende ao evento fornecido. Não há medição de carga ou tempo de recepção nesta análise.

## 5. Checklist de implementação e acesso em até três cliques

O limite cobre acesso à tarefa a partir da entrada, mantendo explícitos preenchimento e confirmações. As contagens são propostas de design, ainda não verificadas em interface implementada.

| ID | Prioridade | Implementação | Acesso / aceite |
| --- | --- | --- | --- |
| SIN-01 | P1 | Unificar navegação e reduzir repetição da entrada | Cada um dos quatro destinos em 1 clique; rotina acima dos detalhes de implantação |
| SIN-02 | P0 | Separar carregamento inicial, atualização, falha, vazio e dado anterior | Estado no próprio bloco; repetir em 1 clique, sem mascarar erro como zero |
| SIN-03 | P0 | Proteger contexto e formulários | Troca de condomínio limpa seleções/rascunhos indevidos e descarta respostas tardias; aviso antes de perder edição |
| SIN-04 | P0 | Corrigir pessoas, unidades e adesão | Indicador na entrada; definição/base no detalhe em até 2 cliques. Pessoas não são divididas por apartamentos |
| SIN-05 | P0 | Conferir permissões por ação e proteção de saúde | Aplicação automática no servidor e interface; definir papéis realmente disponíveis antes de prometer consulta/gestão de comitê |
| SIN-06 | P1 | Organizar pendências com próxima ação | Entrada → pendência → resolver/encaminhar, até 3 cliques; não inventar responsável ou prazo |
| SIN-07 | P1 | Mostrar situação operacional com motivo | Entrada → detalhes da operação, até 2 cliques; cadastro, ativação, uso e homologação separados |
| SIN-08 | P0 | Unificar criação de comunicado e publicação confiável | Comunicação → Novo/rascunho → Conferir, até 3 cliques; publicação explícita, sem duplicação em reenvio |
| SIN-09 | P1 | Explicar público e leituras de comunicado | Comunicação → comunicado, até 2 cliques; publicação no app não significa leitura, envio de e-mail ou WhatsApp |
| SIN-10 | P0 | Fechar criação/edição/publicação do evento | Eventos → Novo/editar → conferência, até 3 cliques; data, local e capacidade revistos antes da decisão |
| SIN-11 | P0 | Separar inscrição, espera, confirmação e presença | Eventos → evento → participantes/recepção, até 3 cliques; contagens vêm do servidor e erro tem recuperação |
| SIN-12 | P0 | Tornar recepção focada e recuperável | Evento em destaque → Recepção → ação da pessoa, até 3 cliques; fila local exibe tentativa pendente, nunca presença confirmada sem resposta |
| SIN-13 | P0 | Proteger encerramento, cancelamento e gestão de vagas | Eventos → evento → ação; confirmação mostra a consequência e preserva histórico |
| SIN-14 | P0 | Implantar e conferir indicadores de impacto | Eventos → evento → resultado, até 3 cliques; 7/30 dias com janela e base explícitas, sem afirmar causalidade |
| SIN-15 | P1 | Dar acesso simples à agenda e rotina próxima | Entrada → atividade, até 2 cliques; inscrições, ocupação e presença diferenciadas |
| SIN-16 | P1 | Organizar reservas, serviços e chamados por situação | Atendimento → categoria → solicitação, até 3 cliques; ação limitada ao papel e estado atuais |
| SIN-17 | P1 | Padronizar datas e horários | Fuso do condomínio em listas, formulários e exportações; conferir virada de dia/mês |
| SIN-18 | P0 | Tornar exportação segura e delimitada | Evento → participantes → exportar, até 3 cliques; somente campos autorizados, proteção contra interpretação como fórmula e identificação do evento |
| SIN-19 | P1 | Corrigir linguagem, financeiro e diagnósticos | Detalhes em até 3 cliques; retirar jargão técnico e hipóteses de falha apresentadas como diagnóstico; financeiro só com permissão |
| SIN-20 | P2 | Completar acessibilidade e eficiência | Mesmas tarefas em celular/teclado/zoom; foco, textos longos e atualização não destrutiva. Medir consultas e uso antes de afirmar desempenho |

## 6. Quatro pacotes da fase

| Ordem | Pacote | Itens | Resultado |
| --- | --- | --- | --- |
| 1 | Visão clara e confiável | SIN-01 a 07 e 19 | Síndico entende situação e próxima ação; indicadores e permissões corretos |
| 2 | Comunicação e Health Day | SIN-08 a 13 e 18 | Evento e comunicação com revisão, públicos, capacidade, recepção e reenvio confiáveis |
| 3 | Pós-evento e rotina | SIN-14 a 17 | Resultado agregado, agenda e solicitações conectados com períodos e estados reais |
| 4 | Design e regressão | SIN-20 e conferência dos demais | Interface menos cansativa, responsiva e com percursos em até três cliques verificados |

Não criar um novo dashboard para cada pacote. Reorganizar as superfícies existentes, reduzindo a quantidade de decisões concorrentes e preservando o escopo do servidor.

## 7. Checklist de QA do responsável

- [ ] SIN-Q01 — Conta de síndico acessa somente os condomínios e ações permitidos; conta sem permissão não obtém financeiro nem operação indevida.
- [ ] SIN-Q02 — Síndico não recebe anamnese, PAR-Q, medicamentos, justificativa clínica ou feedback individual restrito ao profissional.
- [ ] SIN-Q03 — Trocar condomínio durante consulta lenta ou edição não mistura dados, destinatário ou evento.
- [ ] SIN-Q04 — Carregamento, falha, zero e Sem base têm representações distintas; atualização preserva a tarefa em andamento.
- [ ] SIN-Q05 — Duas pessoas no mesmo apartamento não distorcem cobertura de unidades; cadastros sem unidade não geram percentual enganoso.
- [ ] SIN-Q06 — Indicadores informam período, denominador e origem; atingir meta não marca a operação como homologada.
- [ ] SIN-Q07 — Pendência abre sua ação em até três cliques e permite retorno ao filtro anterior.
- [ ] SIN-Q08 — Comunicado salva rascunho, mostra público, publica uma vez, registra leitura quando existente e permite arquivar conforme a regra.
- [ ] SIN-Q09 — Falha após salvar/publicar comunicado permite recuperação sem criar outro comunicado ou afirmar entrega não confirmada.
- [ ] SIN-Q10 — Evento confere data, local e capacidade; reabrir edição preserva o evento e seus participantes.
- [ ] SIN-Q11 — Pré-inscrição, confirmação, espera, cancelamento e presença mantêm a mesma capacidade compartilhada.
- [ ] SIN-Q12 — Recepção permite busca, verifica vínculo e repete pedido sem duplicação; resultado incerto permanece pendente.
- [ ] SIN-Q13 — Falha de rede na recepção não aparece como operação totalmente offline nem confirma vaga sem servidor.
- [ ] SIN-Q14 — Encerrar e cancelar mostram suas consequências e preservam os registros históricos.
- [ ] SIN-Q15 — Impacto usa o grupo de participantes correto, distingue janelas incompletas e não afirma que o evento causou todo uso posterior.
- [ ] SIN-Q16 — Aulas, reservas, solicitações e chamados têm status e ações coerentes com o papel do síndico.
- [ ] SIN-Q17 — Datas e horários permanecem corretos perto da meia-noite e na virada de mês.
- [ ] SIN-Q18 — CSV contém somente os campos autorizados do evento correto e trata texto que começa como fórmula.
- [ ] SIN-Q19 — Navegação, formulários e recepção funcionam por teclado, celular e zoom, sem perda de contexto.
- [ ] SIN-Q20 — Ensaio completo: preparação do condomínio → evento → presença → prática posterior → leitura agregada pelo síndico, com atuação do coach preservada.

## 8. Implantação e dependências

O indicador de uso `condominium_fitness_usage` foi implantado com a frente do coach, conforme [registro de entrega](../ENTREGA_COACH_2026-11-10.md). As migrations de impacto e workspace do síndico foram aplicadas nesta rodada: versões remotas `20261110210557` e `20261110210600`. Não executar push geral de migrations por diferença de timestamps.

A preparação de condomínio ativo é condição da operação real das personas. O bloqueio por condomínio não ativo identificado na frente do coach não deve ser removido para preencher este painel. Dados e decisões operacionais precisam ser preparados pelo fluxo administrativo autorizado.

## 9. Fontes verificadas

- [Visão geral](../../src/pages/sindico/SindicoHome.tsx) e [papéis](../../src/hooks/useOrgRole.ts).
- [Health Day](../../src/pages/sindico/HealthDay.tsx), [recepção](../../src/pages/sindico/HealthDayReception.tsx) e [impacto](../../src/pages/sindico/HealthDayImpact.tsx).
- [Comunicados](../../src/pages/sindico/Announcements.tsx), [áreas/serviços/atendimento](../../src/pages/sindico/Operacao.tsx) e [uso registrado](../../src/pages/sindico/FitnessUsage.tsx).
- [Migration de impacto](../../supabase/migrations/20261105215843_health_day_impact.sql), [uso agregado](../../supabase/migrations/20261105222724_fitness_usage.sql) e [direção macro](../DIRECAO_PRODUTO_PERSONAS.md).

Após a implementação e a QA desta persona, consolidar as correções compartilhadas das quatro frentes em um documento geral, conforme a sequência solicitada.
