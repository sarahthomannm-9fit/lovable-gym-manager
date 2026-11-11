# Coach — design da operação

Complemento de [03_COACH.md](03_COACH.md). Data: 10/11/2026. Este documento define o design e os critérios de aceite dos mesmos pacotes. A implementação posterior está em [Entrega técnica do coach](../ENTREGA_COACH_2026-11-10.md). A QA funcional e a verificação observada dos cliques ficam com o responsável.

## 1. Decisão central

O professor precisa saber quem atender, qual decisão tomar e o que acontece depois da confirmação. A interface deve acompanhar esse trabalho: selecionar o morador → montar ou revisar → conferir → publicar → acompanhar. Agenda e acompanhamento abrem esse mesmo atendimento, sem obrigar a repetir a busca.

Manter quatro destinos: **Atendimentos, Moradores, Agenda e Biblioteca**. A página inicial é Atendimentos. Seu resumo apresenta pendências com ação, e não uma coleção de indicadores sem destino. Biblioteca contém exercícios e protocolos; o plano individual é aberto pelo atendimento do morador.

| Destino | Pergunta que resolve | Conteúdo principal |
| --- | --- | --- |
| Atendimentos | Quem precisa de mim agora? | Avaliações, prescrições, retornos e revisões, com motivo e próxima ação |
| Moradores | Como está esta pessoa? | Busca e atendimento individual autorizado |
| Agenda | O que vou conduzir e quando? | Aulas e compromissos confirmados dentro do escopo do coach |
| Biblioteca | O que posso usar nesta prescrição? | Exercícios e protocolos, com disponibilidade e origem explícitas |

Não somar outra faixa de navegação com as mesmas tarefas. Filtros pertencem à página em que são usados. Se uma categoria não tiver fonte confiável ou ainda não estiver implementada, não exibir um número inventado para preencher o resumo.

## 2. Montagem — espaço de trabalho

Usar uma página de trabalho para a montagem completa. Um modal pequeno fica reservado a confirmações e escolhas curtas. A prescrição extensa precisa de espaço, endereço retomável e um cabeçalho que mantenha morador e condomínio reconhecíveis.

### Estrutura da tela

| Região | Conteúdo | Comportamento |
| --- | --- | --- |
| Cabeçalho | Nome completo, condomínio, origem do trabalho e situação de segurança | Permanece reconhecível durante a edição; mudar o destinatário exige uma ação explícita |
| Resumo de contexto | Objetivo, experiência e acesso à avaliação/infraestrutura | Detalhes por expansão; não ocupar a tela com toda a anamnese enquanto o professor parametriza exercícios |
| Programação | Dias/sessões e sequência dos exercícios | Selecionar um dia; identificar quantidade de exercícios e parâmetros pendentes |
| Área de edição | Exercícios e variáveis do dia selecionado | Nomes completos, controles próximos de seus rótulos, ordenação e duplicação claras |
| Ações | Estado do rascunho, Salvar e sair, Conferir prescrição | Uma ação principal por etapa; publicação fica na conferência |

No desktop, a programação pode ocupar uma coluna estreita e a edição a coluna principal. A busca de exercícios abre um painel lateral, sem apagar o trabalho em andamento. No celular, mostrar uma área por vez: dia → exercícios → parâmetros, preservando a posição ao voltar.

### Percurso da montagem

1. **Contexto:** confirmar morador, objetivo, segurança e origem — manual, protocolo ou revisão. Mostrar o que será copiado.
2. **Montagem:** selecionar o dia, incluir exercícios e preencher variáveis. Permitir voltar ao contexto sem perder o trabalho.
3. **Conferência:** apresentar a prescrição organizada por dia, com início, validade, frequência e orientações. Destacar somente pendências ou mudanças relevantes.
4. **Publicação:** confirmar a gravação no servidor e oferecer o próximo passo dentro do atendimento.

Essas etapas organizam as funções existentes. Não introduzem prescrição automática nem uma nova capacidade de periodização.

### Escolha de exercícios

Busca por nome e filtros por grupo muscular/equipamento devem operar na mesma lista. Cada resultado mostra nome completo, grupo e equipamento. “Adicionar” informa o dia de destino, por exemplo, **Adicionar à segunda-feira**.

Resultado indisponível precisa de motivo: equipamento não aprovado, incompatibilidade identificada ou cadastro inativo. Falha de consulta tem mensagem e repetição próprias; não se apresenta como biblioteca sem exercícios. Se a política permitir mostrar itens indisponíveis, a ação permanece desabilitada e a razão fica legível.

