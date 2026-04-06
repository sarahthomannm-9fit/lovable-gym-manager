

# Plano: Motor de Inteligencia + Agente IA Real + Anamnese/PAR-Q

## Escopo

3 blocos de trabalho:

1. **Agente IA real** (substituir simulação por Lovable AI Gateway)
2. **Motor de inteligencia ativo** no marketing e financeiro (decisões automáticas, não só display)
3. **Fluxo Anamnese + PAR-Q** (cadastro de aluno gera link público de questionário)

---

## Bloco 1: Agente IA Real com Lovable AI

O AIAgent.tsx atual usa `setTimeout` com respostas hardcoded. Precisa virar um agente real que lê dados do sistema e responde com inteligência.

**O que será feito:**

- Criar edge function `supabase/functions/agent-chat/index.ts` que:
  - Recebe mensagens + contexto do sistema (métricas, alertas, alunos, pagamentos)
  - Envia para Lovable AI Gateway (`google/gemini-3-flash-preview`) com system prompt especializado por agente (RH/Admin/Comercial/Marketing/Financeiro)
  - Streaming SSE de volta para o frontend
  - Trata erros 429/402

- Reescrever `src/components/AIAgent.tsx`:
  - Streaming real token-by-token
  - Injetar contexto do sistema via `useDataIntegration()` no prompt (métricas MRR, churn, inadimplência, leads, alertas ativos)
  - Renderizar respostas com `react-markdown`
  - Adicionar agente "Financeiro" e "Operações" aos especialistas existentes

- Atualizar `supabase/config.toml` com a nova function

**Resultado:** O agente responde com dados reais. Pergunta "qual meu churn?" e ele responde com o número real + sugestão.

---

## Bloco 2: Motor de Inteligencia Ativo

Hoje o `useBusinessEngine` classifica estados e o `useAutomationQueue` lista ações sugeridas, mas nada executa. O sistema precisa de capacidade de execução.

**O que será feito:**

### 2a. Hook `useActionExecutor.ts`
- Recebe uma `AutomationItem` e executa a ação:
  - `cobranca` → insere notificação no Supabase + registra `system_event`
  - `retencao` → insere notificação de engajamento + registra evento
  - `remarketing` → insere `mensagem_marketing` com status "agendada"
- Cada execução atualiza o estado local (card muda para "resolvido")
- Toast de confirmação

### 2b. Coluna SISTEMA com execução
- Botão "Executar" nos `AutomationItem` com `auto_executavel: true`
- Botão "Aprovar" nos itens que precisam de humano
- Integrar `useAutomationQueue` na `SystemColumn` (já parcialmente feito, conectar dados reais)

### 2c. Marketing Intelligence
- Criar `src/hooks/useMarketingIntelligence.ts`:
  - Cruza dados de campanhas (ROI, conversões) com leads (temperatura) e alunos (churn risk)
  - Gera sugestões automáticas: "Campanha X tem ROI 3x, aumentar orçamento" / "Lead Y fez experimental há 2 dias, enviar proposta"
  - Alimenta cards na BusinessColumn e na página de Marketing Insights

### 2d. Financeiro Intelligence
- Criar `src/hooks/useFinancialIntelligence.ts`:
  - Projeção de MRR real baseada em assinaturas vencendo + inadimplência + leads em conversão
  - Alerta de cash flow: "Receita projetada cai 15% se não recuperar R$ X de inadimplência"
  - Score de saúde financeira (0-100) visível no War Room
  - Alimenta a coluna NEGÓCIO e o dashboard financeiro

---

## Bloco 3: Anamnese + PAR-Q

Fluxo: Cadastrar aluno → sistema gera link público → aluno preenche PAR-Q → dados salvos no perfil.

**O que será feito:**

### 3a. Migration: tabela `anamnese_respostas`
```sql
CREATE TABLE public.anamnese_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL,
  token text UNIQUE NOT NULL,
  tipo text NOT NULL DEFAULT 'par_q',
  respostas jsonb DEFAULT '{}',
  status text DEFAULT 'pendente',
  preenchido_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.anamnese_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for anamnese" ON public.anamnese_respostas FOR ALL USING (true);
```

### 3b. Página pública `/anamnese/:token`
- Rota SEM sidebar (não passa pelo MainLayout)
- Formulário PAR-Q com as 7 perguntas padrão + campos extras (objetivos, restrições, medicamentos, histórico de atividade)
- Branded com 9FIT
- Mobile-first
- Ao submeter: atualiza `anamnese_respostas` com `status: 'preenchido'` e `respostas: {...}`

### 3c. Geração de link no cadastro de aluno
- Após `addStudent`, gerar token (nanoid/uuid), inserir na tabela `anamnese_respostas`
- Mostrar link copiável no toast de sucesso e no perfil do aluno
- Formato: `{window.location.origin}/anamnese/{token}`

### 3d. Indicador no perfil/lista de alunos
- Badge "PAR-Q pendente" (amarelo) ou "PAR-Q completo" (verde) na lista de alunos
- No card do aluno, mostrar respostas da anamnese quando preenchida

---

## Arquivos

| Acao | Arquivo |
|------|---------|
| Criar | `supabase/functions/agent-chat/index.ts` |
| Reescrever | `src/components/AIAgent.tsx` (streaming real) |
| Editar | `supabase/config.toml` (adicionar function) |
| Criar | `src/hooks/useActionExecutor.ts` |
| Criar | `src/hooks/useMarketingIntelligence.ts` |
| Criar | `src/hooks/useFinancialIntelligence.ts` |
| Editar | `src/components/warroom/SystemColumn.tsx` (botões executar/aprovar) |
| Editar | `src/components/warroom/BusinessColumn.tsx` (intelligence cards) |
| Migration | Criar tabela `anamnese_respostas` |
| Criar | `src/pages/Anamnese.tsx` (formulário público PAR-Q) |
| Editar | `src/App.tsx` (rota `/anamnese/:token` sem layout) |
| Editar | `src/components/students/AddStudentDialog.tsx` (gerar link pós-cadastro) |
| Editar | `src/components/SupabaseStudents.tsx` (badge PAR-Q) |

## Sequencia

```text
1. Migration anamnese_respostas
2. Edge function agent-chat + config.toml
3. AIAgent.tsx com streaming real
4. useActionExecutor + SystemColumn com execução
5. useMarketingIntelligence + useFinancialIntelligence
6. Página pública /anamnese/:token
7. Integração no cadastro de aluno + badges
```

