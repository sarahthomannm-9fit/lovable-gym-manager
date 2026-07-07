# 🔍 Auditoria de Código — 9FIT Gym Manager

**Data:** 2026-07-07  
**Repositório:** sarahthomannm-9fit/lovable-gym-manager  
**Branch:** main  
**Commit:** e3f2c6679c89923bb7905cf1efcba163217b4349

---

## 📊 Status Geral

| Bloco | Componente | Status | Notas |
|-------|-----------|--------|-------|
| **1** | `organization_members` vínculo | 🟡 **PARCIAL** | Hook importado mas não criado; `useOrgRole` não existe |
| **2** | Gate Comitê vs Síndico | 🟡 **PARCIAL** | `SindicoHome` usa `useOrgRole` com retorna `canSeeFinancials`/`canManageComunicados` — inconsistente |
| **3** | Fila IA de Treinos | ✅ **COMPLETO** | `FilaIATreinos.tsx` funcional, integrada em `Treinos.tsx` |
| **3.1** | Fila de Anamnese (Coach) | ✅ **COMPLETO** | `CoachHome.tsx` já lista anamneses pendentes (linhas 58-68) |
| **4** | Home do Morador | 🟡 **PARCIAL** | `MoradorHome.tsx` existe mas sem treino do dia; sem aba "Meu Treino" |
| **4.1** | Check-in próprio morador | 🔴 **NÃO EXISTE** | Não há botão/interface para morador fazer check-in |
| **4.2** | Evolução física (read-only) | 🔴 **NÃO EXISTE** | Não integrado a `MoradorHome` |
| **5** | Editor `plano_exercicios` | 🟡 **PARCIAL** | `PlanosTreino.tsx` mostra count mas sem editor visual |
| **6** | Página Equipe | 🔴 **NÃO EXISTE** | Redirecionamento `/coaches` → `Funcionarios` hardcoded |
| **7** | PWA instalável | ✅ **COMPLETO** | `index.html` com manifest, meta tags, ícones em `/public` |
| **8** | Central de Operações (cards) | 🟡 **PARCIAL** | `/painel` existe mas sem cards de pendências topo |

---

## 🔴 Blockers Encontrados

### 1. **Hook `useOrgRole` Faltando**
- **Problema:** `SindicoHome.tsx` linha 4 importa `useOrgRole` que **não existe**
- **Efeito:** App quebra ao render `SindicoHome`
- **Solução:** Criar `src/hooks/useOrgRole.ts` com lógica unificada

### 2. **organization_members Sem Vínculo**
- **Problema:** Ao criar aluno em `AddStudentDialog`, NÃO insere em `organization_members`
- **Efeito:** `activeOrg` fica null → todas personas renderizam "Nenhum condomínio selecionado"
- **Solução:** Modificar `AddStudentDialog` para inserir em `organization_members` após criar aluno

### 3. **Inconsistência em `useOrgRole`**
- **Problema:** `SindicoHome` esperaRetorna `{canSeeFinancials, canManageComunicados}` mas especificação pede `{isSindico, isComite, isProfessor, isAdmin}`
- **Efeito:** Nomes de função não padronizados
- **Solução:** Unificar para `{papel, isSindico, isComite, isProfessor, isAdmin}`

---

## 📋 Mapa Detalhado de Arquivos

### ✅ Já Existem (Não Tocar)
```
src/pages/Treinos.tsx ........................ Existe, com aba "Fila IA" ✓
src/components/treinos/FilaIATreinos.tsx ... Existe, workflow completo ✓
src/pages/coach/CoachHome.tsx .............. Existe, com fila anamnese ✓
src/pages/morador/MoradorHome.tsx .......... Existe, sem treino do dia
src/pages/treinos/PlanosTreino.tsx ......... Existe, sem editor visual
src/pages/Painel.tsx ........................ Existe, sem cards pendências
src/index.html ............................ Existe, com PWA meta tags ✓
src/pages/sindico/SindicoHome.tsx ......... Existe, usa `useOrgRole` (quebrado)
```

### 🟡 Parcialmente Existentes (Completar)
```
src/hooks/useOperationalContext.tsx ........ Existe, fallback admin OK
src/components/AddStudentDialog.tsx ........ Existe, SEM insert em organization_members
```

### 🔴 Não Existem (Criar)
```
src/hooks/useOrgRole.ts ..................... NÃO EXISTE — Blocker crítico
src/pages/morador/MeuTreino.tsx ............ NÃO EXISTE
src/pages/admin/VinculosOrfaos.tsx ......... NÃO EXISTE
src/pages/equipe/Equipe.tsx ................ NÃO EXISTE
public/icon-192.png ......................... NÃO EXISTE
public/icon-512.png ......................... NÃO EXISTE
public/manifest.json ........................ NÃO EXISTE (ou está vazio)
```

---

## 🎯 Sequência de Execução Recomendada

### **PRIORIDADE 1 — Blockers (sem isso nada funciona)**