Ao substituir, mostrar exercício atual e alternativa antes da confirmação. Preservar os demais parâmetros apenas quando isso fizer parte da regra implementada, e informar o que foi mantido. Não chamar de “alternativa segura” um resultado que ainda precisa ser validado ou que não pode ser selecionado.

### Parametrização

| Informação | Apresentação e interação |
| --- | --- |
| Séries e repetições | Campos separados, com rótulo e formato aceito claros; validação junto ao exercício |
| Carga | Unidade visível. Campo vazio significa não informado; zero permanece um valor explícito |
| Descanso | Segundos no campo, com leitura compreensível na conferência; zero não é ausência de informação |
| Orientação do professor | Texto individual do exercício, apresentado também ao morador |
| Ordem e dia | Movimentação por botões, disponível por teclado; não depender apenas de arrastar |
| Início e validade | Resumo do calendário e regra de repetição visíveis antes da publicação |

Se o editor repete a mesma semana, escrever **Esta programação se repete durante a validade do plano**. Ao abrir um plano com semanas distintas, preservar essa estrutura ou bloquear sua conversão silenciosa. A interface não pode prometer edição de periodização que o modelo atual não representa.

O rascunho mostra um estado real: salvando, salvo no dispositivo ou falha ao salvar. Não exibir “salvo” como texto permanente. Descartar é uma ação secundária separada de Salvar e sair. Dados de saúde não devem ser copiados para o rascunho como parte dessa reorganização visual.

## 3. Conferência e publicação

A conferência é a última decisão do professor. Deve permitir responder sem voltar ao editor: **para quem, por quê, quando, quais exercícios e com quais parâmetros?**

Exibir o nome e o condomínio no topo; em seguida, objetivo, vigência e organização por dia. Os cartões usam a mesma terminologia da tela do morador. Na revisão de um plano, mostrar o motivo e um resumo factual das mudanças que o sistema conseguir calcular; não substituir esse resumo por comparação inventada.

| Situação | Resposta da interface |
| --- | --- |
| Informação obrigatória incompleta | Identificar exercício/campo e oferecer Voltar ao ponto correspondente |
| Avaliação ainda necessária | Explicar o bloqueio e abrir a avaliação autorizada; não apresentar Publicar como ação disponível |
| Prescrição válida | Ação principal **Publicar treino para [nome]** |
| Publicação em andamento | Bloquear repetição e edição do payload confirmado; manter a tela e indicar processamento |
| Erro confirmado | Preservar o rascunho, explicar a falha e permitir tentar novamente |
| Resultado incerto por conexão | Informar que a confirmação está pendente e consultar/repetir com o mesmo identificador; não sugerir criar outro plano |
| Publicação confirmada | Mostrar morador, plano e vigência, com Ver plano publicado e Voltar aos atendimentos |

Publicação confirmada não significa leitura pelo morador nem entrega de e-mail. Esses estados só aparecem se houver evidência. A notificação não deve gerar uma segunda mensagem em reenvio do mesmo pedido.

Evitar um segundo caminho de publicação com conferência mais fraca: sugestão e montagem manual convergem para os mesmos requisitos, ainda que a sugestão já venha preenchida.

## 4. Acompanhamento — da informação à ação

Organizar a lista por necessidade de atendimento, com filtros simples. Cada linha apresenta nome completo, plano, situação, evidência datada e ação principal. O professor não deve ter que reconhecer o morador apenas pelo título de um treino.

| Situação | Evidência que acompanha o rótulo | Ação principal |
| --- | --- | --- |
| Sem primeira sessão | Plano publicado e nenhuma conclusão registrada naquele plano | Abrir atendimento e conferir orientação/contato |
| Sem retorno recente | Data da última conclusão e período usado pelo sistema | Abrir acompanhamento do morador |
| Feedback para avaliar | Sessão, data e observação, dentro do escopo autorizado | Ler e encaminhar atendimento ou revisão |
| Plano perto do fim | Data de término e dias restantes | Abrir revisão do plano |
| Conclusão recente | Data e quantidade de sessões no período explicitado | Consultar histórico |

Não transformar ausência de registro em diagnóstico, desinteresse ou prova de que a pessoa não treinou. O texto é **sem sessão concluída registrada**, quando essa é a evidência disponível. Presença no prédio, presença em aula e conclusão de treino continuam separadas.

Ao abrir uma linha, usar a visão do morador com três blocos: situação atual, plano/sessões e atendimentos. Ações de Revisar plano ou Encaminhar feedback já recebem o morador correto. O retorno preserva o filtro anterior. Se ainda não houver status de atendimento persistido, não mostrar feedback como “respondido”.

