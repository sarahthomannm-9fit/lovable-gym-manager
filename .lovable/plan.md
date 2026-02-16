

# Plano Completo: Cruzamento de Dados e Fluxos Integrados

## Diagnostico Atual

O sistema tem modulos funcionais mas **isolados** -- cada tela consulta seus proprios dados sem cruzar informacoes. O `DataIntegrationProvider` existe mas e subutilizado (apenas Painel, IntegratedInsights e AIMarketingInsights o consomem). O Dashboard 9FIT usa dados 100% mockados (hardcoded "R$ 47.5K", "142 alunos", etc). O `StudentProfile` ainda usa tipos legados (`Student` com `id: number`) com dados mockados de performance.

---

## O QUE FALTA (Organizacao por Prioridade)

### BLOCO 1: Eliminar Dados Mockados e Conectar ao Real

**1.1 Dashboard 9FIT com dados reais**
- As metricas "R$ 47.5K", "142 alunos", "94% retencao" sao hardcoded
- As "Atividades Recentes" sao hardcoded
- Os sub-dashboards (CEO, Consultoria, Trust, etc.) nao existem como rotas -- clicando vai para 404
- **Acao:** Conectar ao `useDataIntegration` + criar rotas para cada sub-dashboard

**1.2 StudentProfile com dados reais do Supabase**
- Ainda importa `Student` de `types/gym.ts` (id: number)
- Graficos de evolucao usam dados mockados
- Nao mostra historico de pagamentos, frequencia, avaliacoes fisicas ou treinos
- **Acao:** Reescrever para aceitar `SupabaseStudent` e cruzar com `avaliacoes_fisicas`, `pagamentos`, `checkins`, `treinos`

**1.3 SupabaseClasses com estado local redundante**
- Mantem `localClasses` (estado local) separado das `classes` do Supabase
- Confirmar/Cancelar aula so altera estado local, nao persiste
- **Acao:** Remover estado local, usar `updateClass` do contexto para persistir

### BLOCO 2: Cruzamento de Dados (Informacao Transitando)

**2.1 Expandir DataIntegrationProvider como hub central**
Atualmente cruza: alunos x planos, pagamentos x planos, campanhas (simulado), produtos por status.

Falta cruzar:
- **Alunos x Checkins** = frequencia real por aluno (quem esta inativo)
- **Alunos x Avaliacoes Fisicas** = evolucao corporal, proximas avaliacoes pendentes
- **Alunos x Treinos** = treinos vencidos/ativos por aluno
- **Alunos x Aulas Experimentais** = funil de conversao real (lead -> aluno)
- **Pagamentos x Notificacoes** = cobranças que geraram lembrete vs que nao geraram
- **Campanhas x Leads x Aulas Experimentais** = ROI real de campanha (campanha -> lead -> experimental -> aluno -> receita)
- **Funcionarios x Aulas** = carga horaria por professor, performance

**2.2 Metricas cruzadas disponiveis globalmente**

Novas metricas a calcular:
- `alunosInativos`: alunos sem checkin nos ultimos 15 dias
- `alunosComTreinoVencido`: treino com data_fim < hoje
- `alunosComAvaliacaoPendente`: proxima_avaliacao < hoje
- `taxaConversaoExperimental`: aulas_experimentais convertidas / total
- `receitaPorFuncionario`: pagamentos dos alunos de cada professor
- `ltv_medio`: receita total / total de alunos ativos
- `cac_estimado`: orcamento campanhas / conversoes
- `churnRisk`: alunos inativos + pagamento atrasado

**2.3 Contexto de alertas e acoes sugeridas**

O sistema deve gerar alertas automaticos que aparecem no Painel:
- "5 alunos sem treino ha mais de 30 dias"
- "3 aulas experimentais sem follow-up"
- "R$ 2.400 em cobranças vencidas ha mais de 15 dias"
- "Campanha 'Verao Fitness' terminou -- gerar relatorio?"

Cada alerta leva a uma acao (navegar para a tela certa com filtro pre-aplicado).

### BLOCO 3: Telas e Estados Faltantes

**3.1 Sub-dashboards 9FIT (atualmente 404)**
Criar 7 rotas reais com dados cruzados:

| Rota | Dados Cruzados |
|------|---------------|
| `/9fit/ceo` | MRR real, alunos ativos, receita por plano, retencao, churn, LTV, CAC |
| `/9fit/consultoria` | Alunos com treino, evolucao, aderencia, risco de saida |
| `/9fit/concierge` | Alunos premium, satisfacao, LTV individual |
| `/9fit/trust` | Avaliacoes posturais/fisicas, scores, tendencias |
| `/9fit/network` | Leads, campanhas, funis, ROI por canal |
| `/9fit/automation` | Fluxos de automacao, notificacoes disparadas, taxas |
| `/9fit/store` | Produtos, vendas, ticket medio |

**3.2 Tela de Configuracoes/Notificacoes**
- UI para `config_notificacoes` (ativar/desativar, definir templates, canais)
- Listagem de `notificacoes` enviadas com status

**3.3 Perfil do Aluno completo (micro-estados)**
Tabs com dados cruzados:
- **Resumo**: dados pessoais + status do plano + ultimo checkin
- **Financeiro**: historico de pagamentos, inadimplencia, metodo preferido
- **Treinos**: treino atual, historico, status (em dia/vencido)
- **Evolucao**: graficos de avaliacoes fisicas reais (peso, gordura, muscular)
- **Frequencia**: calendario de checkins, media mensal
- **Aulas**: aulas inscritas, presenca, lista de espera

