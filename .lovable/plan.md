# Plano: FitManage - Sistema Integrado Completo

## Diagnostico Atual

Apos analise profunda, o sistema ja possui uma boa infraestrutura de dados cruzados (`useCrossMetrics`, `useSmartAlerts`, `DataIntegrationProvider`), dashboards 9FIT com dados reais, e perfil do aluno com abas. Porem existem **lacunas criticas** que impedem o sistema de funcionar como gestao completa e integrada.

---

## LACUNAS IDENTIFICADAS (por prioridade)

### A. Tipos Legados Ainda em Uso (8 arquivos)

`src/types/gym.ts` e `src/utils/dataConverters.ts` ainda sao importados por:

- `StudentCard.tsx`, `StudentsList.tsx` (usam `Student` com `id: number`)
- `PlanCard.tsx`, `PlansStats.tsx` (usam `Plan` legado)
- `EquipmentCard.tsx`, `EquipmentStats.tsx`, `Equipment.tsx` (usam `Equipment` legado)

**Impacto:** Incompatibilidade de tipos (UUID vs number), dados nao transitam corretamente entre perfil do aluno e lista.

### B. Fluxo Experimental->Aluno Incompleto

`converterParaAluno()` apenas atualiza o status da aula experimental -- NAO cria o aluno no banco. O nome/email/telefone do lead nao e copiado para a tabela `alunos`.

### C. Cobranca sem Pre-preenchimento

Ao criar cobranca em `/pagamentos`, o valor nao e pre-preenchido com a mensalidade do aluno selecionado. O formulario nao usa `dia_pagamento` do aluno para calcular a data de vencimento.

### D. SupabaseClasses com Estado Local

`SupabaseClasses.tsx` mantem `localClasses` separado -- confirmar/cancelar aula altera apenas estado local, nao persiste no Supabase.

### E. Sidebar Desatualizado

Nao mostra alertas inteligentes. Os sub-dashboards 9FIT nao aparecem expandidos.

### F. Falta Fluxo de Campanha Inteligente

Ao criar campanha, nao sugere publico baseado em alunos inativos ou leads. Nao ha calculo de ROI por campanha visivel na UI.

---

## PLANO DE IMPLEMENTACAO

### Fase 1: Eliminar Tipos Legados (remover gym.ts)

**Remover:**

- `src/types/gym.ts`
- `src/utils/dataConverters.ts`

**Atualizar 6 componentes:**

- `StudentCard.tsx` e `StudentsList.tsx` -- usar `Tables<'alunos'>` do Supabase
- `PlanCard.tsx` e `PlansStats.tsx` -- usar `Tables<'planos'>`
- `EquipmentCard.tsx`, `EquipmentStats.tsx`, `Equipment.tsx` -- criar interface local `EquipmentItem` (equipamentos nao tem tabela Supabase ainda)

### Fase 2: Fluxo Experimental -> Aluno Real

Atualizar `converterParaAluno()` em `useAulasExperimentais.ts`:

1. Ao converter, inserir registro na tabela `alunos` com nome/email/telefone do lead
2. Vincular ao `plano_id` selecionado
3. Gerar primeira cobranca na tabela `pagamentos` com valor do plano e `dia_pagamento` calculado
4. Atualizar status da aula experimental para 'convertida'

Atualizar `AulasExperimentais.tsx`:

- Dialog de conversao mostra preview dos dados que serao criados
- Apos conversao, navegar para perfil do novo aluno

### Fase 3: Cobranca Inteligente com Pre-preenchimento

Atualizar `SupabasePayments.tsx`:

1. Quando selecionar aluno no dialog de nova cobranca, pre-preencher:
  - Valor = `valor_mensalidade` do aluno
  - Data vencimento = proximo `dia_pagamento` do aluno
  - Metodo = `forma_pagamento` do aluno
2. Adicionar botao "Gerar Cobranças do Mes" que cria cobranças para todos alunos ativos automaticamente
3. Adicionar formas de pagamento expandidas (boleto, credito_recorrente)

### Fase 4: Corrigir SupabaseClasses

Remover `localClasses` de `SupabaseClasses.tsx`:

- Confirmar/Cancelar aula chama `updateClass()` do contexto para persistir no Supabase
- Remover a interface `ClassItem` local
- A lista de aulas vem diretamente de `classes` do contexto

### Fase 5: Painel com Alertas e Metricas Cruzadas

Atualizar `Painel.tsx`:

- Substituir `quickStats` por dados do `metrics` (receita mensal, inadimplencia, churn)
- Adicionar secao de Alertas Inteligentes (mesma logica do Dashboard9FIT)
- Adicionar KPI de conversao (experimental -> aluno) com link direto

