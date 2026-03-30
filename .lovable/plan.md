# Plano: Dar Vida ao FitManager — Engine de Regras + Estados Completos + Telas Finalizadas

## Diagnóstico

O sistema tem a estrutura correta (War Room, 3 colunas, smart alerts, cross-metrics, 34+ páginas). O que falta é a **camada de engrenagem**: os 4 motores (Estado, Evento, Decisão, Execução) operando como organismo vivo, e todas as telas com estados/micro-estados consistentes com o design system Navy.

## O que será implementado

### Bloco 1: Engine de Regras (o cérebro)

**Novo hook: `useBusinessEngine.ts**`
Motor central que roda a cada mudança de dados e produz:

- Classificação automática de estado de cada aluno (ativo_regular, ativo_sem_freq, inadimplente_1/2/3, trial_ativo, trial_expirando)
- Classificação de cada pagamento (em_dia, vence_3d, vence_hoje, vencido_1/3/7/15/30)
- Classificação de cada aula (ok, sem_instrutor, lotada, vazia)
- Classificação de cada lead (novo, agendado, experimental_feito, proposta, quente, morno, frio)
- Saída: objeto `EngineState` com filas priorizadas para cada coluna do War Room

**Novo hook: `useAutomationQueue.ts**`
Fila de ações automáticas que o sistema "faria sozinho":

- Cobranças: identifica etapa da régua (D+1, D+3, D+7, D+15) e marca qual mensagem/ação seria disparada
- Retenção: alunos sem check-in 7/14/21/30 dias com ação sugerida por tier
- Remarketing: leads classificados por temperatura com sequência sugerida
- Output: lista de `AutomationItem { tipo, alvo, etapa, acao_sugerida, auto_executavel }` que alimenta a coluna SISTEMA

### Bloco 2: Telas com PageShell + Estados Completos

Migrar todas as telas principais para usar o `PageShell` (Navy header + metrics bar) e adicionar estados visuais:

**Telas a migrar (8 telas):**

1. `/alunos` — PageShell com metrics (total, ativos, inativos, churn risk). Lista com badges de estado (ativo/risco/inadimplente). Empty state com CTA.
2. `/checkin` — PageShell com metrics (na academia, hoje, total). Estados do scanner: idle, sucesso (verde), erro_inadimplente (laranja), erro_cancelado (vermelho).
3. `/pagamentos` — PageShell com metrics (recebido, pendente, vencido). Cards com badge de etapa da régua de cobrança (D+1, D+3, etc). Filtros por status.
4. `/aulas` — PageShell com metrics (hoje, semana, ocupação, sem instrutor). Badges de estado por aula (ok, lotada, vazia, sem prof).
5. `/planos` — PageShell com metrics (total, ativos, alunos/plano).
6. `/treinos` — PageShell com metrics (ativos, vencidos, sem treino).
7. `/experimentais` — PageShell com metrics (agendadas, realizadas, convertidas, taxa conversão).
8. `/catalogo` — PageShell com metrics (SKUs ativos, tipos, receita potencial).

**Padrão por tela:**

- Estado `loading`: skeleton no PageShell
- Estado `empty`: card com CTA ("Cadastrar primeiro aluno", "Criar primeira aula")
- Estado `critical`: banner vermelho se há itens urgentes naquela tela
- Estado `normal`: dados com badges e indicadores visuais

### Bloco 3: Control Plane Aprimorado

**Coluna FOGO (esquerda) — aprimorar:**

- Agrupar alerts por categoria (Financeiro, Operação, Retenção) com contadores
- Adicionar micro-estado "ignorar temporariamente" (snooze 24h via localStorage)

**Coluna NEGÓCIO (centro) — aprimorar:**

- Adicionar seção "Agenda do Dia" com mini-cards de aulas de hoje (horário, ocupação, instrutor)
- Adicionar seção "Leads Quentes" com top 3 leads mais próximos de converter
- Adicionar seção "Assinaturas Vencendo" com lista dos próximos 7 dias

**Coluna SISTEMA (direita) — aprimorar:**

- Conectar com `useAutomationQueue` para mostrar ações automáticas em execução
- Mostrar régua de cobrança por etapa (quantos em D+1, D+3, D+7, etc)
- Mostrar sequências de remarketing ativas por temperatura
- Timeline de eventos recentes (últimos 10 do `system_events`)

