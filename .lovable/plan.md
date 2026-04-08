

# Plano: Finalizar FitManager — Vida Completa do Ecossistema

## Situacao Atual

O sistema ja tem:
- Business Engine + Automation Queue + Action Executor (motores 1-4 implementados)
- War Room 3 colunas (Critical, Business, System) funcionando
- PageShell em 8 telas core
- AI Agent com streaming real via Edge Function
- Marketing + Financial Intelligence hooks
- Anamnese/PAR-Q com link publico

**O que falta para o sistema "respirar":**

1. As telas de Marketing, Financeiro e 9FIT OS nao usam os engines — sao estaticas
2. O fluxo completo de conversao Lead -> Experimental -> Aluno nao esta conectado
3. Nenhuma tela de deep-dive do Control Plane existe (/painel/atrasos, /painel/agenda, etc.)
4. A sidebar nao reflete badges dinamicos de urgencia por secao
5. O Agente IA nao tem capacidade de executar acoes (so responde texto)
6. O onboarding inteligente (3 perguntas de calibracao) nao existe

---

## Bloco 1: Deep-Dive Routes do Control Plane (4 rotas novas)

Criar sub-paginas do painel que mostram o "zoom" de cada B.O.:

| Rota | O que mostra |
|------|-------------|
| `/painel/inadimplencia` | Lista completa de alunos inadimplentes por etapa da regua (D+1 a D+30+), com acoes inline (cobrar, negociar, cancelar). Usa `useBusinessEngine` para classificar. |
| `/painel/retencao` | Alunos sem frequencia agrupados por tier (7d, 14d, 21d, 30d). Acoes: mensagem, ligar, marcar resolvido. |
| `/painel/agenda` | Visao semanal de aulas com badges de estado (ok/sem instrutor/lotada/vazia). Drag to reschedule (futuro). |
| `/painel/pipeline` | Funil visual Lead -> Agendado -> Experimental -> Proposta -> Convertido. Cards movem entre colunas. |

Cada deep-dive usa PageShell com metrics relevantes e permite acao direta sem sair da pagina.

**Arquivos:**
- Criar `src/pages/painel/Inadimplencia.tsx`
- Criar `src/pages/painel/Retencao.tsx`
- Criar `src/pages/painel/AgendaSemanal.tsx`
- Criar `src/pages/painel/Pipeline.tsx`
- Editar `src/App.tsx` (4 rotas novas)
- Editar `src/pages/Painel.tsx` (links para deep-dives nos cards)

---

## Bloco 2: Marketing + Financeiro com Engines Vivos

As telas de marketing e financeiro precisam consumir os intelligence hooks e mostrar acoes, nao so dados.

### Marketing
- Editar `src/pages/marketing/Campanhas.tsx` — integrar `useMarketingIntelligence`, mostrar banner de insights no topo, badges de ROI por campanha
- Editar `src/pages/marketing/Captacao.tsx` — integrar `useBusinessEngine` leads classificados, temperatura visual (borda quente/morno/frio), acao inline de contato
- Editar `src/pages/marketing/InsightsIA.tsx` — alimentar com dados reais do hook ao inves de estaticos
- Editar `src/pages/marketing/Automacao.tsx` — mostrar `useAutomationQueue` items do tipo remarketing com botao executar

### Financeiro
- Editar `src/pages/Relatorios.tsx` — integrar `useFinancialIntelligence`, health score visivel, alertas no topo
- Editar `src/pages/relatorios/Cobrancas.tsx` — usar `useBusinessEngine` pagamentos classificados por etapa, mostrar regua visual
- Editar `src/pages/relatorios/EstrategiasIA.tsx` — consumir financial intelligence alerts como cards de acao

---

## Bloco 3: Fluxo Lead -> Aluno Conectado

Hoje, converter um lead em aluno sao processos separados. Conectar:

- Editar `src/pages/AulasExperimentais.tsx` — adicionar botao "Converter em Aluno" que pre-preenche `AddStudentDialog` com dados do lead/experimental (nome, email, telefone)
- Editar `src/components/students/AddStudentDialog.tsx` — aceitar `defaultValues` prop para pre-preenchimento vindo de conversao
- Ao converter: atualizar status do lead para "convertido", atualizar experimental para "convertido", gerar token de anamnese automaticamente
- Registrar `system_event` tipo `lead.converted` com metadata

**Arquivos:**
- Editar `src/pages/AulasExperimentais.tsx`
- Editar `src/components/students/AddStudentDialog.tsx`

---

## Bloco 4: Sidebar com Badges Dinamicos

A sidebar precisa mostrar urgencia por secao sem o usuario abrir cada pagina:

- Editar `src/components/AppSidebar.tsx`:
  - Consumir `useDataIntegration()` para contar alertas por area
  - Badge vermelho em "Pagamentos" se ha inadimplentes
  - Badge amarelo em "Alunos" se ha alunos sem frequencia
  - Badge em "Captacao" se ha leads quentes sem follow-up
  - Badge em "Aulas" se ha aula sem instrutor

---

## Bloco 5: Agente IA com Capacidade de Acao

O agente responde texto mas nao executa. Adicionar:

- Editar `src/components/AIAgent.tsx`:
  - Adicionar "Quick Actions" pre-definidas que o agente pode sugerir como botoes clicaveis:
    - "Executar cobranca em lote" -> chama `useActionExecutor`
    - "Ver alunos em risco" -> navega para `/painel/retencao`
    - "Criar campanha de remarketing" -> navega para `/marketing/campanhas`
  - Quando o agente menciona uma acao, renderizar como botao inline na resposta
  - Adicionar contexto do `useBusinessEngine` (criticos, atencao, oportunidades) ao prompt

---

## Bloco 6: Onboarding Inteligente (Calibracao)

Primeira vez que abre o sistema, 3 perguntas que calibram o contexto:

- Criar `src/components/OnboardingWizard.tsx`:
  - Pergunta 1: "Quantos alunos voce tem?" (0-10, 10-50, 50-100, 100+)
  - Pergunta 2: "Como voce cobra?" (Manual/Pix, Recorrencia, Boleto, Misto)
  - Pergunta 3: "Voce trabalha solo ou tem equipe?" (Solo, 1-3, 4+)
  - Salva em `localStorage` key `fitmanager_onboarding`
  - Resultado ajusta prioridade de alertas no painel (ex: solo = esconde alertas de equipe)
- Editar `src/pages/Painel.tsx` — verificar se onboarding foi feito, se nao mostrar wizard

---

## Bloco 7: Estados Visuais Completos nas Telas Restantes

Telas que ainda nao tem estados visuais completos (critical/empty/loading):

- `src/pages/Funcionarios.tsx` — PageShell + empty state "Cadastrar primeiro funcionario"
- `src/pages/AvaliacoesFisicas.tsx` — PageShell + badge "pendentes" 
- `src/components/Equipment.tsx` — PageShell + estado critico se equipamento em manutencao
- `src/pages/Produtos.tsx` — PageShell + metrics

---

## Sequencia de Implementacao

```text
1. Sidebar badges dinamicos               (base visual)
2. Deep-dive routes do Control Plane       (4 paginas)
3. Marketing + Financeiro com engines      (6 edits)
4. Fluxo Lead -> Aluno conectado           (conversao)
5. Agente IA com acoes                     (interacao)
6. Onboarding inteligente                  (calibracao)
7. Estados visuais telas restantes         (consistencia)
```

## Total de Arquivos

| Acao | Qtd |
|------|-----|
| Criar | 5 (4 deep-dives + onboarding) |
| Editar | ~15 (sidebar, marketing, financeiro, agent, painel, experimentais, etc.) |

Sem migrations — toda logica e frontend consumindo dados existentes do Supabase via hooks ja implementados.

