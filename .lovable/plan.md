

# Plano de Evolucao: Gym Manager → Control Plane 9FIT (Versao Lancamento Brasil)

## Analise do Estado Atual vs Visao

O projeto ja tem uma base solida: ~40 tabelas Supabase, cross-metrics, smart alerts, CRM basico (leads), marketing, financeiro, 9FIT OS dashboards, equipment, treinos, avaliacoes. O gap principal esta em 3 areas: **modelo de dados incompleto** (falta SKU/entitlements/eventos/lifecycle da pessoa), **UX executiva** (painel nao e orientado a acao), e **multi-tenancy** (inexistente).

---

## Fase 1: Identidade Central da Pessoa (Lifecycle)

**Problema:** Tabela `alunos` tem campo `status` VARCHAR sem estados padronizados. Nao existe conceito de "pessoa unica" que transita entre lead → experimental → aluno → ex-aluno.

**Implementacao:**
- Criar enum `pessoa_status` com os 7 estados: `lead`, `lead_aquecido`, `experimental`, `ativo`, `recorrente`, `inativo`, `ex_aluno`
- Migration: adicionar coluna `lifecycle_status` na tabela `alunos` (default `ativo` para dados existentes)
- Criar tabela `pessoa_eventos` (pessoa_id, tipo_evento, dados, created_at) para historico completo
- Unificar `leads` e `alunos` via campo `lead_id` em `alunos` (preserva dados existentes)
- Atualizar `StudentProfile` para mostrar timeline de lifecycle

**Arquivos:** Migration SQL, `src/hooks/useSupabaseStudents.ts`, `src/components/StudentProfile.tsx`

---

## Fase 2: Catalogo Mestre (SKUs)

**Problema:** Tabela `planos` e limitada (nome, preco, duracao). Nao existe conceito de SKU que abranja todos os produtos vendiveis (PrimePass, Consultoria, Academy, Ebooks, Loja).

**Implementacao:**
- Criar tabela `skus` (id, nome, tipo enum[plano, consultoria, programa, produto_digital, produto_fisico, academy], preco, recorrencia enum[mensal, trimestral, semestral, anual, unico], capacidade, entregas jsonb, beneficios jsonb, modulos_liberados text[], ativo, created_at)
- Migrar dados existentes de `planos` para `skus` (manter `planos` como view ou alias)
- Criar UI de gestao de SKUs (nova pagina `/catalogo`)
- Atualizar sidebar com novo item "Catalogo"

**Arquivos:** Migration SQL, `src/pages/Catalogo.tsx` (novo), `src/hooks/useSupabaseSKUs.ts` (novo), `src/components/AppSidebar.tsx`

---

## Fase 3: Entitlements (Controle de Acesso por Produto)

**Problema:** Nao existe controle do que cada aluno pode acessar baseado no plano contratado.

**Implementacao:**
- Criar tabela `entitlements` (id, aluno_id, sku_id, status enum[ativo, suspenso, expirado], data_inicio, data_fim, created_at)
- Criar tabela `sku_permissions` (sku_id, modulo text, nivel_acesso text) -- define o que cada SKU libera
- Criar hook `useEntitlements(alunoId)` que retorna modulos acessiveis
- Integrar com sistema de pagamentos: pagamento vencido → suspender entitlement
- Adicionar aba "Acessos" no StudentProfile

**Arquivos:** Migration SQL, `src/hooks/useEntitlements.ts` (novo), `src/components/StudentProfile.tsx`

---

## Fase 4: Sistema de Eventos

**Problema:** Nao existe event log centralizado. Cada modulo opera isolado.

**Implementacao:**
- Criar tabela `system_events` (id, entity_type, entity_id, event_type, actor_id, metadata jsonb, created_at)
- Event types: `payment.created`, `payment.paid`, `payment.overdue`, `checkin.in`, `checkin.out`, `training.updated`, `training.expired`, `assessment.completed`, `lead.advanced`, `entitlement.activated`, `entitlement.suspended`
- Criar triggers SQL que emitem eventos automaticamente em `pagamentos`, `checkins`, `treinos`, `avaliacoes_fisicas`
- Criar hook `useSystemEvents(filters)` para consumir
- Dashboard de eventos recentes no Painel

**Arquivos:** Migration SQL (tabela + triggers), `src/hooks/useSystemEvents.ts` (novo), `src/pages/Painel.tsx`

---

## Fase 5: Painel Executivo Redesenhado

**Problema:** Painel atual e informativo mas nao orientado a acao. Faltam MRR, Churn rate, LTV como KPIs primarios.

**Implementacao:**
- Redesenhar header do Painel com 6 KPIs executivos: MRR, Churn %, Conversao %, Alunos Ativos, Inadimplencia R$, LTV medio
- Adicionar secao "Acoes Pendentes" (alertas agrupados por categoria com botao de acao direta)
- Adicionar mini-timeline de eventos recentes (ultimos 20 eventos do `system_events`)
- Manter tabs existentes (Dashboard, Insights, Financeiro, Integracao)

**Arquivos:** `src/pages/Painel.tsx`, `src/hooks/useCrossMetrics.ts` (adicionar MRR calculado)

---

## Fase 6: CRM Pipeline Visual

**Problema:** CRM atual (Captacao) e basico. Nao tem pipeline visual nem tarefas comerciais.