### Bloco 4: DailyActionRecommendations Integrado

- Migrar de Card standalone para seção compacta dentro do PageShell do Painel
- Formato: fila horizontal scrollável de cards pequenos (ao invés do card grande atual)
- Cada card: ícone + título + badge prioridade + botão "Agir"
- Agrupamento visual por cor: verde=caixa, azul=gestão, roxo=conteúdo

### Bloco 5: Micro-estados nos ActionCards

Aprimorar `ActionCard.tsx`:

- Estado `idle`: card estático
- Estado `hover`: expande mostrando contexto extra (nome dos alunos, valores, datas)
- Estado `snoozed`: card cinza com timer "volta em Xh"
- Estado `executing`: spinner + texto "Processando..."
- Estado `resolved`: check verde + fade out em 1.5s

## Arquivos


| Ação   | Arquivo                                                                         |
| ------ | ------------------------------------------------------------------------------- |
| Criar  | `src/hooks/useBusinessEngine.ts`                                                |
| Criar  | `src/hooks/useAutomationQueue.ts`                                               |
| Editar | `src/pages/Painel.tsx` (integrar engine + automation queue + seções novas)      |
| Editar | `src/components/warroom/CriticalColumn.tsx` (agrupamento + snooze)              |
| Editar | `src/components/warroom/BusinessColumn.tsx` (agenda + leads + assinaturas)      |
| Editar | `src/components/warroom/SystemColumn.tsx` (automation queue + régua + timeline) |
| Editar | `src/components/warroom/ActionCard.tsx` (hover expand + snooze)                 |
| Editar | `src/components/DailyActionRecommendations.tsx` (formato compacto)              |
| Editar | `src/components/SupabaseStudents.tsx` (PageShell + estados)                     |
| Editar | `src/components/SupabaseCheckIn.tsx` (PageShell + estados visuais scanner)      |
| Editar | `src/components/SupabasePayments.tsx` (PageShell + régua de cobrança)           |
| Editar | `src/components/SupabaseClasses.tsx` (PageShell + estados aula)                 |
| Editar | `src/components/SupabasePlans.tsx` (PageShell + metrics)                        |
| Editar | `src/pages/Treinos.tsx` (PageShell + estados)                                   |
| Editar | `src/pages/AulasExperimentais.tsx` (PageShell + funil)                          |
| Editar | `src/pages/Catalogo.tsx` (PageShell + metrics)                                  |


## Sequência

```text
1. useBusinessEngine + useAutomationQueue    ← o cérebro
2. Painel.tsx + 3 colunas aprimoradas        ← cockpit principal
3. ActionCard micro-estados                  ← interação
4. 8 telas com PageShell + estados           ← consistência visual
5. DailyRecommendations compacto             ← ação diária
```

## Extras   
  
Arquitetura do Sistema — FitManager 9FIT

---

## 1. Modelo mental do sistema

O FitManager tem três camadas que nunca se misturam:

**Camada de dados** — Supabase (PostgreSQL). Fonte única de verdade. Nenhuma tela inventa dado — tudo vem daqui.

**Camada de inteligência** — Engine de regras + Agente IA. Processa dados brutos e produz estados, alertas, sugestões de ação. O humano não vê dado bruto — vê interpretação.

**Camada de interface** — O que você está construindo. Apresenta estados, recebe decisões, dispara execuções.

---

## 2. Entidades centrais

Seis entidades governam tudo. Cada módulo do menu é uma visão de uma ou mais dessas entidades.

```
ALUNO
├── id, nome, email, telefone
├── plano_id → PLANO
├── status: ativo | inadimplente | cancelado | trial | pausado
├── data_inicio, data_vencimento
├── checkins[] → CHECKIN
├── treinos[] → TREINO
├── avaliacoes[] → AVALIACAO
└── pagamentos[] → PAGAMENTO

PLANO
├── id, nome, valor, ciclo
├── nivel: express | start | 360 | 360_anual
├── acessos[] → quais sistemas do ecossistema libera
└── skus[] → produtos incluídos

AULA
├── id, nome, modalidade, horario
├── instrutor_id → FUNCIONARIO
├── capacidade, inscritos[]
├── status: agendada | em_andamento | concluída | cancelada
└── recorrencia: única | semanal | mensal

PAGAMENTO
├── id, aluno_id, valor, vencimento
├── status: pago | pendente | vencido | negociando
├── metodo: pix | cartão | boleto | recorrência
├── etapa_cobranca: 0-5
└── historico_contato[]

CAMPANHA
├── id, nome, tipo: captacao | remarketing | retencao
├── canal: meta | google | whatsapp | email
├── leads[], conversoes[], custo
└── status: rascunho | ativa | pausada | encerrada

LEAD
├── id, nome, contato, origem
├── temperatura: quente | morno | frio
├── etapa_funil: captado | agendado | experimental | proposta | convertido | perdido
└── historico_interacao[]
```

