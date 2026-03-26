

# Plano: Painel Central de Gestão — Sala de Guerra do FitManager

## Visão

Transformar o `/painel` de um dashboard informativo em um **cockpit operacional** com 3 colunas que responde: "O que precisa de mim agora?" — organizado por urgência, decisão e automação.

## Arquitetura da Mudança

```text
ANTES:                          DEPOIS:
┌─────────────────────┐         ┌───────┬────────────┬─────────┐
│ Header + KPIs       │         │ FOGO  │  NEGÓCIO   │ SISTEMA │
│ Recommendations     │         │       │            │         │
│ Alerts              │         │ itens │  MRR/KPIs  │ cobranç │
│ Events Timeline     │         │ que   │  agenda    │ automat │
│ Tabs (4)            │         │ quebra│  remarketi │ em exec │
└─────────────────────┘         │ hoje  │  promoções │ renov.  │
                                └───────┴────────────┴─────────┘
                                Mobile: 1 col com tabs
```

## O que será feito

### 1. Novo componente: WarRoomPanel (substitui Painel.tsx)

Reescrever `src/pages/Painel.tsx` com layout de 3 colunas:

**Coluna Esquerda — "O que está quebrando"**
- Cards de alerta com ações inline (resolver, ignorar, escalar)
- Dados de: inadimplência, alunos sem frequência 14d+, aulas sem instrutor, cobranças escaladas
- Cada card tem: O que é / Por que importa / 1-3 ações
- Micro-estados: idle → hover (mostra ações) → executando → resolvido (some em 2s)
- Prioridade: 🔴 Crítico > 🟡 Atenção > 🟢 Info
- Max 7 itens; overflow vai para deep-dive

**Coluna Central — "O que decide o mês"**
- 6 KPIs executivos no topo (MRR, Churn, Conversão, Inadimplência, LTV, Ativos) — mantidos
- Agenda do dia (aulas com ocupação, instrutor)
- Promoções ativas com performance
- Leads quentes aguardando follow-up
- Assinaturas vencendo esta semana

**Coluna Direita — "O que o sistema faz sozinho"**
- Cobranças automáticas em andamento (régua de cobrança)
- Sequências de remarketing ativas
- Renovações sendo processadas
- Status de automações

**Banner contextual no topo:**
- Estado crítico (1+ vermelho): banner vermelho pulsante com contagem
- Estado limpo (zero críticos): banner verde "Operação estável"

### 2. ActionCard — componente de card com micro-estados

Novo componente `src/components/warroom/ActionCard.tsx`:
- Props: título, descrição, impacto, ações[], prioridade, rota
- Estados visuais: idle, hover (expande), executando (spinner), resolvido (verde → fade)
- Ações inline com confirmação para destrutivas
- Badge de prioridade (🔴🟡🟢)

### 3. Engine de Urgência aprimorada

Expandir `useSmartAlerts.ts` para incluir novos tipos de alerta:
- `aula_sem_instrutor`: aulas de hoje/amanhã sem professor_id
- `assinatura_vencendo`: assinaturas com vencimento em 7 dias
- `lead_sem_followup_24h`: leads captados há 24h+ sem interação
- `aluno_trial_expirando`: alunos trial com menos de 3 dias restantes
- Classificar em 3 colunas: `critico` (coluna esquerda), `decisao` (centro), `sistema` (direita)

### 4. Responsividade

- Desktop (1280+): 3 colunas
- Tablet (768-1279): 2 colunas (esquerda + centro fundidos, direita)
- Mobile (<768): 1 coluna com tabs (🔴 Urgente / 📊 Negócio / ⚙️ Sistema)
- Mobile: check-in e alertas críticos funcionam 100%

### 5. Manter compatibilidade

- Tabs existentes (Dashboard, Insights, Financeiro, Integração) ficam abaixo das 3 colunas como seção "Deep Dive"
- DailyActionRecommendations integrado na coluna esquerda como fonte de dados
- EventsTimeline integrado na coluna direita

## Arquivos

| Ação | Arquivo |
|------|---------|
| Reescrever | `src/pages/Painel.tsx` |
| Criar | `src/components/warroom/ActionCard.tsx` |
| Criar | `src/components/warroom/CriticalColumn.tsx` |
| Criar | `src/components/warroom/BusinessColumn.tsx` |
| Criar | `src/components/warroom/SystemColumn.tsx` |
| Criar | `src/components/warroom/WarRoomBanner.tsx` |
| Editar | `src/hooks/useSmartAlerts.ts` (novos tipos de alerta + classificação por coluna) |
| Editar | `src/hooks/useCrossMetrics.ts` (adicionar assinaturas vencendo, aulas sem instrutor) |

## Sem migrations necessárias

Todos os dados já existem nas tabelas atuais. A mudança é 100% frontend — reorganização visual e lógica de apresentação.