**1.1 — Criar `src/hooks/useOrgRole.ts`**
```
- Usa supabase.from('organization_members').select().eq('user_id', user.id).eq('organization_id', activeOrg.id)
- Retorna { papel, isSindico, isComite, isProfessor, isAdmin, loading }
- Integra com useOperationalContext() para activeOrg.id
- Tempo: ~15min
```

**1.2 — Corrigir `AddStudentDialog.tsx`**
```
- Após insert em alunos, fazer insert em organization_members
- Usar { user_id: ?, organization_id: activeOrg.id, papel: 'user' }
- Teste: criar aluno → verificar organization_members
- Tempo: ~10min
```

**1.3 — Criar `/admin/vinculos-orfaos`**
```
- Query: user_roles SEM linha correspondente em organization_members
- Renderizar lista com dropdown org + papel + botão "Vincular"
- Teste: criar usuário manual → vincular aqui
- Tempo: ~30min
```

### **PRIORIDADE 2 — Experiência do Morador (alto impacto)**

**2.1 — Reescrever `MoradorHome.tsx`**
```
- Trocar de telas por abas simples
- "Hoje" tab com saudação + 3-4 ações grandes
- Botão "Começar treino" → navega para /morador/treino
- Seção evolução read-only
- Tempo: ~40min
```

**2.2 — Criar `/morador/treino` (MeuTreino.tsx)**
```
- Busca treino ativo do aluno
- Lista exercícios do dia
- Botão "Concluir treino" → insert treino_execucoes
- Check-in próprio → insert checkins
- Tempo: ~50min
```

### **PRIORIDADE 3 — Operacional (suporte)**

**3.1 — Editor visual de exercícios**
```
- Modal em PlanosTreino.tsx
- Lista plano_exercicios com join exercicios_biblioteca
- Drag/reorder, edit serie/reps/carga
- Tempo: ~60min
```

**3.2 — Página Equipe**
```
- Grid de coaches com filtros
- Modal add/edit
- Drawer de detalhes com alunos atendidos
- Tempo: ~90min
```

**3.3 — Cards de pendências em /painel**
```
- 4 cards: Fila IA, Anamneses, Avaliações vencidas, Sem frequência
- Clicáveis para filtro nas telas respectivas
- Tempo: ~30min
```

---

## 🧪 Testes de Validação

### Checklist Pré-Deploy

- [ ] Criar aluno → verificar `organization_members` tem linha nova
- [ ] Admin acessa `/select-context` → vê todas organizations
- [ ] Síndico login → vê /sindico com financeiros visíveis
- [ ] Comitê login → financeiros **ocultos**, apenas "Ocupação" e "Status"
- [ ] Coach vê fila IA com count correto
- [ ] Morador clica "Começar treino" → vai para `/morador/treino`
- [ ] Morador faz check-in pelo app → insert em `checkins`
- [ ] App instalável no mobile (PWA detector)

---

## 📊 Schema — Confirmação Necessária

**Antes de codificar o Bloco 1.3, confirme colunas reais:**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='organization_members';

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='treinos_ia_fila';

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='plano_exercicios';
```

**Resultado esperado:**
- `organization_members`: id, user_id, organization_id, papel, created_at
- `treinos_ia_fila`: id, aluno_id, sugestao (jsonb), status, created_at, ...
- `plano_exercicios`: id, plano_treino_id, exercicio_id, series, repeticoes, carga_kg, descanso_seg, ...

---

## 📝 Resumo de Tarefas

| # | Tarefa | Arquivo | Tempo | Status |
|---|--------|---------|-------|--------|
| 1 | Criar `useOrgRole.ts` | src/hooks/ | 15m | 🔴 Blocker |
| 2 | Corrigir `AddStudentDialog` | src/components/ | 10m | 🔴 Blocker |
| 3 | Criar `VinculosOrfaos.tsx` | src/pages/admin/ | 30m | 🔴 Blocker |
| 4 | Reescrever `MoradorHome` | src/pages/morador/ | 40m | 🟡 Alto impacto |
| 5 | Criar `MeuTreino.tsx` | src/pages/morador/ | 50m | 🟡 Alto impacto |
| 6 | Editor `plano_exercicios` | src/pages/treinos/ | 60m | 🟡 Suporte |
| 7 | Página `Equipe.tsx` | src/pages/equipe/ | 90m | 🟡 Suporte |
| 8 | Cards `/painel` | src/pages/ | 30m | 🟡 Dashboard |
| **TOTAL** | | | **~325 min** | **~5.4h** |

---

## 🚀 Próximos Passos

1. ✅ **Confirmação do schema** (você roda as 3 queries acima)
2. ✅ **Iniciar Bloco 1** (useOrgRole + AddStudentDialog + VinculosOrfaos)
3. ⏳ **Paralelizar Blocos 2-3** enquanto Bloco 1 estabiliza
4. ✅ **Deploy em staging** após todos os 8 blocos

---

**Relatório preparado por:** GitHub Copilot (@copilot)  
**Próxima ação:** Aguardando confirmação de schema + início Bloco 1