### Fase 6: Campanha com Sugestao de Publico

Atualizar fluxo de criacao de campanha:

- Ao criar campanha, sugerir segmentos baseados em dados reais:
  - "Alunos inativos (X alunos sem checkin 15+ dias)"
  - "Leads nao convertidos (X leads sem conversao)"
  - "Alunos com treino vencido (X alunos)"
- Mostrar ROI estimado baseado em `cacEstimado` do `useCrossMetrics`

### Fase 7: Micro-estados de Confirmacao

Adicionar `AlertDialog` para acoes destrutivas:

- Excluir aluno (mostrar qtd dados vinculados)
- Cancelar aula (mostrar qtd inscritos afetados)
- Finalizar campanha

---

## Secao Tecnica

### Arquivos a Remover

```text
src/types/gym.ts
src/utils/dataConverters.ts
```

### Arquivos a Criar

Nenhum arquivo novo necessario -- todas as mudancas sao em arquivos existentes.

### Arquivos a Atualizar


| Arquivo                                       | Mudanca                                                 |
| --------------------------------------------- | ------------------------------------------------------- |
| `src/components/students/StudentCard.tsx`     | Trocar `Student` por `Tables<'alunos'>`                 |
| `src/components/students/StudentsList.tsx`    | Trocar `Student` por `Tables<'alunos'>`                 |
| `src/components/plans/PlanCard.tsx`           | Trocar `Plan` por `Tables<'planos'>`                    |
| `src/components/plans/PlansStats.tsx`         | Trocar `Plan` por `Tables<'planos'>`                    |
| `src/components/equipment/EquipmentCard.tsx`  | Interface local `EquipmentItem`                         |
| `src/components/equipment/EquipmentStats.tsx` | Interface local `EquipmentItem`                         |
| `src/components/Equipment.tsx`                | Interface local `EquipmentItem`                         |
| `src/components/SupabaseStudents.tsx`         | Remover conversao para tipos antigos                    |
| `src/components/SupabasePlans.tsx`            | Remover conversao para tipos antigos                    |
| `src/hooks/useAulasExperimentais.ts`          | `converterParaAluno` cria aluno + cobranca              |
| `src/pages/AulasExperimentais.tsx`            | Dialog de conversao com preview e navegacao             |
| `src/components/SupabasePayments.tsx`         | Pre-preenchimento inteligente + gerar cobranças em lote |
| `src/components/SupabaseClasses.tsx`          | Remover estado local, persistir no Supabase             |
| `src/pages/Painel.tsx`                        | Alertas inteligentes + metricas cruzadas                |
| `src/components/AppSidebar.tsx`               | Badge de alertas no menu                                |


### Sequencia de Execucao

1. Remover `gym.ts` + `dataConverters.ts` e atualizar 7 componentes dependentes
2. Corrigir `SupabaseStudents.tsx` e `SupabasePlans.tsx` (sem conversao de tipos)
3. Implementar conversao real em `useAulasExperimentais.ts` (criar aluno + cobranca)
4. Pre-preenchimento inteligente em `SupabasePayments.tsx`
5. Corrigir `SupabaseClasses.tsx` (remover estado local)
6. Atualizar `Painel.tsx` com alertas e metricas cruzadas
7. Adicionar confirmacoes (AlertDialog) em exclusoes  
  
