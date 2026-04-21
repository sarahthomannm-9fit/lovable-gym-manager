

# Plano: Corrigir conexão dos agentes + expandir para Ecossistema 9FIT

## 1. Bug crítico (causa raiz do "erro de conexão")

A edge function `agent-hub-chat` está chamando `supabase.auth.getClaims(token)` mas a versão do SDK importada (`@supabase/supabase-js@2.45.0`) **não tem esse método**. O log confirma:

```
TypeError: supabase.auth.getClaims is not a function
```

**Correção:** trocar para `supabase.auth.getUser(token)`, que existe nessa versão e retorna o usuário autenticado a partir do JWT. Mesma correção aplicada em qualquer outra função afetada.

## 2. Arquitetura RON Core (expansão do Hub)

Reorganizar o `/agents` em torno de uma hierarquia clara, sem quebrar o que já existe. Mantém os 5 agentes atuais e adiciona os essenciais para o ciclo de receita.

```text
                   ┌──────────────────────┐
                   │  CEO (Rony) — humano │
                   └──────────┬───────────┘
                              │ comandos
                   ┌──────────▼───────────┐
                   │  RON Core (COO)      │  ← novo agente master
                   │  roteia + monitora   │
                   └──────────┬───────────┘
        ┌────────┬────────────┼────────────┬─────────┐
        ▼        ▼            ▼            ▼         ▼
     Vendas   Marketing   Financeiro   Suporte   Produto
       │         │            │           │         │
   ┌───┴───┐  Content      Billing     Suporte   (futuro)
   SDR  Prep                                       
   Reativ                                          
   Upsell                                          
   B2B                                             
```

### Agentes na v1 (entregáveis agora)

| Camada | Agente | Status | Função |
|---|---|---|---|
| 1 | **RON Core** | novo | Orquestrador. Recebe comando do CEO, decide qual agente executar, loga tudo. |
| 2 | SDR Agent | existe | Qualifica leads novos. |
| 2 | **Prep de Call** | novo | Briefing de 5 linhas antes de cada call (puxa histórico do lead). |
| 2 | **Reativação** | novo | Mensagens para ex-alunos 30/60/90 dias. |
| 2 | **Upsell** | novo | Detecta gap no plano atual e sugere upgrade. |
| 2 | **Proposta B2B** | novo | Gera HTML de proposta para empresas. |
| 2 | Onboarding | existe | Acompanha novos alunos 30 dias. |
| 2 | Billing | existe | Régua de inadimplência. |
| 2 | Content | existe | Scripts de Reels e copy. |
| 2 | Suporte | existe | Tickets de alunos. |

Camadas 4–6 (Produto, Infra, Estratégia) ficam fora desta entrega — entram em iteração futura para evitar escopo gigante que quebra rápido.

## 3. Mudanças no banco

Nova tabela única `agent_logs` (memória central exigida pelo "RON Core") — registra toda execução de agente: input, output, status, agente, latência. Substitui logs espalhados.

```sql
create table public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  triggered_by text not null,         -- 'ceo' | 'cron' | 'event'
  input jsonb,
  output jsonb,
  status text default 'success',      -- success | error | partial
  latency_ms integer,
  created_at timestamptz default now()
);
-- RLS: authenticated full access
```

Tabela `propostas_b2b` para o agente de Proposta:

```sql
create table public.propostas_b2b (
  id uuid primary key default gen_random_uuid(),
  empresa text not null, contato text, email text,
  servicos jsonb, valor numeric,
  html text, status text default 'draft',
  created_at timestamptz default now()
);
```

Nada é renomeado. Tabelas existentes (`leads`, `alunos`, `pagamentos`, `support_tickets`, `content_drafts`) continuam intactas.

## 4. Mudanças na UI (`/agents`)

- Reorganização visual em **3 grupos** dentro do Hub: **Receita** (SDR, Prep, Reativação, Upsell, B2B) · **Operação** (Onboarding, Billing, Suporte) · **Marketing** (Content).
- Card extra no topo: **RON Core** (cinza-escuro, sempre ativo) — clicar nele abre o chat de comandos diretos ("reativar base 90d, fechar 2 contratos").
- Mantém métricas e briefing como estão.
- Card de cada novo agente com a mesma anatomia (status dot, role badge, descrição, ações).

## 5. Edge functions

- **Corrigir** `agent-hub-chat` (`getUser` em vez de `getClaims`). Mesma checagem em `agent-daily-reports` e `manage-users` se aplicável.
- **Estender** `agent-hub-chat` com prompts dos 5 novos agentes (`ron`, `prep`, `reativacao`, `upsell`, `b2b`).
- **Nova função** `proposta-b2b-generate`: recebe `{empresa, servicos, valor}` → gera HTML via Lovable AI Gateway → salva em `propostas_b2b`.
- Toda chamada loga em `agent_logs` (input, output, latência).

## 6. Detalhes técnicos

- Lovable AI Gateway permanece como provedor (já configurado, sem custo extra de chave).
- Modelo: `google/gemini-2.5-flash` para chat (rápido, barato), `google/gemini-2.5-pro` para Proposta B2B (qualidade alta no HTML).
- Auth via `getUser(token)` retorna `{data: {user}, error}` — `user.id` substitui `claims.sub`.
- Cron de relatórios diários (já configurado via SQL pelo usuário) continua válido — apenas estende para incluir os novos agentes.
- Sem quebra de rotas, sem mudança em sidebar (apenas o conteúdo de `/agents` evolui).

## 7. Ordem de execução

1. Migration: criar `agent_logs` e `propostas_b2b` com RLS.
2. Corrigir `agent-hub-chat` (`getClaims` → `getUser`) e adicionar prompts dos 5 novos agentes.
3. Criar edge function `proposta-b2b-generate`.
4. Atualizar `AgentsHub.tsx`: card RON Core + 4 novos agentes agrupados em 3 seções.
5. Adicionar logging de cada chamada em `agent_logs`.
6. Testar fluxo: comando para RON Core → roteamento → resposta do agente certo.

## Fora do escopo desta entrega

- Camadas 4–6 (agentes de Produto, Infra, Estratégia).
- Integração real com Instagram/WhatsApp (fica como próximo passo — exige API Business e webhook).
- Geração de PDF da proposta (HTML primeiro; PDF na próxima iteração).

