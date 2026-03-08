

# Plano de Implementacao Completa - FitManage Pro

## Estado Atual

O app tem layout, rotas, dados Supabase e metricas cruzadas funcionando. Os gaps restantes sao: auth nao protege rotas, sidebar nao filtra por role, botoes/estados faltantes, Equipment local-only, e confirmaçoes ausentes.

---

## Fase 1: Auth Guard + Protecao de Rotas

**Problema:** Qualquer pessoa acessa `/painel` sem login. A rota `/login` existe mas nao ha redirect.

**Implementacao:**
- Criar componente `ProtectedRoute` que verifica sessao Supabase (`onAuthStateChange`)
- Se nao logado, redireciona para `/login`
- Envolver todas as rotas (exceto `/login`) com `ProtectedRoute`
- Adicionar botao de Logout no sidebar footer

**Arquivos:** `src/components/ProtectedRoute.tsx` (novo), `src/App.tsx`, `src/components/AppSidebar.tsx`

---

## Fase 2: Sidebar Filtrada por Role

**Problema:** Admin/Professor/Aluno veem o mesmo menu.

**Implementacao:**
- Usar `useCurrentUserRole()` (ja existe) no `AppSidebar`
- Cada `menuItem` ganha campo `roles: AppRole[]`
- Filtrar itens por role do usuario logado:
  - **admin**: tudo
  - **manager** (professor): Painel, Alunos, Aulas, Treinos, Avaliacoes, Experimentais, Check-in
  - **user** (aluno): Painel (versao reduzida), Treinos (seus), Agente IA
- Usar `RoleGate` (ja existe) para esconder secoes

**Arquivos:** `src/components/AppSidebar.tsx`

---

## Fase 3: Confirmacoes (AlertDialog)

**Problema:** Acoes destrutivas sem confirmacao.

**Implementacao:**
- `SupabaseStudents`: AlertDialog ao excluir aluno
- `SupabaseClasses`: AlertDialog ao cancelar aula
- `SupabasePayments`: AlertDialog ao marcar como pago
- Criar componente reutilizavel `ConfirmDialog` com props `title`, `description`, `onConfirm`, `variant`

**Arquivos:** `src/components/ConfirmDialog.tsx` (novo), `src/components/SupabaseStudents.tsx`, `src/components/SupabaseClasses.tsx`, `src/components/SupabasePayments.tsx`

---

## Fase 4: Botoes e Microestados

**Problema:** Botoes sem funcionalidade, loading states ausentes.

**Implementacao:**
- `Workouts.tsx`: botao "Novo Treino" ja faz `setActiveTab("templates")` -- OK, funcional
- `MobileHeader.tsx`: botao Bell navega para `/painel` com scroll to alerts, ou abre sheet com alertas do `useDataIntegration`
- Loading states nos botoes de submit de todos dialogs (AddStudentDialog, AddClassDialog, AddPlanDialog, etc.)

**Arquivos:** `src/components/layout/MobileHeader.tsx`, dialogs diversos

---

## Fase 5: Equipment Supabase

**Problema:** `Equipment.tsx` usa `useState` local -- dados perdem ao refresh.

**Implementacao:**
- Criar migration para tabela `equipamentos` (nome, tipo, status, data_aquisicao, custo, observacoes)
- Criar hook `useSupabaseEquipment` com CRUD
- Refatorar `Equipment.tsx` para usar o hook

**Arquivos:** Migration SQL, `src/hooks/useSupabaseEquipment.ts` (novo), `src/components/Equipment.tsx`

---

## Fase 6: Painel do Aluno (role=user)

**Problema:** Aluno nao tem visao propria.

**Implementacao:**
- Criar `PainelAluno.tsx` com: meus treinos, minhas avaliacoes, meu historico de pagamentos, solicitar treino IA
- No `Painel.tsx`, verificar role e renderizar `PainelAluno` se `role === 'user'`

**Arquivos:** `src/components/PainelAluno.tsx` (novo), `src/pages/Painel.tsx`

---

## Sequencia de Execucao

1. **Fase 1** - Auth guard (elimina acesso nao autorizado)
2. **Fase 2** - Sidebar por role (UX correto por perfil)
3. **Fase 3** - Confirmacoes (seguranca de dados)
4. **Fase 4** - Botoes/loading (polish)
5. **Fase 5** - Equipment persistido (integridade)
6. **Fase 6** - Painel aluno (feature nova)

Total: ~12 arquivos novos/editados. Implementacao incremental fase a fase.