**Meta:** Gym Manager virar o **Control Plane** (analítico, técnico e burocrático) que cruza tudo do ecossistema 9FIT + White Label.
  ---
  ## 0) Pré-flight (não pule)
  - **Congelar escopo**: esta atualização é **infra + confiabilidade + gestão** (não redesign).
  - Criar **backup/branch** (ou snapshot do projeto no Lovable).
  - Listar **tabelas Supabase atuais** usadas pelo Gym Manager: alunos, planos, pagamentos, classes, aulas_experimentais, campanhas (+ quaisquer outras já existentes).
  - Confirmar como o Lovable está sincronizando **Types do Supabase** (geração/refresh).
  - Definir “DoD por fase”: cada fase só avança após checklist de validação.
  ---
  ## 1) White Label (Multi-tenant) — FUNDACIONAL (primeiro)
  ### 1.1 Modelo e isolamento
  - Criar/confirmar entidades de **tenant** (organização), **membros**, **settings de branding**.
  - Adicionar `tenant_id` em TODAS as tabelas operacionais do Gym Manager:
    - alunos
    - planos
    - pagamentos
    - classes
    - aulas_experimentais
    - campanhas
  - Backfill controlado (se já existem registros antigos, atribuir ao “tenant master 9FIT”).
  ### 1.2 Segurança (RLS) e papéis
  - Definir roles por tenant: **Owner/Admin/Coach/Sales/Finance/Support**
  - Implementar políticas de acesso por `tenant_id` (RLS) **só depois** que o filtro no front estiver estável.
  - Restringir acesso por role:
    - Finance: pagamentos/cobranças
    - Sales: leads/aulas experimentais/campanhas
    - Coach: alunos/treinos/classes (sem financeiro)
    - Admin/Owner: tudo
  ### 1.3 UI e UX mínima (sem refazer telas)
  - Implementar **Tenant Provider** (tenant atual obrigatório).
  - Implementar **Tenant Switcher** (se usuário tiver mais de um tenant).
  - Bloquear o app sem tenant selecionado (“Selecione ou crie uma organização”).
  - Aplicar **branding mínimo** (logo/nome/cores) no topo e sidebar.
  ✅ **DoD Fase 1:** usuário não vê dados sem tenant; dados isolados por tenant; navegação intacta.
  ---
  ## 2) Normalização de tipos (remover legado UUID vs number) — Prioridade máxima
  - Remover completamente:
    - `src/types/gym.ts`
    - `src/utils/dataConverters.ts`
  - Atualizar componentes que ainda importam legado:
    - `StudentCard.tsx`, `StudentsList.tsx` → tipagem via Supabase (UUID)
    - `PlanCard.tsx`, `PlansStats.tsx` → tipagem via Supabase
    - `EquipmentCard.tsx`, `EquipmentStats.tsx`, `Equipment.tsx` → tipagem consistente (interface local **sem id number** ou criar tabela quando for a hora)
  - Atualizar:
    - `SupabaseStudents.tsx` (sem conversão pra tipos antigos)
    - `SupabasePlans.tsx` (sem conversão pra tipos antigos)
  ✅ **DoD Fase 2:** zero import legado; lista → perfil funciona; sem conflitos UUID/number.
  ---
  ## 3) Fluxo Experimental → Aluno REAL (com vínculo + início financeiro)
  ### Produto (o que precisa acontecer)
  - Converter experimental **cria o aluno real** com nome/email/telefone.
  - Vincula **plano_id** escolhido.
  - Cria **primeira cobrança** (pagamentos) com:
    - valor da mensalidade
    - vencimento calculado por `dia_pagamento`
    - método padrão do aluno (se houver)
  - Atualiza o status da aula experimental para **convertida** e salva `aluno_id`.
  - UI mostra **preview** do que será criado (aluno + cobrança + vínculo).
  - Pós-conversão: navegar direto para **perfil do novo aluno**.
  ### Arquivos a atualizar
  - `src/hooks/useAulasExperimentais.ts`
  - `src/pages/AulasExperimentais.tsx`
  ✅ **DoD Fase 3:** conversão cria entidade real + ciclo financeiro começa + navegação automática.
  ---
  ## 4) Cobrança inteligente (prefill + lote + inadimplência operacional)
  ### 4.1 Prefill obrigatório
  - Ao selecionar aluno na “Nova Cobrança”, pré-preencher:
    - valor
    - método
    - vencimento (próximo dia_pagamento)
    - referência do mês
  ### 4.2 Geração em lote
  - Botão “**Gerar Cobranças do Mês**”:
    - cria para todos alunos ativos do tenant
    - evita duplicidade (aluno+mês)
  ### 4.3 Inadimplência vira motor do sistema
  - Status vencido/inadimplente alimenta:
    - alertas inteligentes
    - painel executivo
    - (mais tarde) entitlements/bloqueios de acesso
  ### Arquivos a atualizar
  - `src/components/SupabasePayments.tsx`
  ✅ **DoD Fase 4:** cobrança deixa de ser manual; lote mensal roda; inadimplência visível.
  ---
  ## 5) Classes/Aulas com persistência real (sem estado local)
  - Remover `localClasses` (ou qualquer estado paralelo que não persiste).
  - Confirmar/Cancelar aula **persiste no Supabase** via contexto/provider.
  - Lista de aulas vem **direto da fonte oficial** (context).
  ### Arquivos a atualizar
  - `src/components/SupabaseClasses.tsx`
  ✅ **DoD Fase 5:** ação em aula reflete após refresh; não existe divergência local vs banco.
  ---
  ## 6) Painel (cockpit executivo + alertas + métricas cruzadas)
  ### 6.1 Painel executivo (gestão, não “dashboard decorativo”)
  - Substituir quickStats por métricas reais (useCrossMetrics):
    - receita mensal / MRR
    - inadimplência
    - churn (quando aplicável)
    - conversão experimental → aluno
  ### 6.2 Alertas inteligentes (operacional)
  - Seção “Alertas Inteligentes” no painel (useSmartAlerts)
  - KPI de conversão com link para listas filtradas (ação imediata)
  ### Arquivos a atualizar
  - `src/pages/Painel.tsx`
  ✅ **DoD Fase 6:** painel vira centro de decisões diárias; alertas acionáveis.
  ---
  ## 7) Sidebar (gestão + ecossistema visível)
  - Badge/contador de alertas no menu.
  - Sub-dashboards 9FIT aparecem (expandidos, sem esconder features).
  - Branding do tenant refletido.
  ### Arquivos a atualizar
  - `src/components/AppSidebar.tsx`
  ✅ **DoD Fase 7:** navegação mostra “estado do negócio” e acesso rápido ao que importa.
  ---
  ## 8) Campanhas inteligentes (segmento real + ROI)
  - Ao criar campanha, sugerir públicos automaticamente (baseado em dados reais):
    - inativos (sem check-in 15+ dias)
    - leads não convertidos
    - treino vencido
    - inadimplentes
  - Mostrar ROI estimado (com base em crossMetrics/CAC estimado).
  - Fechar loop: campanha → resultado → conversões visíveis.
  ✅ **DoD Fase 8:** campanha vira ferramenta de reativação/upsell, não cadastro.
  ---
  ## 9) Micro-estados e segurança operacional (ações destrutivas)
  - AlertDialog para:
    - excluir aluno (mostrar dados vinculados)
    - cancelar aula (mostrar inscritos afetados)
    - finalizar campanha
  - Registrar ações críticas (mínimo rastreável: tenant, usuário, ação, entidade).
  ✅ **DoD Fase 9:** menos erro humano e mais rastreabilidade.
  ---
  # 10) Gym Manager como “ponto central analítico” do ecossistema 9FIT (sem tirar nada do que já existe)
  > Aqui é onde você “cruza tudo” mantendo FitPro (hub do aluno), Painel do Prof, RON/Comunidade e Dinheiro.
  ## 10.1 Pessoa Central e cruzamento
  - Garantir que **Aluno = Pessoa Central** no Gym Manager:
    - lead/experimental/aluno são estados, não entidades duplicadas
  - Perfil do aluno (aba) passa a exibir, quando aplicável:
    - pagamentos + status
    - presença/check-ins
    - treino atual + vencimento
    - avaliações/postura + reavaliação
    - progresso
    - consumo de conteúdo (Fitflix/Academy)
    - compras (Loja)
    - saúde (Copilot check-ins)
  ## 10.2 Catálogo mestre (SKUs) e Entitlements (direitos)
  - Gym Manager vira **dono do Catálogo Mestre**:
    - cada produto/serviço/app/academy vira SKU com regras (preço, recorrência, capacidade, entregas)
  - Entitlements:
    - define acesso ao que o aluno tem direito (Fitflix/Academy/RON/benefícios da loja)
    - bloqueia/limita por inadimplência (quando ativado)
  ## 10.3 Event OS (mínimo para gestão real)
  - Padronizar eventos do ecossistema para o Gym Manager enxergar:
    - pagamento criado/vencido/pago
    - check-in / ausência
    - treino vencido/atualizado
    - avaliação feita
    - conteúdo consumido
    - compra na loja
    - lead avançou no funil
  - Alertas e métricas derivam desses eventos (sem duplicar lógica em cada app).
  ✅ **DoD Fase 10:** Gym Manager cruza o ecossistema sem “matar” apps; só governa.
  ---
  # 11) Roteiro de validação (UAT) — rápido e obrigatório
  Rodar no preview do Lovable, por tenant:
  ### Identidade e tenant
  - Sem tenant selecionado → app bloqueia
  - Troca tenant → dados mudam (sem vazamento)
  ### Fluxo comercial
  - Criar lead/experimental
  - Converter → aluno criado + plano + cobrança inicial
  - Navega para perfil do aluno automaticamente
  ### Financeiro
  - Nova cobrança prefill correto
  - Gerar cobranças do mês (não duplica)
  - Marcar vencido → aparece em alertas/painel
  ### Operação
  - Confirmar/cancelar aula persiste após refresh
  ### Painel e campanhas
  - Painel reflete métricas reais + alertas
  - Campanha sugere públicos + ROI estimado
  ### Segurança operacional
  - Excluir/cancelar/finalizar pede confirmação e mostra impacto
  ---
  # Checklist “como executar no Lovable” (workflow prático)
  - Implementar **uma fase por vez** (não misturar WL + payments + classes no mesmo pacote).
  - Após mudar schema Supabase → **regenerar tipos** no Lovable antes de seguir.
  - Sempre validar no Preview:
    - console sem erros
    - navegação lista→perfil
    - refresh da página não quebra estado
  - Só depois ativar RLS (quando filtros tenant estiverem maduros).