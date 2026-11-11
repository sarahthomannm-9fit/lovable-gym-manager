# Entrega técnica do coach — 10/11/2026

Referências: [plano da persona](personas/03_COACH.md) e [design com cobertura dos 41 pontos](personas/03_COACH_DESIGN.md). A QA visual e funcional fica com o responsável. Este registro diferencia implementação, implantação do banco e homologação.

## 1. Resultado implementado

| Frente | Entrega no código |
| --- | --- |
| Atendimentos | Entrada com avaliações, prescrições, feedback e revisão por validade; busca e filtros na URL. Carteira do servidor, sem composição paralela por aulas/triagens no frontend. Erro não se apresenta como fila vazia |
| Morador | Atendimento individual com situação cadastral, captura de saúde, decisões, equipamentos, planos, sessões e registros internos de acompanhamento. Atalhos preservam o destinatário e a origem |
| Avaliação | Respostas da captura canônica, incluindo PAR-Q, medicamentos, dor, histórico, cirurgias, restrições e observações. Ausência não é apresentada como resposta negativa. Decisão exige justificativa e usa a RPC auditada |
| Montagem | Página `/coach/prescricao`, com cabeçalho do morador e etapas Contexto, Montagem e Conferência. O editor compartilhado continua disponível em modal para as entradas antigas |
| Exercícios | Busca, grupo muscular e equipamento; dias do treino; adicionar, ordenar, duplicar, remover e substituir com botões. Indisponibilidade tem motivo; alternativa indisponível não pode ser confirmada |
| Variáveis | Séries, repetições, carga, descanso e orientações, além de objetivo, nível, início e validade. Carga não informada é distinta de zero. Dia selecionado e conferência por dia |
| Segurança da prescrição | O contexto e a permissão de preparar/publicar vêm do servidor. Pendência clínica e pendência de conferência da prescrição são distinguidas; o servidor revalida na gravação |
| Rascunho | Recuperação validada por usuário, condomínio, morador e origem. Estado real do armazenamento; dados da anamnese não são copiados ao rascunho. Falha de armazenamento ativa proteção de navegação |
| Conferência e publicação | Payload conferido enviado pela mesma operação; bloqueio de repetição durante envio e preservação do identificador. Resultado de rede incerto congela os parâmetros para repetir o mesmo pedido. Confirmação dá acesso ao plano e retorno à operação |
| Revisão | Motivo obrigatório, plano anterior preservado no histórico e publicação transacional. Semanas diferentes ou incompletas bloqueiam a conversão simplificada, em vez de serem reduzidas silenciosamente à primeira semana |
| Consulta da prescrição | Visualização somente para leitura de todas as semanas e dias do plano, incluindo cargas, descanso e orientações. Planos atuais, anteriores e não publicados têm rótulos distintos |
| Protocolo | Biblioteca de exercícios e protocolos; escolha do morador antes do reuso. Protocolo sugerido incompleto oferece montagem manual. Reuso não importa carga ou nota individual; ajustes configurados da sugestão são carregados para conferência |
| Acompanhamento | Sem primeira conclusão, sem retorno há 14 dias, conclusão recente, perto do término, vencido e sem plano vigente. Critério de plano atual acompanha a ordenação do servidor do morador |
| Feedback | Evidência da sessão com registro interno de orientação/encaminhamento e estado de atendimento persistido, com ator e auditoria. Não foi criado envio automático de mensagem ao morador |
| Agenda | Hoje, próximos dias e histórico das aulas atribuídas ao profissional. Horário do condomínio, inscritos, presença, falha de consulta e cancelamento. Registro individual protegido de repetição; confirmação depende do servidor |
| Navegação | Atendimentos, Moradores, Agenda e Biblioteca; a rota antiga de segurança encaminha à avaliação da nova central. Busca e filtro ficam no endereço; retorno do atendimento restaura a posição da lista após a consulta |

As entradas frequentes possuem atalhos para cumprir o acesso em até três cliques. A matriz continua sendo o critério para a QA: não foi executada contagem observada dos 41 percursos em navegador ou celular nesta rodada. Preencher uma prescrição e confirmar decisões são interações adicionais do trabalho, conforme o design aprovado.

## 2. Regras que preservam a operação

- A visão de avaliação consulta uma captura e apresenta separadamente a decisão atual da equipe. Não mistura silenciosamente campos de uma captura nova com uma projeção antiga.
- Preparar uma sugestão ainda pendente de conferência não equivale a publicar nem a liberar um caso clínico rejeitado.
- A publicação nova usa `coach_publish_workout`, que valida sessão, responsabilidade pelo morador, identificador/payload de reenvio e origem. Publicação, revisão e atualização da captura legada ficam na mesma transação.
- A notificação de novo plano permanece no trigger existente. Foi removido o envio manual adicional da antiga central. A revisão do novo fluxo não acrescenta uma segunda notificação pela chamada legada de revisão.
- O plano com semanas distintas pode ser consultado integralmente. O editor simplificado repete uma semana e bloqueia revisão que perderia a programação original. Esta entrega não introduz um novo editor de periodização.
- O professor não amplia seu escopo por mudar filtros ou parâmetros da URL. As funções do servidor validam a responsabilidade e a situação da sessão.
- Agenda não converte uma preferência de horário em compromisso confirmado. A tela trata as aulas atribuídas; não foi presumido vínculo entre uma solicitação Staff externa e a conta interna do professor.
- Atualizações de atendimento ficam em tabela própria. O feedback original da sessão não é sobrescrito pela orientação interna do coach.

