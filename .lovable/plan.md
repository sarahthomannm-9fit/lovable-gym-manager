# Plano — Tornar o 9FIT vendável e operacional

Consolidei os anexos (spec de 1200 linhas, HTMLs de menu/personas, dossiê SQL, skills e roadmap). Vou entregar em **3 blocos sequenciais** para você aprovar. Cada bloco fecha um "estado utilizável".

---

## BLOCO 1 — Fechar contrato (comercial) 🔴

Rotas e menu que faltam para a 9FIT vender uma assessoria.

**1.1 Reorganizar sidebar** conforme `9fit_menu_reorganizado.html`

- Renomear grupo "PRINCIPAL" → **Central de Operações**
- Nova seção **Assessoria Esportiva** (Aulas, Planos de Treino, Treinos, Avaliações, Experimentais, Coaches)
- Nova seção **Mercados** (Condomínios, Corporativo, Estúdios/Academias)
- Financeiro ganha **Contratos & Propostas** e **Planos & SKUs**
- Renomear "Funcionários" → **Coaches & Equipe**
- Remover item "Insights IA" duplicado e "Integração FitPro" (item legacy)
- Renomear "Agente IA" → **RON — Agente CEO**
- Novos itens: **Insights por Mercado**, **Relatórios Automáticos**

**1.2 `/pipeline**` — Kanban comercial (leads → prospecção/contato/proposta/negociação/fechado/perdido)

- Cards com nome, empresa+tipo, fonte, orçamento, avatar
- Drag & drop atualiza `leads.status`
- Drawer: histórico `follow_ups` + botão "Registrar follow-up" + botão "Criar proposta" (INSERT em `proposals`)
- Métricas topo: total, em negociação, fechados/mês, taxa conversão
- Modal "+ Novo Lead"

**1.3 `/clientes**` — Grid de organizações contratantes

- Cards por org: ícone por tipo, alunos ativos, MRR, inadimplentes, status saudável/atenção
- Filtros por tipo + busca
- Drawer com membros + histórico de pagamentos + "Ver como Síndico" (usa `ensureOrgForPersona`)

**1.4 `/contratos**` — 3 tabs

- Propostas (rascunho/enviada/aprovada) com "Gerar contrato" → INSERT em `propostas_b2b`
- Contratos ativos com HTML embarcado
- Histórico (recusados/expirados)

---

## BLOCO 2 — Operação (assessoria roda sozinha) 🟡

**2.1 `/planos-treino**` — Módulo hoje vazio no menu Treinos

- Lista de `planos_treino` com nível/objetivo/duração/exercícios
- Modal "+ Novo Plano" cria em `planos_treino`
- Editor `/planos-treino/:id`: busca em `exercicios_biblioteca`, adiciona em `plano_exercicios` por semana/dia, drag para reordenar
- Modal "Atribuir a aluno" → INSERT em `treinos` (trigger `fn_treino_notificar` já dispara push)

**2.2 `/coaches**` (renomeia Funcionários)

- Grid perfil: avatar, cargo, especialidades, horários, comissão
- Modal "+ Adicionar Coach" com multi-select especialidades e horários por dia
- Drawer "Ver alunos" (JOIN aulas × aulas_inscritos)
- Botão "Convidar para o sistema" via edge function (`supabase.auth.admin.inviteUserByEmail`)

**2.3 `/studio**` — Painel Estúdios/Academias

- Estrutura idêntica ao `/sindico`, tabs: Visão Geral, Alunos, Agenda, Financeiro, Falar com 9FIT
- Aba Visão Geral usa `get_alunos_sem_checkin(15, org_id)`

**2.4 Gaps das personas existentes** (do `personas_roadmap_1.html`)

- Síndico: botão "Falar com 9FIT" (ticket em `support_tickets`), "Aprovar novos moradores"
- Coach: usar `dashboard_coach()` já existente, botão "Registrar check-in" em `checkins`
- Morador: grade semanal de aulas, "Inscrever-se em aula" (INSERT `aulas_inscritos`)

---

## BLOCO 3 — Inteligência e blindagem 🟢

**3.1 `/insights**` — BI segmentado por mercado

- 4 KPIs consolidados (MRR, alunos ativos, churn, NPS estimado)
- Gráficos por mercado (condomínio/corp/estúdio) usando RPCs existentes
- Filtro de período (30d/3m/6m/12m)

**3.2 `/relatorios**` — 5 cards de relatório

- Mensal do Cliente, Inadimplência, Evolução de Alunos, Financeiro, Engajamento Corporativo
- Reusa RPCs: `relatorio_faturamento_mensal`, `relatorio_metricas_gerais`, `relatorio_inadimplencia`, `relatorio_receitas_por_plano`, `relatorio_evolucao_receitas`
- Modal "Gerar Relatório": visualizar, exportar CSV, `window.print()`

**3.3 Habilitar as skills anexadas**

- Registrar em `src/lib/agentSkills.ts` (já existe) as 7 skills: sdr-habilitor, growth-manager, finance-contabilidade, admin-rh-junior, mariana, instagram-funnel, supra
- Mapear no `AgentsHub` cada agente → skill → ação executável na edge function `agent-hub-chat`
- Adicionar ações rápidas por agente (gerar mensagem SDR usando `process_leads_v3.py` como regra, criar rascunho em `content_drafts`, classificar ticket)

**3.4 Backend — RLS + multitenancy** (dossiê `files_8.zip`)

- Migration única aplicando bloco 1 (ENABLE RLS em 20 tabelas), blocos 2–5 (policies via `has_role` e `user_has_org`), garantindo `GRANT` em todas as tabelas públicas
- Adicionar `organization_id` em `aulas` se faltar
- Semear organizações demo + vincular Rony/Sara em `organization_members`
- Migration vem via `supabase--migration` (aprovação sua) — sem tocar em `types.ts`

---

## Detalhes técnicos

- **Frontend**: React + Vite, tokens noir & gold já em `index.css` — todas as novas telas usam `bg-primary`, `text-primary`, `glass`, `gradient-gold` (sem hex hardcoded).
- **Roteamento**: registrar as 8 rotas novas em `src/App.tsx` sob `Protected`+`RoleRoute` (admin/manager para comerciais; professor+admin para /coaches, /planos-treino).
- **Data**: hooks novos em `src/hooks/` (`useLeads`, `useProposals`, `usePlanosTreino`, `useExercicios`, `useFuncionariosExt`) usando o client Supabase já existente.
- **Edge function**: expandir `agent-hub-chat` para executar ações por `skillId` com validação Zod e log em `agent_logs`.
- **Sem mexer** em `types.ts` nem em schemas Supabase reservados.

## Entrega

Vou executar por bloco, um por vez, esperando você validar antes de seguir. Sugestão: começamos pelo **Bloco 1** (pipeline + clientes + contratos + reorganização do menu) porque é o que destrava a venda amanhã.

Confirma que posso implementar o Bloco 1? coonfirmo porem preciso do bloco 2 implementada, ele é o suporte para operaçao acontecer em tempo real, me notifica o que ficar pendente. 