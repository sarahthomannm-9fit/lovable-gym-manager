# Correções dos relatórios — 26/10/2026

## Situação desta entrega

Alterações implementadas no clone local. Não houve publicação de frontend, aplicação das quatro novas migrations, deploy das funções desta rodada, commit ou push. Não foram criados nem executados testes nesta rodada, por solicitação do responsável. A leitura de código e a consulta de metadados do banco não constituem aprovação funcional.

Os seis anexos recebidos incluem relatórios repetidos. Os achados foram consolidados abaixo, sem contar repetições como problemas diferentes. A hipótese anterior sobre acesso anônimo/login não foi confirmada e não é tratada como vulnerabilidade comprovada. Políticas históricas permissivas foram distinguidas das políticas efetivamente encontradas no banco consultado.

## Checklist de correções no código

“Implementado localmente” significa que existe alteração de código; não significa validado, implantado ou aprovado para venda.

| # | Correção | Implementação local |
|---|---|---|
| 1 | Preservar condomínio ao entrar no Coach | Contexto explícito por usuário/organização/papel; removida escolha silenciosa de outra organização. |
| 2 | Impedir dados da sessão ou condomínio anterior | Subárvore e cache separados por identidade, organização e persona; respostas antigas invalidadas. |
| 3 | Unificar indicadores do Síndico | Uma RPC retorna snapshot com organização, versão e horário; ativo exige status e lifecycle_status ativos. |
| 4 | Fechar permissões amplas no banco | Políticas por operação, sessão válida, organização ativa e vínculo; barreira restritiva nas tabelas com organization_id. |
| 5 | Restringir dados financeiros | Dashboard financeiro exige administrador, gestor ou síndico autorizado; coach recebe carteira com campos permitidos. |
| 6 | Proteger relações nas gravações | Validação de organização/aluno e bloqueio de troca direta de identificadores; mutações sensíveis por RPC. |
| 7 | Respeitar revogação de acesso | Validação de sessão, perfil ativo, vínculo e profissional ativo no servidor. |
| 8 | Corrigir entrada administrativa | Rota /admin direciona para organizações; solicitações mantêm rota própria. A URL publicada depende da nova publicação. |
| 9 | Tornar seleção de acesso explícita | Sem associação automática a primeiro condomínio; falhas de contexto exibem recuperação. |
| 10 | Completar fluxos do Morador | Consentimento antes dos campos de saúde, treino elegível, leitura de comunicado, solicitações e reservas com protocolo de operação. |
| 11 | Corrigir fluxos do Coach | Carteira autorizada, fila de entrada sem responsável, editor completo para criar/atribuir treino e cancelamento de aula via RPC. |
| 12 | Corrigir fluxos do Síndico | Indicadores coerentes e suporte operacional separado de conteúdo clínico e privacidade. |
| 13 | Corrigir operação do Admin | Seleção coerente do condomínio, configuração explícita das integrações e acompanhamento dos pedidos profissionais. |
| 14 | Evitar duplicidade nas operações | Chaves idempotentes, bloqueios transacionais e conferência do conteúdo/autor nas repetições. |
| 15 | Rastrear reservas de créditos | Livro de movimentos de reserva/estorno, unicidade por pedido/motivo e proteção contra status atrasado. Não é um razão financeiro completo de concessões e saldo inicial. |
| 16 | Controlar integrações opcionais | Staff, IA e corporativo desabilitados por padrão; staging exige destinos próprios e desvio de e-mail. |
| 17 | Restringir dados pessoais e clínicos | Consentimento versionado, carteira limitada, justificativa clínica restrita e logs operacionais sem texto clínico. |
| 18 | Tratar erros sem fingir lista vazia | Erros e recuperação nas superfícies alteradas, limpeza de listas e bloqueio de dados antigos. Layout móvel continua sujeito à QA do responsável. |
| 19 | Preparar implantação e crescimento | Índices de escopo, identificação de build e ambiente, variáveis de configuração e roteiro 1 → 10 → 100. Sem certificação de carga ou capacidade. |
| 20 | Exibir somente o que pertence à persona | Menus, rotas, carregamento de dados e permissões separados por papel e condomínio; áreas pessoais não montam provedores administrativos. |

