
# Fechamento de esteira 9FIT — Plano de execução

Objetivo: destravar personas, ligar a esteira **Anamnese → IA → Coach aprova → Morador executa**, entregar Home do morador simples, PWA instalável e página de Equipe. Zero recriação de tabelas — só conectar frontend ao schema existente.

## Ordem de execução (bloqueante → alto impacto)

```
1. Fix vínculo organization_members (destrava todas personas)
2. useOrgRole + gate Comitê vs Síndico
3. Fila IA de treinos no CoachHome / página Treinos
4. Home do Morador ("Hoje") + Meu Treino + check-in próprio
5. Editor de plano_exercicios + biblioteca de exercícios
6. Página Equipe (rename Funcionários → Coaches)
7. PWA instalável (manifest + ícones + meta tags)
8. Central de Operações: cards de pendências
```

## 1. Vínculo organization_members (bloqueante)

**Problema**: usuários criados sem linha em `organization_members` → `activeOrg` fica null → todas telas de persona mostram "Nenhum condomínio selecionado".

**Ações**:
- `AddStudentDialog` e criação em `/admin/usuarios`: após inserir aluno/usuário, inserir também em `organization_members (user_id, organization_id, papel)` usando `activeOrg.id` do contexto.
- Nova tela `/admin/vinculos-orfaos`: lista `user_roles` sem `organization_members` correspondente, com dropdown de org + papel e botão "Vincular".
- `useOperationalContext`: se `isAdmin && !activeOrg && memberships.length===0`, buscar todas `organizations` e mostrar em `/select-context` (fallback admin).
- Trigger opcional em `handle_new_user` fica de fora — vínculo é decisão de negócio.

## 2. Hook `useOrgRole` + gate Comitê

Novo `src/hooks/useOrgRole.ts`:
```ts
{ papel, isSindico, isComite, isProfessor, isAdmin }
```
Lê `organization_members` filtrado por `user_id` + `activeOrg.id`.

Em `SindicoHome.tsx`:
- `isComite`: esconder abas **Contrato**, **Financeiro**; esconder cards de Receita/Inadimplência (valor); comunicados read-only (sem "+ Novo"); sem botão "Aprovar Moradores".
- `isSindico || isAdmin`: acesso total.
- Papel não permitido → `<Navigate to="/morador">`.

## 3. Fila IA de Treinos (o diferencial)

Assumindo tabela `treinos_ia_fila` existe (usuário afirma). Se não existir, migração mínima com colunas: `id, aluno_id, anamnese_id, sugestao jsonb, status ('pendente'|'aprovado'|'rejeitado'), created_at`.

**Página Treinos** — nova aba **"Fila IA"** (destaque visual gold):
- Cards por aluno: nome, objetivo, nível, resumo dias.
- Botões: **✅ Aprovar e Enviar** / **✏️ Ver detalhes** (drawer com exercícios editáveis).

**Ao aprovar** (transação client-side sequencial):
1. `insert planos_treino` (nome, objetivo, nível, dias/semana).
2. `insert plano_exercicios[]` a partir de `sugestao.exercicios`.
3. `insert treinos (aluno_id, plano_treino_id, data_inicio, data_fim)`.
4. `update treinos_ia_fila set status='aprovado'`.
5. `criar_notificacao` para aluno.

**Fila de anamnese pendente** (2.1 do spec): aba no `CoachHome` listando `anamnese_respostas.status='preenchido'` sem `treinos.data_fim >= hoje`.

## 4. Home do Morador ("Hoje") + Meu Treino

Reescrever `MoradorHome.tsx` com filosofia **acessibilidade sênior** (fonte grande, contraste, poucos elementos):

**Seções**:
- **Saudação**: "Bom dia, [Nome] 🌷" + dia/data pt-BR.
- **Hoje você pode...**: 3-4 cards grandes (treino do dia, aula de hoje, avaliação pendente, hidratação). Botão largo "Começar treino".
- **Próximas atividades do condomínio**: 1-2 aulas com nome + horário + local.
- **Rodapé motivacional leve**: contagem simples ("Você treinou 3 vezes essa semana").

**Meu Treino** (nova aba/rota `/morador/treino`):
- Busca `treinos` com `data_fim >= hoje` do aluno, join `plano_exercicios` + `exercicios_biblioteca` (nome, video_url, grupo_muscular).
- Calcula dia atual via `dia_semana` + semana desde `data_inicio`.
- Lista exercícios com série/reps/carga/descanso.
- **Botão "Concluir treino"** → insert em `treino_execucoes {treino_id, aluno_id, data_execucao, concluido:true, humor}`.

**Check-in próprio**: botão "Fazer check-in" → insert em `checkins` (fonte de verdade — `frequencia_alunos` é populada por trigger existente `fn_checkin_registrar`).

**Evolução física read-only**: seção "Minha evolução" lendo `avaliacoes_fisicas` do aluno (peso, IMC, circunferências — gráfico simples).

## 5. Editor de plano_exercicios + biblioteca