Atualizar a lista não pode misturar dados de condomínios. Em falha, manter a distinção entre última informação consultada e informação atual confirmada. Período e origem da métrica acompanham seu valor; evitar percentuais de adesão sem denominador compreensível.

## 5. Agenda — conduzir a operação do dia

A entrada da agenda é **Hoje**, com alternância para próximos dias. Priorizar uma lista cronológica operacional; calendário visual só se ajudar a localizar os mesmos registros. Não é necessário criar um calendário complexo para atender essa fase.

Cada item informa horário do condomínio, nome da atividade, local quando disponível, capacidade/inscrições quando aplicáveis e situação. Aulas canceladas continuam identificáveis no histórico e não oferecem início de atendimento.

| Momento | Ação principal | Informação necessária |
| --- | --- | --- |
| Antes da aula | Ver inscritos | Horário, local, inscritos confirmados e limite |
| Janela permitida de atendimento | Abrir lista de presença | A regra de horário vem do servidor; o relógio local não concede permissão |
| Durante a aula | Registrar presença | Nome completo e estado individual, com proteção contra repetição |
| Após a aula | Consultar presenças | Resultado salvo e data; não inventar ação Encerrar se ela não existir |
| Cancelamento | Confirmar cancelamento | Nome, data e consequência real para os inscritos; não afirmar envio de mensagem sem confirmação |

Na lista de presença, limpar os inscritos da aula anterior antes da nova consulta. Carregando e falha são estados distintos de nenhum inscrito. A confirmação individual permanece visível após salvar. Em erro, o nome continua no lugar com possibilidade de repetir, sem marcar presença otimisticamente como confirmada.

Solicitações com horário preferido não entram como compromisso confirmado. Se a integração Staff ou a contratação não autorizar acesso do coach a determinado registro, ele não aparece na agenda como consequência apenas dessa proposta de design.

## 6. Linguagem e sistema visual

| Usar | Evitar |
| --- | --- |
| Avaliar triagem; Conferir prescrição; Revisar plano | “Revisar” sem dizer o que será decidido |
| Publicado no aplicativo | “Aluno recebeu” sem evidência de entrega/leitura |
| Sem conclusão registrada desde [data] | “Aluno inativo” calculado apenas pela falta de sessão |
| Carga não informada | Mostrar zero onde o professor deixou o campo vazio |
| Horário solicitado; Horário confirmado | Colocar ambos como agendamento confirmado |
| Rascunho salvo neste dispositivo | Prometer sincronização ou recuperação entre dispositivos sem implementação |

Usar os tokens existentes da marca, espaçamento consistente e contraste verificado. Reservar destaque para ação principal e pendências que exigem decisão. Títulos expressam a tarefa. Cor acompanha texto. Detalhes clínicos não viram elementos decorativos no painel.

## 7. Checklist de design para implementação

- [ ] Uma navegação de trabalho, sem faixas concorrentes para as mesmas tarefas.
- [ ] Editor com contexto persistente, programação por dia e espaço adequado para os exercícios.
- [ ] Busca e substituição com destino e disponibilidade explícitos.
- [ ] Variáveis legíveis, unidades visíveis e diferença entre vazio e zero.
- [ ] Conferência completa, comum aos caminhos manual e sugerido.
- [ ] Publicação com estados de processamento, erro, confirmação incerta e sucesso real.
- [ ] Acompanhamento com evidência e ação por morador, preservando filtro e contexto.
- [ ] Agenda cronológica e presença com estados reais, horário do condomínio e regras do servidor.
- [ ] Rascunhos, retorno e revisão sem perda silenciosa de trabalho ou de semanas programadas.
- [ ] Celular, teclado, foco, zoom e textos longos contemplados em cada etapa.

Este checklist orienta os itens COA-07 a COA-20 e depende de COA-01 a COA-06 para segurança e contexto. Substitui descrições genéricas de “melhorar tela” por decisões verificáveis; não amplia a lista de módulos.

## 8. Critérios para a QA do responsável

O professor deve conseguir montar um treino manual, conferir uma sugestão, revisar um plano, tratar um retorno e conduzir uma aula sem perder o morador/condomínio selecionado. A prescrição que ele confirma deve corresponder àquela que o morador consulta.

Usar os cenários COA-Q01 a COA-Q20 do documento principal. Acrescentar à observação: clareza da ação principal, tempo gasto para localizar a tarefa, necessidade de repetir busca, entendimento dos estados e preservação do trabalho. Medir esses resultados no ensaio; este documento não atribui tempos de uso ainda não observados.