---

## 3. Estados do sistema

Todo objeto no sistema tem um estado. Estados geram alertas. Alertas geram itens no painel. Itens no painel recebem ação. Ação muda o estado.

```
CICLO COMPLETO:
Estado muda → Engine processa → Alerta gerado → Painel exibe → Humano age → Estado muda
```

### Estados críticos por entidade

**Aluno**

```
ativo_regular       → nenhum alerta
ativo_sem_freq      → sem check-in há 7d → alerta médio
ativo_sem_freq_risco → sem check-in há 14d → alerta alto
inadimplente_1      → vencido 1-7d → cobrança automática ativa
inadimplente_2      → vencido 8-15d → alerta painel, régua intensifica
inadimplente_3      → vencido 16-30d → escala para humano
inadimplente_critico → vencido 30d+ → decisão humana obrigatória
trial_ativo         → período trial, sem conversão
trial_expirando     → trial encerra em 3d sem conversão → remarketing quente
cancelado           → encerrado
```

**Aula**

```
agendada_ok         → instrutor confirmado, vagas disponíveis
agendada_sem_inst   → sem instrutor → alerta crítico
agendada_lotada     → capacidade 100% → sugere nova turma
agendada_vazia      → menos de 30% inscritos → alerta de custo
em_andamento        → horário atual
concluida           → presença registrada, dados gravados
cancelada           → alunos notificados automaticamente
```

**Pagamento**

```
em_dia             → nenhum alerta
vence_3d           → notificação preventiva automática
vence_hoje         → alerta no painel
vencido_1          → D+1: mensagem automática WhatsApp
vencido_3          → D+3: segunda mensagem + email
vencido_7          → D+7: mensagem com link de negociação
vencido_15         → D+15: escala para humano
vencido_30         → D+30: decisão: negociar | cancelar | cobrar juridicamente
```

**Lead**

```
captado            → entrou no funil
agendado           → aula experimental marcada
experimental_feito → fez aula, sem proposta
proposta_enviada   → aguardando decisão
convertido         → virou aluno
perdido_quente     → não converteu, reengajável em 30d
perdido_frio       → não converteu, reengajável em 90d
arquivado          → fora do funil ativo
```

---

## 4. Fluxos completos

### Fluxo 1 — Cobrança

```
Pagamento vence
  └─ D0: notificação preventiva automática (WhatsApp + push)
       └─ Pagou → status: pago → encerra fluxo
       └─ Não pagou →
            D+1: mensagem cobrança tom leve
            └─ Pagou → encerra
            └─ Não pagou →
                 D+3: segunda mensagem + email + link pagamento
                 └─ Pagou → encerra
                 └─ Não pagou →
                      D+7: mensagem negociação + opção parcelamento
                      └─ Aceitou → novo acordo → monitora
                      └─ Ignorou →
                           D+15: ESCALA PARA PAINEL HUMANO
                           → ação obrigatória: ligar | negociar | cancelar
                           └─ D+30: decisão final no painel
```

### Fluxo 2 — Retenção de aluno em risco

```
Aluno sem check-in
  └─ 7 dias: entra na watchlist interna (invisível para o humano)
       └─ fez check-in → sai da watchlist
       └─ 14 dias sem check-in:
            → alerta médio no painel
            → mensagem automática de engajamento
            └─ respondeu / voltou → encerra alerta
            └─ 21 dias:
                 → alerta alto no painel
                 → mensagem personalizada com dado de progresso
                 └─ 30 dias:
                      → alerta crítico
                      → escala para humano
                      → ação obrigatória: contato direto
```

### Fluxo 3 — Conversão de Lead