`PlanosTreino.tsx` — ao abrir plano, drawer/tela com:
- Lista `plano_exercicios` (filtro `plano_treino_id`) agrupada por `semana`/`dia_semana`, ordenada por `ordem`.
- Modal "Adicionar exercício": busca em `exercicios_biblioteca` (por nome/grupo muscular/dificuldade), preview de vídeo.
- Campos editáveis: `series`, `repeticoes`, `carga_kg`, `descanso_seg`, `observacoes`.
- Remover exercício com confirmação.

`Treinos.tsx` vira aba "Visão de vencimento" dentro de `PlanosTreino` (não rota separada) — decisão técnica; se quebrar links, deixar rota como redirect.

## 6. Página Equipe (rename Funcionários)

Rota `/equipe` (manter `/funcionarios` como alias/redirect). Movida para seção **Operação** no sidebar.

- **Grid/tabela**: avatar, nome, cargo, especialidades (tags), status, comissão.
- Filtros: cargo, status, busca por nome.
- **Modal add/edit**: nome, email, telefone, cargo (select), especialidades (multi-tag), disponibilidade (JSON dia→horários), comissão %, observações.
- **Drawer detalhes**: infos + "Ver alunos atendidos" (join `aulas` → `aulas_inscritos` → `alunos` por `professor_id`).
- Ações: **Convidar** (chama edge function `manage-users` com `inviteUserByEmail`), ativar/desativar, editar.
- React Query, respeita `activeOrg.id`, design noir+gold, badges coloridos, empty states.

## 7. PWA instalável

- `public/manifest.json`: nome "9FIT — Assessoria Esportiva", theme `#0a0a0a`, display `standalone`, ícones 192/512 + maskable.
- Gerar `icon-192.png` e `icon-512.png` com logo 9FIT em fundo escuro (`imagegen premium.gpt`, transparent=false, salvar em `public/`).
- `index.html` `<head>`: link manifest, apple-touch-icon, apple-mobile-web-app-capable, theme-color, título e descrição reais (fim do placeholder "Lovable App").
- **Sem service worker** (default do skill PWA — usuário pediu "instalável", não offline). Manifest-only.

## 8. Central de Operações — cards de pendências

Topo do `/painel` (Dashboard admin/sindico):
- **Treinos IA aguardando aprovação** (count `treinos_ia_fila.status='pendente'`).
- **Anamneses pendentes** (count `anamnese_respostas.status='preenchido'` sem treino ativo).
- **Avaliações vencidas** (>90 dias sem `avaliacoes_fisicas` recente).
- **Moradores sem treino há muito tempo** (reuso `get_alunos_sem_checkin(30)`).

Cada card clicável → filtro na página correspondente.

## Fora de escopo (voltam para decisão)

- `checkins` vs `frequencia_alunos` — adotamos `checkins` como escrita, `frequencia_alunos` continua populada por trigger.
- Rename `planos` → `planos_comerciais` — não fazer sem aval (quebra código legado).
- Edge Function Claude para gerar treino → **fase 2**, após Fila IA visual.
- Módulo Espaços (spaces + reservations) → **fase 2**.
- Wellness Intelligence / Digital Twin / Health Score → **fase 3**.

## Detalhes técnicos

**Novos arquivos**:
- `src/hooks/useOrgRole.ts`
- `src/hooks/useFilaIA.ts`, `src/hooks/useTreinosIA.ts`
- `src/pages/admin/VinculosOrfaos.tsx`
- `src/pages/treinos/FilaIA.tsx` (aba)
- `src/pages/treinos/PlanoEditor.tsx` (drawer)
- `src/pages/morador/MeuTreino.tsx`
- `src/pages/equipe/Equipe.tsx` + `EquipeDialog.tsx` + `EquipeDrawer.tsx`
- `public/manifest.json`, `public/icon-192.png`, `public/icon-512.png`

**Arquivos modificados**:
- `src/components/AppSidebar.tsx` (Equipe em Operação, remoção Funcionários)
- `src/components/students/AddStudentDialog.tsx` (insert organization_members)
- `src/hooks/useOperationalContext.tsx` (fallback admin)
- `src/pages/sindico/SindicoHome.tsx` (gate Comitê)
- `src/pages/morador/MoradorHome.tsx` (rewrite "Hoje")
- `src/pages/Treinos.tsx` (aba Fila IA)
- `src/pages/treinos/PlanosTreino.tsx` (editor de exercícios)
- `src/pages/coach/CoachHome.tsx` (fila anamnese)
- `src/pages/Painel.tsx` (cards pendências)
- `src/App.tsx` (rotas /equipe, /morador/treino, /admin/vinculos-orfaos)
- `index.html` (meta PWA)

**Migração mínima** (só se `treinos_ia_fila` não existir): tabela + GRANTs + RLS (`authenticated` lê/escreve na sua org via `user_has_org`). Confirmar via `information_schema` antes.

**Não recriar**: `planos_treino`, `plano_exercicios`, `treinos`, `treino_execucoes`, `avaliacoes_fisicas`, `exercicios_biblioteca`, `frequencia_alunos`, `checkins`, `anamnese_respostas`, `organization_members`.

---

Posso começar pelo **bloco 1 (vínculo + useOrgRole + gate Comitê)** já que destrava tudo, ou você prefere que eu ataque a **Fila IA + Home do Morador** primeiro (maior impacto de demo)?