## 3. Implantação realizada

Projeto do produto: `jobytedbdptuncvobarw`.

| Arquivo local | Nome remoto | Versão remota |
| --- | --- | --- |
| `20261105222724_fitness_usage.sql` | `fitness_usage` | `20261110203033` |
| `20261107005330_workout_protocol_authoring.sql` | `workout_protocol_authoring` | `20261110203049` |
| `20261110201603_coach_operation_workspace.sql` | `coach_operation_workspace` | `20261110203058` |

Novas funções: `coach_operation_summary`, `coach_student_case`, `record_coach_followup` e `coach_publish_workout`. Nova tabela: `coach_followup_actions`, com RLS, leitura restrita e sem escrita direta autenticada. Acesso anônimo às funções e à tabela foi verificado como negado.

Não foi executado push geral de migrations. Os timestamps locais/remotos divergem por aplicação via conector; conciliar o histórico antes de usar deploy por CLI. Impacto agregado do evento e prontidão fitness geral permanecem fora desta implantação específica.

## 4. Verificação técnica

- TypeScript do aplicativo e da configuração do Vite.
- ESLint sem erros nos componentes e páginas da frente revisada.
- Build de produção compilado; permanece aviso de bundle acima de 500 kB e de base Browserslist antiga.
- 23 testes Node: 11 de acesso, 6 de datas/status financeiros e 6 de regras do coach. Incluem plano futuro/inativo/expirado/não publicado, ordenação do plano atual, compatibilidade, rascunho inválido e detecção de semanas diferentes.
- Teste SQL isolado da operação: escopo, captura atual, elegibilidade clínica, fila sem captura antiga, registro de acompanhamento, rollback, reenvio exato, revisão e contagem de notificações do fixture.
- Ensaios SQL isolados das dependências de uso/acompanhamento e autoria de protocolo, incluindo ausência de campos pessoais no reuso.
- Leitura técnica das novas funções no banco real em pré-visualização administrativa, dentro de transação encerrada com rollback. Nenhum plano, atendimento ou presença real foi criado como teste.

Comandos no repositório:

```powershell
npm run typecheck
node --test scripts/access.test.mjs scripts/resident.test.mjs scripts/coach.test.mjs
npm run build
```

Para `scripts/coach-workspace.test.mjs`, usar PGlite 0.3.14 instalado isoladamente, definir `PGLITE_MODULE` com o caminho absoluto de `dist/index.js` e executar `node scripts/coach-workspace.test.mjs`. Esse ensaio não usa o banco do produto. As funções de autorização existentes são representadas por fixtures; o teste não substitui a QA de permissões com contas reais.

## 5. Bloqueio operacional encontrado

A consulta real encontrou vínculos de professor ativo, mas nenhum deles em condomínio com status `ativo`. O acesso à operação do coach foi negado pelo servidor, conforme a regra existente de autorização. Esse resultado não foi marcado como falha de publicação da migration nem como aprovação da jornada de um professor.

A leitura administrativa passou; a leitura positiva com conta de professor em condomínio ativo permanece para a QA após preparação da operação. Não foram alterados status de condomínios, vínculos, contratos ou permissões para contornar essa condição. Ativar exige completar os dados e pré-requisitos reais do condomínio pela operação administrativa.

## 6. Entrega ao responsável

O frontend está no checkout local. Não houve commit/push nem publicação do aplicativo nesta rodada. Atualizar o banco não atualiza as telas do domínio publicado.

Para a QA: publicar uma versão que contenha esse frontend, preparar o condomínio ativo e executar COA-Q01 a COA-Q20, além da matriz dos 41 pontos de design. Dar atenção a contexto com rede lenta, avaliação, protocolo incompleto, carga vazia/zero, plano com semanas distintas, repetição de publicação, plano atual idêntico ao do morador, feedback interno e presença de aula.

Não foram afirmados teste de carga para o evento, desempenho medido em celular, entrega de e-mail, leitura de notificação pelo morador ou contagem real de cliques. A confirmação de publicação descreve o registro no aplicativo, não essas outras ocorrências.

O advisor de segurança foi consultado. Permanecem avisos gerais do projeto sobre funções privilegiadas, funções legadas sem search_path fixo, configuração de Auth e versão do Postgres. As funções adicionadas usam search_path fixo e validam acesso; não foi feita uma alteração global desses avisos fora do escopo. Referências: [funções privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [Auth em produção](https://supabase.com/docs/guides/platform/going-into-prod#security) e [Postgres](https://supabase.com/docs/guides/platform/upgrading).