```
Lead captado (Meta Ads / condomínio / indicação / evento)
  └─ entra no CRM com temperatura automática por origem
       └─ mensagem de boas-vindas automática (WhatsApp)
            └─ resposta em 24h: temperatura quente
            └─ sem resposta em 24h: remarketing D+1
                 └─ agendou aula experimental:
                      → confirmar agendamento
                      → lembrete D-1 e D0
                      → fez aula: status = experimental_feito
                           └─ proposta enviada automática
                                └─ converteu em 48h: fluxo de onboarding aluno
                                └─ não converteu em 48h: remarketing quente 7d
                                     └─ não converteu em 30d: remarketing morno 90d
```

### Fluxo 4 — Controle de Aula

```
Aula criada na agenda
  └─ instrutor confirmado? 
       └─ NÃO → alerta imediato no painel
       └─ SIM →
            monitorar inscrições
            └─ lotou → sugere nova turma
            └─ < 30% 3 semanas → alerta de eficiência
            D-1: confirmação automática para inscritos
            D0 horário: status → em_andamento
            Pós-aula: registrar presença, atualizar contagem por aluno
                 └─ aluno com contagem zerada por plano → alerta renovação
```

### Fluxo 5 — Gestão de Assinatura

```
Ciclo mensal de cada assinatura
  └─ 7 dias antes do vencimento:
       └─ renovação automática (cartão/recorrência): processa
            └─ sucesso → atualiza data, nenhum alerta
            └─ falha → inicia fluxo de cobrança
       └─ pagamento manual (Pix/boleto):
            → notificação preventiva D-7
            → lembrete D-3
            → cobrança D0
            → fluxo de cobrança se não pagar
  └─ 30 dias antes do vencimento anual:
       → proposta de renovação com incentivo
       → se não renovar em 15d: escala para painel humano
```

### Fluxo 6 — Remarketing

```
Banco de leads não convertidos
  └─ segmentação automática por temperatura:
       QUENTE (fez experimental, < 30d):
         → sequência 7 dias: mensagem d1, d3, d7
         → se não converter: desce para morno
       MORNO (teve contato, < 90d):
         → mensagem quinzenal com conteúdo + oferta
         → evento ou promoção: prioridade temporária
       FRIO (> 90d sem interação):
         → mensagem mensal
         → 6 meses sem resposta: arquivar
```

---

## 5. Rotas do sistema

```
/                           → redirect → /painel
/painel                     → Control Plane (sala de guerra)
  /painel/atrasos           → deep dive: inadimplência
  /painel/agenda            → deep dive: aulas do dia/semana
  /painel/assinaturas       → deep dive: vencimentos
  /painel/remarketing       → deep dive: fila de leads

/alunos                     → lista com filtros e busca
  /alunos/novo              → cadastro
  /alunos/:id               → perfil completo
    /alunos/:id/treinos     → histórico de treinos
    /alunos/:id/pagamentos  → histórico financeiro
    /alunos/:id/avaliacoes  → histórico de avaliações
    /alunos/:id/frequencia  → histórico de check-ins

/checkin                    → scanner QR + manual
  /checkin/historico        → log do dia

/planos                     → lista de planos
  /planos/novo              → criar plano
  /planos/:id               → editar

/catalogo                   → SKUs
  /catalogo/novo            → criar SKU
  /catalogo/:id             → editar

/pagamentos                 → visão financeira operacional
  /pagamentos/cobrancas     → régua de cobrança por aluno
  /pagamentos/negociacoes   → acordos em andamento

/aulas                      → agenda completa
  /aulas/nova               → criar aula
  /aulas/:id                → editar / gerenciar inscrições

/equipamentos               → inventário
/produtos                   → catálogo loja

/equipe/funcionarios        → lista e perfis
/equipe/avaliacoes          → fila de avaliações pendentes
/equipe/experimental        → aulas experimentais agendadas

/treinos                    → biblioteca de treinos
  /treinos/novo             → prescrição
  /treinos/:id              → visualizar / editar

/financeiro/dashboard       → MRR, churn, LTV, projeções
/financeiro/pagamentos      → fluxo de caixa saídas
/financeiro/recebimentos    → fluxo de caixa entradas
/financeiro/cobrancas       → régua completa
/financeiro/estrategias     → IA financeira
/financeiro/promocoes       → cupons e descontos

/marketing/campanhas        → gestão de campanhas
/marketing/captacao         → funil de leads
/marketing/comunicacao      → central de mensagens
/marketing/conversao        → pipeline CRM
/marketing/funis            → estrutura dos funis
/marketing/email            → email marketing
/marketing/promocoes        → ofertas ativas
/marketing/automacao        → regras de automação
/marketing/insights         → IA marketing

/ia/agente                  → agente IA interface

/9fit/dashboard             → 9FIT OS visão executiva
/9fit/ceo                   → financeiro executivo
/9fit/consultoria           → gestão de consultoria
/9fit/concierge             → clientes premium
/9fit/trust                 → avaliações e saúde
/9fit/network               → B2B e parcerias
/9fit/automacao             → automações estratégicas
/9fit/store                 → loja fitness
```

