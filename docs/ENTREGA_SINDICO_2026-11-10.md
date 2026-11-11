# Entrega do síndico — 10/11/2026

Os quatro pacotes de implementação do plano 04_SINDICO foram concluídos no código. A QA de interface e a homologação operacional ficam com o responsável. Não houve commit, push ou publicação do frontend; as telas do domínio publicado não mudam com a atualização do banco.

## Escopo entregue

| Pacote | Itens | Implementação |
| --- | --- | --- |
| Visão geral | SIN-01–07, 19 | Quatro destinos na navegação; resumo com detalhes sob demanda; contexto isolado; cobertura por unidades distintas com conta ativa; pessoas separadas de apartamentos; base ausente explícita; pendências encaminhadas; financeiro autorizado; lista operacional sem avaliações clínicas |
| Comunicação e evento | SIN-08–13, 18 | Criação única de comunicado, rascunho, revisão do público, publicação e arquivo; leituras separadas de notificações geradas; evento com conferência de data/local/capacidade, edição e ações confirmadas; participantes, espera e recepção separados; CSV delimitado e protegido contra fórmulas |
| Pós-evento e rotina | SIN-14–17 | Indicadores 7/30 dias implantados; janelas incompletas e ausência de causalidade explicitadas; agenda de sete dias; reservas, serviços e chamados por categoria; propostas dependem do aceite; datas em Brasília |
| Design e proteção | SIN-20 | Conteúdo progressivo com details, colunas responsivas, formulários rotulados, alertas e carregamentos distintos; atualização com recuperação; proteção de rascunho e navegação; pedidos de evento/comunicado podem ser repetidos sem duplicar |

A regra dos três cliques orienta o acesso às tarefas: navegação → categoria/evento → solicitação/painel. Não se aplica a preencher todos os campos ou confirmar todas as etapas de uma publicação. A contagem observada e o comportamento com teclado, zoom e celular seguem para QA SIN-Q01–Q20 em `personas/04_SINDICO.md`.

## Banco e autorização

Projeto `jobytedbdptuncvobarw`:

- `health_day_impact`: migration remota `20261110210557`.
- `syndic_operation_workspace`: migration remota `20261110210600`.
- Novas consultas: `syndic_operation_overview`, `syndic_event_list`, `syndic_announcements`.
- Nova escrita: `syndic_save_operation`, com lock, identidade da tentativa, comparação exata de payload, transação e auditoria. O registro privado de tentativas não tem acesso direto por anon/authenticated; RLS ligada. A ausência de policies nesse ledger é intencional.
- Funções com search_path fixo, escopo por organização e papel validado no servidor. Sem papel fictício de comitê ou ativação automática de condomínio.

Consulta real de overview, eventos e comunicados passou em sessão administrativa e transação com rollback. Também passou o ensaio remoto de criar evento, repetir a mesma tentativa, salvar comunicado e conferir ledger/auditoria, com rollback integral ao final. O retorno distingue moradores cadastrados de pessoas com conta vinculada. O ensaio isolado representa funções antigas e autorização por fixtures; não substitui teste com contas reais de síndico.

A situação não ativa de condomínios observada antes continua sendo uma dependência operacional. Preparar dados, vínculo e ativação pelo admin; não remover o bloqueio de autorização para preencher painel.

## Verificações

- TypeScript app e configuração Node, lint dos arquivos alterados e build de produção.
- 25 testes Node: acesso, datas/status, coach e CSV do síndico.
- PGlite: cobertura por unidade, base ausente, escopo indevido, contagens de evento, leitura de comunicado, reenvio exato, payload alterado recusado, publicação única, rollback em falha de auditoria, privilégios e RLS.
- PGlite de impacto: 7/30 dias, sessões concluídas, retorno e evento não autorizado.
- Conferência remota das migrations e privilégios: escrita anônima e leitura direta do ledger negadas.

Reprodução: `node --test scripts/access.test.mjs scripts/resident.test.mjs scripts/coach.test.mjs scripts/syndic.test.mjs`. Para `scripts/syndic-workspace.test.mjs`, definir PGLITE_MODULE apontando para PGlite 0.3.14, instalado isoladamente, e executar o script. Build mantém aviso de bundle grande e Browserslist desatualizado; desempenho no dispositivo não foi medido.

## Limites e próximo aceite

Publicar o frontend deste checkout antes de avaliar impacto nas telas. Executar SIN-Q01–Q20, incluindo troca de condomínio durante requisição lenta, falha após gravação, recepção com conexão interrompida e ensaio evento → prática posterior. A fila de recepção é por sessão da aba e depende do servidor; não é operação integralmente offline. Publicação no app não comprova entrega por outros canais nem leitura.

O advisor continua indicando avisos gerais preexistentes: funções legadas com privilégios/search_path, pg_net em public, Auth e atualização de Postgres. As funções novas exigem autenticação e validam papel/organização; isso explica o aviso informativo de SECURITY DEFINER autenticado. Não houve correção global de segurança nesta entrega. Referências: [search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [funções privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [Auth](https://supabase.com/docs/guides/platform/going-into-prod#security), [Postgres](https://supabase.com/docs/guides/platform/upgrading).