## Regra final: cada persona vê somente o que lhe corresponde

| Persona | Telas e ações próprias | Dados e limites |
|---|---|---|
| Morador | Entrada, vínculo, triagem, treino e execução, agenda, eventos, áreas/serviços, suporte e perfil | Próprios dados e inscrições; conteúdo publicado para sua audiência; sem telas administrativas ou prontuários de outros moradores. |
| Coach | Agenda, alunos autorizados, triagem, treinos, revisão, presença e acompanhamento | Alunos sob responsabilidade e fila inicial sem responsável; sem cobrança ou painel financeiro do condomínio. |
| Síndico | Indicadores do condomínio, ativação, operação, comunicados, Health Day, áreas e solicitações operacionais | Indicadores e informações operacionais autorizadas; sem anamnese, notas clínicas ou tickets privados de saúde. |
| Admin | Organizações, configuração, usuários/vínculos/convites, profissionais, solicitações, auditoria e acompanhamento | Gestão autorizada; acesso global é privilégio explícito. Visualização de outra persona é identificada e não substitui conta real daquela persona. |

O cadastro público é opt-in por organização; o padrão é convite. Cadastros legados com status divergentes não são reescritos em massa: precisam de decisão administrativa. Treinos legados sem publicação validada precisam ser revisados e publicados pelo fluxo autorizado antes da execução.

## Arquivos centrais

- Contexto e rotas: `src/hooks/useOperationalContext.tsx`, `src/lib/access.ts`, `src/components/RoleRoute.tsx`, `src/pages/SelectContext.tsx`, `src/App.tsx`.
- Menus: `src/layouts/PersonaLayout.tsx`, `src/components/ContextSwitcher.tsx`, `src/components/AppSidebar.tsx`.
- Operação: páginas em `src/pages/morador`, `src/pages/coach`, `src/pages/sindico`, `src/pages/admin`; `src/components/CriarTreinoDialog.tsx`; `src/pages/treinos/PlanosTreino.tsx`.
- Controle de ambiente: `.env.example`, `vite.config.ts`, `src/components/EnvironmentBadge.tsx`, `src/components/FeatureGate.tsx`.
- Integrações alteradas: `supabase/functions/staff-booking`, `agent-daily-reports` e `send-organization-invite`.

## Quatro migrations novas, ainda não aplicadas

1. `20261026201623_close_condominium_authorization_gaps.sql`: autorização, isolamento, carteira limitada e proteção de relações.
2. `20261026201955_unify_condominium_dashboard_metrics.sql`: snapshot único e métricas canônicas.
3. `20261026202149_protect_persona_transitions_and_consent.sql`: consentimento, publicação de treino, transições e suporte.
4. `20261026203705_idempotent_resident_operations_and_credit_ledger.sql`: idempotência, reservas, cancelamento, créditos e registros operacionais.

As migrations anteriores desta conversa pertencem à entrega anterior. Conferir o histórico remoto antes de aplicar: versões registradas remotamente podem diferir dos nomes locais. Não reaplicar indiscriminadamente.

## Pendências que código local não encerra

- Implantar o conjunto compatível de banco, funções e frontend e conferir a identidade do build publicado.
- Configurar ambiente separado, segredos/destinos das integrações e contatos responsáveis.
- Confirmar vínculos reais das quatro contas no Maison Guimet; sem usuários fictícios como evidência comercial.
- Resolver dados de operação, equipamento aprovado, profissionais, agenda, suporte e tratamento de risco clínico.
- Confirmar política de privacidade, retenção, atendimento, contratos e responsabilidades operacionais.
- Comprovar backup/restauração e plano de recuperação com os responsáveis pela infraestrutura.
- Responsável executar e aprovar sua QA das quatro personas, incluindo sessão, celular, URL direta, concorrência e erros das integrações.

Resultados de testes anteriores não validam estas novas alterações. Nenhum selo GO, segurança completa, capacidade para 100 condomínios ou prontidão comercial é concedido por este documento.