---

## 6. Telas, estados e micro-estados

### `/painel` — Control Plane

**Estado default (carregando)** Skeleton de 3 colunas com placeholders animados. Nunca mostra tela em branco.

**Estado operacional normal** 3 colunas. Fila de urgência à esquerda, visão de negócio no centro, status de automações à direita.

**Estado crítico (1+ item vermelho)** Banner no topo com contagem de itens críticos. Fila esquerda priorizada. Tom visual muda — bordas vermelhas pulsam suavemente.

**Estado limpo (zero alertas críticos)** Banner verde "Operação estável". Fila mostra próximos vencimentos e previsões. Modo proativo.

**Micro-estados por card de alerta:**

```
idle          → card estático com dado
hover         → expande contexto + mostra ações disponíveis
acao_pendente → aguardando confirmação do usuário
executando    → spinner, bloqueado para nova interação
resolvido     → feedback verde, some da fila em 2s
ignorado      → vai para o final da fila com timestamp
```

---

### `/alunos/:id` — Perfil do aluno

**Estados do perfil:**

```
ativo_regular   → verde, dados normais
em_risco        → amarelo, banner de atenção no topo
inadimplente    → vermelho, bloco financeiro em destaque
trial           → roxo, contador de dias restantes visível
cancelado       → cinza, dados somente leitura, opção de reativar
```

**Micro-estados do histórico de pagamentos:**

```
pago          → verde com data e método
pendente      → amarelo com dias restantes
vencido       → vermelho com dias em atraso + botão ação rápida
negociando    → roxo com detalhes do acordo
```

---

### `/checkin` — Scanner

**Estados:**

```
idle              → campo de input focado, aguardando QR
processando       → spinner 0.3s
sucesso           → tela verde full por 1.5s com nome do aluno e foto
erro_nao_aluno    → tela vermelha: "aluno não encontrado"
erro_inadimplente → tela laranja: "pagamento pendente" + opção de liberar manualmente
erro_cancelado    → tela vermelha: "matrícula cancelada"
```

---

### `/aulas/:id` — Gestão da aula

**Estados:**

```
futura_ok         → agenda normal, inscrições abertas
futura_sem_inst   → banner vermelho: instrutor não confirmado
futura_lotada     → inscrições fechadas, lista de espera ativa
em_andamento      → modo ao vivo: timer, presença em tempo real
concluida         → somente leitura, presença registrada, relatório disponível
cancelada         → aviso de cancelamento, alunos notificados
```

---

### `/financeiro/dashboard` — Visão financeira

**Estados:**

```
saudavel    → MRR crescendo, inadimplência < 5%, churn < 3%
atencao     → algum indicador amarelo — MRR flat ou inadimplência 5-10%
critico     → MRR caindo, inadimplência > 10% ou churn > 5%
```

Cada métrica tem seu próprio micro-estado:

```
crescendo   → número verde com seta + delta %
estavel     → número branco, sem indicador
caindo      → número vermelho com seta + delta %
sem_dado    → placeholder "—" nunca zero inventado
```

---

### `/marketing/captacao` — Funil CRM

**Estados do lead no kanban:**

```
novo            → card com origem e temperatura
agendado        → data da experimental visível
experimental    → badge "fez aula" com data
proposta        → valor do plano proposto visível
convertido      → verde, movido para base de alunos
perdido         → cinza, arquivado com motivo
```

**Micro-estados do card:**

```
temperatura_quente  → borda esquerda vermelha
temperatura_morno   → borda esquerda laranja
temperatura_frio    → borda esquerda cinza
sem_contato_24h     → ícone de alerta no card
remarketing_ativo   → badge roxo "em sequência"
```