Base consultada: [editor atual](../../src/components/CriarTreinoDialog.tsx), [fila](../../src/components/treinos/FilaIATreinos.tsx), [central](../../src/pages/coach/CoachHome.tsx), [acompanhamento](../../src/pages/coach/FitnessFollowup.tsx) e diagnóstico da persona.

## 9. Cobertura integral do checklist e regra dos três cliques

Esta matriz cobre os 41 pontos do checklist consolidado apresentado ao responsável. É uma especificação de navegação, não uma medição da interface atual. O limite é de até três cliques para acessar uma tarefa ou controle a partir da central do coach. Busca, digitação, seleção de vários exercícios e decisões profissionais não têm um limite artificial de três interações no trabalho inteiro.

Para evitar esconder esforço, a QA registra separadamente: cliques para chegar à tarefa, interações para realizá-la, retornos desnecessários e perda de contexto. Se uma função exigir navegar por um menu secundário não previsto abaixo, o percurso precisa ser corrigido ou sua contagem revisada.

### Atendimento e segurança

| Item | Onde aparece e percurso desde a central | Limite / critério visual |
| --- | --- | --- |
| 01. Pendências por situação e espera | Atendimentos já é a entrada; selecionar filtro | 0–1 clique. Motivo e data visíveis na linha |
| 02. Atendimento direto da fila | Pendência → Abrir atendimento | 1 clique no botão da linha, sem menu intermediário |
| 03. Captura completa da triagem | Pendência → Avaliação → Respostas completas | Até 3 cliques. Mesma captura, com seções legíveis |
| 04. Avaliar, encaminhar e publicar | Pendência → Avaliação ou Prescrição → ação correspondente | Até 3 para chegar à decisão. Ações têm nomes e resultados distintos |
| 05. Autorização e liberação | Cabeçalho do atendimento/editor; bloqueio junto à ação | Automático. Não exigir navegar para descobrir por que está bloqueado |
| 06. Carregamento, erro e ausência | No próprio bloco de fila ou atendimento | Estado visível sem clique; repetir consulta em 1 clique |
| 07. Troca de condomínio/morador | Seletor de condomínio; Moradores → pessoa | Até 2 para selecionar. Proteger rascunho e limpar dados antigos |

### Montagem e publicação

| Item | Onde aparece e percurso desde a central | Limite / critério visual |
| --- | --- | --- |
| 08. Espaço amplo com destinatário | Pendência → Montar treino | 1 clique pelo atalho; cabeçalho permanece reconhecível |
| 09. Etapas de montagem | Morador → Montar treino → etapa desejada | Até 3 para acessar a etapa. Contexto, montagem e conferência identificáveis |
| 10. Exercícios por dia e busca | Pendência → Montar treino → Adicionar exercício | Até 2 pelo atalho. Dia de destino e busca no painel aberto |
| 11. Disponibilidade e bloqueio | Na lista de exercícios e no resumo de infraestrutura | Motivo visível junto ao resultado; detalhe por expansão sem sair da montagem |
| 12. Incluir, ordenar, duplicar, remover e substituir | Pendência → Montar treino → controle do exercício | Até 3 para alcançar o controle. Ações frequentes ficam na linha; não depender de arrastar |
| 13. Variáveis de treino | Pendência → Montar treino → exercício | Até 3. Séries, repetições, carga, descanso e orientação agrupados |
| 14. Vazio e zero | Campo e conferência do exercício | Distinção visível sem abrir outra tela |
| 15. Frequência, início, validade e repetição | Pendência → Montar treino → Programação | Até 3. Resumo reaparece na conferência |
| 16. Revisão com semanas distintas | Morador → Plano atual → Revisar | Até 3 para iniciar. Diferenças semanais preservadas ou limite explicado antes da conversão |
| 17. Rascunho e proteção | Barra de ações do editor | Estado sempre visível; Salvar e sair em 1 ação dentro do editor; confirmação ao abandonar quando necessária |
| 18. Conferência fiel | Pendência → Montar treino → Conferir | Até 3 para chegar à conferência, desconsiderando o preenchimento do treino. Mesmo payload apresentado e enviado |
| 19. Processamento, erro e resultado incerto | Na própria conferência/publicação | Estado visível sem navegação. Repetição/consulta em 1 ação, mantendo o identificador |
| 20. Depois de publicar | Confirmação com Ver plano e Voltar aos atendimentos | 1 clique para cada destino; não retornar a um painel genérico sem contexto |

### Acompanhamento