**Implementacao:**
- Criar pagina `/crm` com pipeline Kanban: Lead → Qualificado → Experimental → Negociacao → Convertido
- Criar tabela `crm_tasks` (id, lead_id, titulo, descricao, tipo, data_vencimento, status, responsavel_id, created_at)
- Drag-and-drop de cards entre colunas (usando estado local, salvando no Supabase)
- Historico de interacoes por lead (usando `system_events`)
- Integrar com `aulas_experimentais` -- experimental agendada aparece automaticamente no pipeline

**Arquivos:** `src/pages/CRM.tsx` (novo), `src/hooks/useCRMPipeline.ts` (novo), Migration SQL

---

## Fase 7: Painel do Profissional (Coach View)

**Problema:** Professor nao tem visao propria orientada a acao.

**Implementacao:**
- Criar pagina `/coach` com fila de alunos prioritarios
- Prioridades: alunos sem check-in 7+ dias, treino vencido, avaliacao pendente, observacoes medicas
- Cards de acao rapida: "Atualizar treino", "Agendar avaliacao", "Enviar mensagem"
- Filtrar dados por `atendido_por` ou `professor_id` do funcionario logado
- Adicionar rota no sidebar para role `manager`

**Arquivos:** `src/pages/CoachDashboard.tsx` (novo), `src/components/AppSidebar.tsx`, `src/App.tsx`

---

## Fase 8: Campanhas Segmentadas Automaticas

**Problema:** Campanhas existem mas sem segmentos automaticos (inativos, inadimplentes, treino vencido).

**Implementacao:**
- Criar tabela `segmentos` (id, nome, regras jsonb, auto boolean, created_at)
- Segmentos automaticos pre-configurados: Inativos 15d, Inadimplentes, Treino Vencido, Leads Parados, Aniversariantes
- Engine de segmentacao que cruza `alunos` + `checkins` + `pagamentos` + `treinos` para gerar listas
- UI de selecao de segmento ao criar campanha
- Contagem de destinatarios em tempo real

**Arquivos:** Migration SQL, `src/hooks/useSegmentos.ts` (novo), `src/pages/marketing/Campanhas.tsx`

---

## Fase 9: Multi-Tenancy (White Label)

**Problema:** Sistema e single-tenant. Nao suporta multiplas organizacoes.

**Implementacao:**
- Criar tabela `organizations` (id, nome, slug, logo_url, cores jsonb, created_at)
- Criar tabela `org_members` (id, org_id, user_id, role enum[owner, admin, coach, sales, finance], created_at)
- Adicionar `org_id` em TODAS as tabelas de dados (alunos, pagamentos, aulas, etc.)
- RLS policies: cada query filtra por org_id do usuario logado
- Criar `OrgProvider` context que injeta org_id em todas as queries
- Branding: sidebar header mostra logo/nome da organizacao

**Nota:** Esta fase e a mais complexa e deve ser a ultima. Requer migration cuidadosa para adicionar `org_id` com default para dados existentes.

**Arquivos:** Migrations SQL (multiplas), `src/contexts/OrgContext.tsx` (novo), RLS policies, todos os hooks de dados

---

## Fase 10: Roles Granulares (5 papeis)

**Problema:** Sistema tem 3 roles (admin, manager, user). Visao exige 5 (owner, admin, coach, sales, finance).

**Implementacao:**
- Alterar enum `app_role` para incluir: `owner`, `admin`, `coach`, `sales`, `finance`
- Atualizar `AppSidebar.tsx` com permissoes granulares por role
- Sales: ve CRM, Campanhas, Leads. Nao ve financeiro.
- Finance: ve Pagamentos, Relatorios, Cobrancas. Nao ve treinos.
- Coach: ve Alunos (seus), Treinos, Avaliacoes, Aulas.
- Owner/Admin: tudo.

**Arquivos:** Migration SQL (alter enum), `src/hooks/useCurrentUserRole.ts`, `src/components/AppSidebar.tsx`, `src/components/RoleGate.tsx`

---

## Sequencia de Execucao

```text
Fase 1  Lifecycle da Pessoa       ← fundacao de dados
Fase 2  Catalogo SKUs             ← fundacao comercial
Fase 3  Entitlements              ← depende de 1+2
Fase 4  Sistema de Eventos        ← infraestrutura
Fase 5  Painel Executivo          ← depende de 4
Fase 6  CRM Pipeline              ← depende de 1+4
Fase 7  Coach Dashboard           ← depende de 1
Fase 8  Campanhas Segmentadas     ← depende de 1+4
Fase 9  Multi-Tenancy             ← ultima (mais invasiva)
Fase 10 Roles Granulares          ← depende de 9
```

## Estimativa de Impacto

| Fase | Arquivos Novos | Arquivos Editados | Migrations |
|------|---------------|-------------------|------------|
| 1 | 0 | 3 | 1 |
| 2 | 2 | 2 | 1 |
| 3 | 1 | 1 | 1 |
| 4 | 1 | 1 | 1 (com triggers) |
| 5 | 0 | 2 | 0 |
| 6 | 2 | 1 | 1 |
| 7 | 1 | 2 | 0 |
| 8 | 1 | 1 | 1 |
| 9 | 1 | 15+ | 3+ |
| 10 | 0 | 4 | 1 |

**Total estimado:** ~10 arquivos novos, ~30 edicoes, ~10 migrations.

Recomendo implementar fases 1-5 primeiro (fundacao), depois 6-8 (features), e 9-10 por ultimo (infraestrutura multi-tenant).

