

# Auditoria Completa: FitManage Pro

## 1. ERROS ATUAIS (Runtime)

### 1A. `useSmartAlerts` - metrics undefined
**Status:** Corrigido na ultima iteracao. O guard `if (!metrics) return []` ja foi adicionado. Porem `DataIntegrationProvider` tipou `metrics: CrossMetrics` (nao `| undefined`) na interface `IntegratedData` (linha 36). O `useCrossMetrics` sempre retorna um objeto, entao nao deveria ser `undefined` -- mas durante a montagem inicial o valor pode ser calculado com arrays vazios. Verificar se o erro persiste.

### 1B. Double Sidebar / Double Layout
**Critico.** `App.tsx` envolve TODAS as rotas em `MainLayout` (que renderiza `SidebarProvider + AppSidebar`). Mas 9 paginas de marketing + AgenteIA usam `ResponsiveLayout` internamente (que TAMBEM renderiza `SidebarProvider + AppSidebar`). Resultado: **sidebar duplicada** nessas paginas.

**Paginas afetadas (9):**
- `marketing/Campanhas.tsx`
- `marketing/Captacao.tsx`
- `marketing/Comunicacao.tsx`
- `marketing/Conversao.tsx`
- `marketing/Funis.tsx`
- `marketing/EmailMarketing.tsx`
- `marketing/Promocoes.tsx`
- `marketing/Automacao.tsx`
- `AgenteIA.tsx`

**Fix:** Remover `ResponsiveLayout` wrapper dessas paginas. O conteudo ja esta dentro de `MainLayout` via `App.tsx`.

---

## 2. TELAS NAO EXISTENTES / ROTAS FANTASMA

Nenhuma rota aponta para componente inexistente -- todas as rotas em `App.tsx` importam componentes validos. Porem:

- **Nao ha rota `/marketing/insights-ia`** no sidebar, mas a rota existe em App.tsx -- OK.
- **Rota `/9fit` nao expande sub-dashboards** no sidebar -- usuario ve apenas "Dashboard 9FIT" sem acesso direto a CEO, Consultoria, etc. Os sub-dashboards tem rotas (`/9fit/ceo`, etc.) mas nao aparecem no menu.

---

## 3. ROTAS/LAYOUT DUPLICADOS

| Problema | Detalhes |
|----------|----------|
| Double sidebar | 9 paginas marketing + AgenteIA (ver acima) |
| `activeView` + `onViewChange` props inuteis | `AppSidebar` recebe `activeView` e `onViewChange` mas usa `location.pathname` para highlight e `navigate()` para routing -- as props sao ignoradas |

---

## 4. BOTOES INFUNCIONAIS / FALTANTES / REDUNDANCIAS

| Local | Problema |
|-------|---------|
| `Workouts.tsx` | Botao "Novo Treino" no header sem `onClick` handler |
| `Equipment.tsx` | Funcionalidade local-only (sem tabela Supabase) -- dados somem ao refresh |
| `MobileHeader.tsx` | Botao de notificacao (Bell) sem acao |
| `Painel.tsx` | Alerta cards sem `onClick` para navegar ate a rota indicada |
| `SupabaseClasses.tsx` | `ClassCalendar` e `MultiDayScheduler` nao recebem dados reais das aulas |
| `Dashboard.tsx` (tab no Painel) | Potencialmente usando dados mock -- verificar |

---

## 5. ESTADOS E MICROESTADOS FALTANTES

| Tela | Faltante |
|------|----------|
| `SupabaseStudents` | Sem confirmacao ao excluir aluno |
| `SupabaseClasses` | Sem confirmacao ao cancelar aula |
| `SupabasePayments` | Sem confirmacao ao marcar como pago |
| `AulasExperimentais` | Status transitions sem confirmacao (ex: marcar como faltou) |
| `Campanhas` | Sem confirmacao ao pausar/finalizar campanha |
| Todos os dialogs | Nao mostram loading state no botao submit (exceto conversao) |

---

## 6. FLUXO DE INFORMACAO INCORRETO

| Fluxo | Problema |
|-------|---------|
| Painel → Alertas | Alertas nao sao clicaveis (tem `rota` mas nenhum `onClick`) |
| Equipment | Dados 100% locais, sem persistencia |
| `ClassCalendar` | Nao recebe `classes` do contexto -- renderiza independente |
| `MultiDayScheduler` | Mesmo problema -- nao conectado ao data source |
| Marketing pages | `ResponsiveLayout` duplica data fetching (cada pagina marketing tem providers proprios + o provider global) |