| Item | Onde aparece e percurso desde a central | Limite / critério visual |
| --- | --- | --- |
| 21. Situação, evidência e próxima ação | Atendimentos → filtro de acompanhamento | Até 1 clique. Linha apresenta os três elementos juntos |
| 22. Primeira sessão, retorno e conclusão recente | Filtros do acompanhamento | 1 clique por filtro; descrição objetiva do período e da evidência |
| 23. Plano perto do fim | Atendimentos → Revisões por validade | 1 clique. Término e dias restantes na linha |
| 24. Feedback acionável | Feedback → Abrir atendimento → Encaminhar ou revisar | Até 3 para chegar à ação. Registrar o resultado exige o preenchimento correspondente |
| 25. Abrir o plano certo | Linha do acompanhamento → Ver plano | 1 clique pelo atalho. Sem selecionar novamente o morador |
| 26. Preservar filtros no retorno | Voltar aos atendimentos | 1 clique. Busca, filtro e posição anteriores recuperados |
| 27. Separar tipos de presença | Resumo e histórico do atendimento | Rótulos e fonte visíveis. Detalhar registro em até 3 cliques desde a central |

### Agenda

| Item | Onde aparece e percurso desde a central | Limite / critério visual |
| --- | --- | --- |
| 28. Hoje e próximos dias | Agenda → período | Até 2 cliques; Hoje também resumido na central |
| 29. Horário, atividade, local e situação | Cartão/lista da agenda | Visíveis ao abrir Agenda, em 1 clique |
| 30. Solicitado versus confirmado | Rótulo do compromisso e sua origem | Visível na lista; solicitação não ocupa o lugar de confirmação |
| 31. Consultar inscritos | Aula de hoje → Ver inscritos; ou Agenda → aula → inscritos | Até 3 cliques. Carregamento e falha no mesmo espaço da lista |
| 32. Registrar presença | Aula de hoje → Lista de presença → Marcar | Até 3 pelo atalho da central. Sem duplicação; resultado por pessoa |
| 33. Regras de horário | Ação da aula e explicação junto ao bloqueio | Automático. A permissão é validada no servidor; não exige tela de configuração |
| 34. Cancelar atividade | Agenda → aula → Cancelar | Até 3 para abrir a confirmação; confirmar a consequência é uma decisão adicional explícita |
| 35. Histórico de atividades/presenças | Agenda → Histórico → atividade | Até 3. Situação e registros anteriores preservados |

### Navegação, biblioteca e acabamento

| Item | Onde aparece e percurso desde a central | Limite / critério visual |
| --- | --- | --- |
| 36. Quatro destinos únicos | Atendimentos, Moradores, Agenda e Biblioteca | Cada destino em 1 clique; mesma estrutura no celular |
| 37. Exercício, plano e protocolo | Biblioteca → Exercícios ou Protocolos → item; plano pelo morador | Até 3. Tipo e origem identificados, sem confundir modelo com prescrição individual |
| 38. Reuso sem dados pessoais | Biblioteca → Protocolo → Usar no atendimento | Até 3 para iniciar o reuso. Destinatário e parâmetros individuais são conferidos depois |
| 39. Dependências implantadas | Funções disponíveis nas telas correspondentes | Critério técnico. Não criar uma tela extra para o professor descobrir migration ausente; falha tem recuperação e suporte |
| 40. Celular, teclado, foco e textos | Aplicado a todas as telas e controles | Critério transversal: mesma tarefa acessível, nomes completos e foco previsível |
| 41. Indicadores e desempenho | Resumo de Atendimentos e blocos de acompanhamento | Valor, período e base visíveis; detalhe em até 3 cliques. Tempos precisam ser medidos no ensaio |

### Comportamentos obrigatórios para sustentar a simplicidade

- A central mantém atalhos para a pendência selecionada, feedback e aulas de hoje; a navegação principal não é a única entrada para essas tarefas.
- Dentro do atendimento, morador, condomínio, plano e origem já estão selecionados. Não pedir a mesma seleção novamente em cada etapa.
- Os dados secundários abrem no contexto atual. Não esconder campo necessário à decisão em sucessivos menus de três pontos.
- Formulários mostram somente os controles pertinentes à etapa, preservando valores ao avançar e voltar.
- Ações de segurança, publicação e cancelamento mantêm sua confirmação explícita. O limite de acesso não autoriza eliminar decisões necessárias nem afirmar que o fluxo inteiro tem apenas três cliques.
- A QA deve verificar todos os 41 pontos em desktop e celular. O número proposto só passa a ser evidência quando o percurso for implementado e observado.