---

## 7. Regras de apresentação

**Hierarquia de urgência no painel:**

```
1. CRÍTICO (vermelho)   → requer ação hoje, bloqueia operação
2. ALTO (laranja)       → requer ação essa semana, impacta financeiro
3. MÉDIO (amarelo)      → requer atenção, não urgente
4. INFO (azul)          → sistema informando, nenhuma ação necessária
5. SUCESSO (verde)      → confirmação de execução
```

**Regra de densidade:**

```
Painel central    → máximo 7 itens por coluna. O resto vai para deep dive.
Cards de alerta   → máximo 3 linhas de informação + máximo 3 ações.
Tabelas           → máximo 8 linhas antes de paginação.
Métricas          → máximo 6 no topo de qualquer tela.
```

**Regra de ação:**

```
Toda ação tem 3 estados: disponível → executando → resultado.
Toda ação destrutiva tem confirmação.
Toda ação tem desfazer por 5 segundos após execução.
Nenhuma ação some sem feedback visual.
```

---

## 8. Responsividade

```
Desktop (1280px+)   → 3 colunas no painel, sidebar expandida
Tablet (768-1279px) → 2 colunas no painel, sidebar colapsável
Mobile (< 768px)    → 1 coluna, sidebar como bottom sheet
                      → foco em: check-in, alertas críticos, ação rápida
                      → tabelas viram cards empilhados
                      → gráficos viram métricas numéricas simples
```

**Mobile first nos módulos críticos:** Check-in, painel de alertas, aprovação de cobrança — têm que funcionar 100% no celular. O dono de studio acessa isso de qualquer lugar.

**Desktop first nos módulos analíticos:** Dashboard financeiro, relatórios, funil de marketing — complexidade justifica tela grande.

---

## 9. Conexões com o ecossistema 9FIT via Supabase

```
FitManager lê:
  estudantes              → base de alunos
  planos_de_treino_gerados → status dos treinos prescritos
  periodizações           → ciclo atual de cada aluno
  modelos_de_treino       → biblioteca de treinos
  estruturas_de_treinamento → periodização disponível

FitManager escreve:
  pagamentos              → status, histórico, acordos
  checkins                → registro de frequência
  alertas                 → fila de ações pendentes
  campanhas               → origem e performance
  leads                   → funil e temperatura

FitManager dispara:
  calcular_periodização_correspondência → quando aluno atualiza perfil
  automações              → quando estado de entidade muda
  notificações            → WhatsApp, email, push
```

---

## 10. O que o humano nunca faz

```
✗ Calcula dias de atraso
✗ Decide qual template de cobrança mandar
✗ Verifica manualmente quem não veio essa semana
✗ Conta quantas aulas restam no plano
✗ Lembra de ligar pro lead de 3 dias atrás
✗ Monta relatório financeiro do mês
✗ Verifica se a aula tem instrutor
✗ Confirma presença manualmente em aula
```

```
✓ Decide quando a régua automática não é suficiente
✓ Faz contato humano em casos escalados
✓ Aprova ou rejeita sugestões da IA
✓ Define estratégia de promoção e precificação
✓ Insere informação clínica e qualitativa
✓ Toma decisão final em casos ambíguos
✓ Define prioridade entre alertas do mesmo nível
```

---

Esse é o documento base. Tudo que vem depois — cada tela, cada componente, cada fluxo de dado — é derivado daqui.

**Construo o frontend agora?**

os botoes de componentes da lateral  construir o front end e o novo design

25/03

Sintetizou construção de componentes e design frontend

Sintetizou construção de componentes e design frontend

O FitManager completo está pronto. O que foi construído:

**Design** — dark brutal, fundo quase preto `#07070A`, acento lima `#C8FF00`, hierarquia de cor por urgência (vermelho → laranja → amarelo → verde). Zero arredondamentos excessivos, tipografia mono + sans.

**Sidebar** — colapsável, todas as seções e rotas, badges de urgência em vermelho, indicador ativo com borda lime.

**Páginas funcionais**  
  
Sem migrations

Toda a lógica é frontend. Os dados já existem no Supabase. A engine calcula estados a partir dos dados existentes (datas de vencimento, check-ins, lead status, etc).