---

## 7. PERMISSOES (ADMIN / PROFESSOR / ALUNO)

**Estado atual:** Zero controle de acesso no frontend. Todas as rotas sao publicas. A tabela `user_roles` existe com enum `app_role` (admin, manager, user) e funcoes `has_role`/`is_admin`, mas:

- Nenhuma pagina verifica role do usuario
- Nenhuma rota protegida
- Nenhum login/auth obrigatorio
- Sidebar mostra TUDO para todos

### Modelo de Permissoes Proposto

```text
ADMIN (owner/gestor)
├── Tudo: alunos, planos, pagamentos, aulas, marketing, relatorios, 9FIT, config
├── CRUD completo
└── Gerar cobranças em lote, excluir dados

PROFESSOR (coach/personal)
├── Ver: alunos (seus), aulas (suas), treinos, avaliacoes
├── Criar: treinos, avaliacoes fisicas, checkins
├── Editar: treinos proprios, status aulas proprias
└── NAO ve: pagamentos, relatorios financeiros, marketing, 9FIT

ALUNO (end-user / futuro app)
├── Ver: seus treinos, suas avaliacoes, seu perfil, seu historico
├── Criar: solicitacao de treino via IA
└── NAO ve: nada administrativo
```

---

## PLANO DE IMPLEMENTACAO

### Fase A: Fix Layout Duplicado (critico)
- Remover `ResponsiveLayout` das 9 paginas marketing + AgenteIA
- Cada pagina passa a renderizar apenas seu conteudo (ja esta dentro de `MainLayout` via App.tsx)
- Remover props inuteis `activeView`/`onViewChange` do `AppSidebar`

### Fase B: Sidebar + Navegacao
- Expandir sub-dashboards 9FIT no sidebar (CEO, Consultoria, etc.)
- Adicionar badge de alertas no sidebar (usando `useDataIntegration`)
- Tornar alertas do Painel clicaveis (`onClick={() => navigate(alert.rota)}`)

### Fase C: Botoes e Microestados
- Fix botao "Novo Treino" em `Workouts.tsx`
- Fix botao Bell em `MobileHeader.tsx`
- Adicionar `AlertDialog` de confirmacao para: excluir aluno, cancelar aula, marcar pago, pausar campanha
- Loading states em todos os botoes de submit

### Fase D: Fluxo de Dados
- Conectar `ClassCalendar` e `MultiDayScheduler` aos dados reais do contexto
- Equipment: criar tabela `equipamentos` no Supabase ou deixar explicito que e local-only

### Fase E: Auth + Permissoes
- Implementar tela de Login/Signup
- Criar hook `useCurrentUserRole()` que busca role do usuario logado via `user_roles`
- Criar componente `<RoleGate role="admin">` que condiciona renderizacao
- Filtrar sidebar por role
- Proteger rotas com redirect para login
- Professor: filtrar dados por `professor_id` ou `atendido_por`

### Sequencia de Execucao
1. **Fase A** (layout) -- elimina bugs visuais imediatos
2. **Fase C** (botoes/microestados) -- melhora UX
3. **Fase B** (sidebar) -- navegacao completa
4. **Fase D** (fluxo dados) -- integridade
5. **Fase E** (auth/permissoes) -- seguranca

### Arquivos a Atualizar

| Arquivo | Mudanca |
|---------|---------|
| 9 paginas marketing + AgenteIA | Remover `ResponsiveLayout` wrapper |
| `AppSidebar.tsx` | Expandir 9FIT sub-menu, badge alertas, remover props inuteis |
| `App.tsx` | Simplificar `MainLayout` props |
| `Painel.tsx` | Alertas clicaveis |
| `Workouts.tsx` | Fix botao "Novo Treino" |
| `MobileHeader.tsx` | Fix botao notificacao |
| `SupabaseStudents.tsx` | AlertDialog excluir |
| `SupabaseClasses.tsx` | AlertDialog cancelar |
| `SupabasePayments.tsx` | AlertDialog marcar pago |
| Nova: `src/hooks/useCurrentUserRole.ts` | Hook de role |
| Nova: `src/components/RoleGate.tsx` | Componente de permissao |
| Nova: `src/pages/Login.tsx` | Tela de autenticacao |

