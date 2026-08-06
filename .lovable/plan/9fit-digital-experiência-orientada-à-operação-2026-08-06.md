# 9FIT Digital — Experiência orientada à operação

Evolução da plataforma atual (sem novo sistema, sem mudança de schema): navegação por áreas de negócio, Home única por persona, dashboards como centro de decisão alimentados pelas RPCs oficiais, e estados de carregamento/erro padronizados.

## Auditoria (verificada agora)

- **Organizações**: 4 ativas, sem duplicidade — Central Park (condominio, 7 alunos), TechCorp (corporate), Studio Personal 9FIT (professor), Studio Premium SP (studio).
- **Vínculos**: Sara tem `admin` e `sindico` no Central Park (papel duplicado). Rony tem manager/sindico/professor/corporate.
- **RPCs prontas e subutilizadas**: `dashboard_sindico`, `dashboard_coach`, `dashboard_morador`, `calcular_mrr`, `get_alunos_sem_checkin`, além dos relatórios financeiros. Hoje só `StudioHome` chama RPC; Síndico, Coach, Morador e Corporativo montam indicadores com consultas soltas.
- **Reutilizar**: `PersonaLayout`, `PersonaEmptyState`, `PageShell`, cards do War Room (`MetCard`, `ActionCard`, `SecHead`, `StatusBadge`, `DataTable`), `useOperationalContext`, `useDataIntegration`, `useSmartAlerts`, `agentSkills`.
- **Refatorar**: `AppSidebar`, os 4 painéis de persona, `PersonaLayout` (seletor de contexto).
- **Criar**: `HomeInteligente`, `/mercados/:tipo`, `/relatorios/automaticos`, hook `usePersonaDashboard`, componentes `DashboardSection`, `QuickActions`, `AIAdvisorCard`, `DashboardState` (skeleton/erro/vazio/retry).
- **Remover**: apenas do menu — Insights IA (Marketing) e Integração FitPro; as rotas continuam ativas.

## Fase 1 — Limpeza

Uma migração única: remover o vínculo `sindico` da Sara no Central Park (ela já é admin lá). Nenhuma alteração de schema, tabela ou RPC.

## Fase 2 — Navegação

**Sidebar reorganizada por áreas de negócio:**

- **Central de Operações** (renomeia Control Plane): Visão Geral, Pipeline Comercial, Clientes Ativos, Alunos, Check-in, Agenda.
- **Assessoria Esportiva**: Treinos, Planos de treino, Avaliações físicas, Aulas, Aulas experimentais, Coaches.
- **Mercados** (novo): Condomínios, Corporativo, Academias/Studios, Professores.
- **Financeiro**: mantém tudo + Contratos & Propostas.
- **Marketing & Captação**: mantém, sem Insights IA.
- **Centro de Inteligência** (renomeia Hub IA): Hub de Agentes, RON • Agente CEO, Insights de Mercado, Plano CFO, Relatórios Automáticos.
- **Administração**: Usuários, Organizações, Produtos & Equipamentos. FitPro sai do menu.

**Seletor de contexto no topo** (estilo Notion), dentro do `PersonaLayout` e do cabeçalho do app: Usuário → Organização → Persona, troca imediata sem logout, reaproveitando `useOperationalContext.setActiveOrg` e as rotas de persona já existentes.

## Fase 3 — Home única

Nova `/home` (e redirecionamento pós-login) que se adapta a persona + organização:

- Saudação contextual e resumo do dia (alunos ativos, check-ins, aulas, faturamento, pendências).
- Bloco de alertas e pendências (reaproveita `useSmartAlerts` / `DataIntegrationProvider`).
- Bloco de IA consultiva com frases acionáveis ("3 avaliações pendentes — concluir agora?").
- Ações rápidas por persona (Novo aluno, Nova aula, Avaliação, Comunicado, Relatórios).

Rotas atuais (`/painel`, `/sindico`, `/coach`, `/corp`, `/morador`) permanecem funcionando.

## Fase 4 — Dashboards como centro de decisão

Todos os indicadores principais passam a vir de RPC via um hook único `usePersonaDashboard(persona, id)`; consultas diretas ficam só para listas, histórico e ações.

- **Síndico** (`dashboard_sindico`): resumo executivo (moradores, ativos, adesão, check-ins, receita, crescimento), saúde (frequência, inativos, risco de evasão, aulas/horários mais procurados), financeiro (previsto, recebido, inadimplência, contratos), gestão (avaliações pendentes, experimentais, chamados, comunicados), IA e ações rápidas.
- **Coach** (`dashboard_coach`): meus atletas, agenda do dia, performance e aderência, atletas sem treino atualizado e em risco, fila IA de treinos, ações rápidas (prescrever treino, avaliação, mensagem).
- **Corporativo** (`dashboard_sindico` da org corporativa): colaboradores, participação, engajamento por setor, ranking de equipes, receita contratada e contratos, campanhas internas.
- **Morador** (`dashboard_morador`): Hoje (treino, próxima aula, check-in, próxima avaliação), evolução (peso, composição, frequência, consistência), metas e conquistas, conteúdo/protocolos, IA como treinador pessoal, ações rápidas.
- **Gestor 9FIT** (`/painel` + `calcular_mrr`): operação, comercial, financeiro, produtos e inteligência — mantendo o Control Plane atual como base.

**Padrão obrigatório** em todos: cabeçalho executivo, KPIs, comparativos, alertas, insights de IA, pendências, agenda, ações rápidas, feed recente, skeleton, empty state, error state com retry e refresh. Nenhuma tela pode ficar presa em "Carregando".

## Fase 5 — Telas novas

- `/mercados/:tipo` — KPIs do mercado, lista de organizações com receita, alunos ativos, adesão, ranking/crescimento, alertas e oportunidades; atalho para o painel da persona correspondente. Tipos mapeados ao enum atual: condominio, corporate, studio, professor.
- `/relatorios/automaticos` — leitura de `agent_reports` com filtro por agente e período, histórico, geração sob demanda (edge function de agentes já existente) e download CSV.

## Fase 6 — Validação autenticada

Fluxo real no preview com evidências: Login → Home → /painel → /sindico → /coach → /corp → /morador → troca de contexto. Verificação de console, network, chamadas de RPC, escrita no banco (check-in, chamado, aprovação de treino), estados vazios e responsividade, com screenshots.

## Detalhes técnicos

- Arquivos principais: `src/components/AppSidebar.tsx`, `src/App.tsx`, `src/layouts/PersonaLayout.tsx`, `src/pages/Home.tsx` (novo), os 4 `*Home.tsx` de persona, `src/pages/mercados/MercadoLista.tsx`, `src/pages/relatorios/RelatoriosAutomaticos.tsx`, `src/hooks/usePersonaDashboard.ts`, `src/components/dashboard/*`.
- Sem alteração de schema, sem novas tabelas, sem novas RPCs, sem tocar em `types.ts`. Nenhuma rota existente é removida.
- Entrega incremental nesta ordem: limpeza → navegação e seletor de contexto → dashboards por RPC → Home → telas novas → validação.