### BLOCO 4: Micro-estados das Telas

**4.1 Estados de criacao com pre-preenchimento**
- Ao criar cobranca: preencher valor automatico do plano do aluno
- Ao criar treino: sugerir baseado no ultimo treino do aluno
- Ao criar campanha: sugerir publico baseado em alunos inativos ou leads nao convertidos
- Ao criar promocao: sugerir desconto baseado em analise de churn

**4.2 Estados de filtro e busca**
- Alunos: filtrar por status, plano, inadimplencia, frequencia
- Pagamentos: filtrar por status, periodo, metodo
- Aulas: filtrar por professor, tipo, ocupacao
- Treinos: filtrar por status (em dia, vencendo, vencido)

**4.3 Estados de confirmacao**
- Confirmar exclusao de aluno (com aviso de dados vinculados)
- Confirmar cancelamento de aula (com contagem de inscritos afetados)
- Confirmar finalizacao de campanha

**4.4 Empty states com acao**
- Aulas sem dados: "Nenhuma aula agendada. Criar primeira aula"
- Treinos sem dados: botao funcional (atualmente o botao "Novo Treino" nao abre nada)
- Notificacoes: "Nenhuma notificacao configurada. Configurar agora"

### BLOCO 5: Fluxos de Transicao de Dados

**5.1 Aula Experimental -> Aluno**
Quando marcar "Convertido" em aula experimental:
- Pre-preencher dialog de novo aluno com nome/email/telefone do lead
- Criar vinculo com plano selecionado na conversao
- Gerar primeira cobranca automaticamente
- Registrar fonte de aquisicao

**5.2 Campanha -> Lead -> Experimental -> Aluno -> Receita**
Rastreio completo do funil:
- Campanha gera leads (com fonte identificada)
- Lead agenda experimental
- Experimental converte em aluno
- Aluno gera receita
- Dashboard mostra ROI real: receita gerada / investimento da campanha

**5.3 Pagamento atrasado -> Notificacao -> Cobranca**
- Detectar pagamentos vencidos
- Gerar notificacao automatica (tabela notificacoes)
- Marcar como enviada quando processada
- Mostrar no Painel quantas cobranças tiveram follow-up

**5.4 Treino vencido -> Alerta -> Renovacao**
- Detectar treinos com data_fim passada
- Alertar no perfil do aluno e no dashboard
- Sugerir novo treino baseado no anterior

---

## Secao Tecnica

### Arquivos a remover
- `src/types/gym.ts` (substituir todos os usos por tipos Supabase)
- `src/utils/dataConverters.ts` (converter diretamente para tipos Supabase)

### Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/9fit/CEODashboard.tsx` | Dashboard CEO com metricas reais cruzadas |
| `src/pages/9fit/ConsultoriaDashboard.tsx` | Gestao de alunos e treinos |
| `src/pages/9fit/ConciergeDashboard.tsx` | Clientes premium |
| `src/pages/9fit/TrustDashboard.tsx` | Avaliacoes posturais/fisicas |
| `src/pages/9fit/NetworkDashboard.tsx` | Marketing e leads |
| `src/pages/9fit/AutomationDashboard.tsx` | Fluxos e notificacoes |
| `src/pages/9fit/StoreDashboard.tsx` | Produtos e vendas |
| `src/pages/Configuracoes.tsx` | Tela de configuracoes e notificacoes |
| `src/components/training/AddTrainingDialog.tsx` | Dialog para criar treino |
| `src/hooks/useCrossMetrics.ts` | Hook de metricas cruzadas globais |
| `src/hooks/useSmartAlerts.ts` | Hook de alertas inteligentes baseados em cruzamento |

### Arquivos a atualizar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/DataIntegrationProvider.tsx` | Adicionar checkins, treinos, avaliacoes, experimentais, funcionarios, notificacoes ao contexto; calcular metricas cruzadas |
| `src/components/StudentProfile.tsx` | Reescrever para usar tipos Supabase com abas (financeiro, treinos, evolucao, frequencia) |
| `src/components/SupabaseStudents.tsx` | Remover conversao para tipos antigos, usar tipos Supabase direto |
| `src/components/SupabaseClasses.tsx` | Remover estado local, persistir confirmar/cancelar no Supabase |
| `src/pages/9fit/Dashboard9FIT.tsx` | Conectar a dados reais via DataIntegration |
| `src/pages/Treinos.tsx` | Adicionar dialog funcional para criar treino |
| `src/App.tsx` | Adicionar rotas /9fit/ceo, /9fit/consultoria, etc. e /configuracoes |
| `src/components/AppSidebar.tsx` | Adicionar rota Configuracoes |
| `src/pages/AulasExperimentais.tsx` | Adicionar fluxo de conversao que pre-preenche novo aluno |

### Sequencia de implementacao

1. **Expandir DataIntegrationProvider** com todos os hooks e metricas cruzadas
2. **Criar useCrossMetrics e useSmartAlerts** 
3. **Reescrever StudentProfile** com dados reais e abas
4. **Remover tipos legados** (gym.ts + dataConverters.ts) e atualizar SupabaseStudents
5. **Corrigir SupabaseClasses** (remover estado local)
6. **Conectar Dashboard 9FIT** a dados reais
7. **Criar sub-dashboards 9FIT** (7 rotas)
8. **Criar AddTrainingDialog** funcional
9. **Criar tela de Configuracoes/Notificacoes**
10. **Implementar fluxo Experimental -> Aluno**
11. **Adicionar micro-estados** (filtros, confirmacoes, empty states, pre-preenchimento)

