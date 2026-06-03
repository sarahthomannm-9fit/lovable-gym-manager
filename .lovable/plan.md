## Objetivo
Corrigir os fluxos de acesso das personas Síndico/Morador/Coach e transformar as telas/skills enviadas em experiências utilizáveis dentro do sistema, com agentes capazes de executar ações reais de forma controlada.

## Plano de implementação

1. **Corrigir rotas e fluxo de contexto das personas**
   - Ajustar o redirecionamento pós-login para levar cada papel ao fluxo correto: síndico, professor/coach, corporativo ou morador.
   - Corrigir `routeForRole` para usuário/morador ir para `/morador`, não para `/painel`.
   - Melhorar `/select-context` para admin e usuários comuns conseguirem acessar/previewar Síndico, Morador, Coach e Corporativo sem cair em tela vazia.
   - Revisar `RoleRoute` para evitar bloqueio indevido em `/morador` e reduzir loops de navegação.

2. **Estabilizar carregamento das telas Síndico/Morador/Coach**
   - Garantir que `ensureOrgForPersona` rode uma vez por persona sem depender de renderizações repetidas.
   - Em Síndico e Coach, carregar dados apenas quando o contexto estiver pronto.
   - Em Morador, adicionar fallback previsível para preview admin e vínculo por e-mail do aluno, sem piscar ou recarregar em loop.
   - Adicionar estados vazios claros quando não houver organização/aluno vinculado.

3. **Implementar as telas/personas solicitadas no prompt anterior**
   - Refinar **Síndico** com KPIs, inadimplência, aulas do dia, alunos, comunicados e solicitações à 9FIT.
   - Refinar **Coach/Professor** com agenda do dia, agenda 7 dias, alunos, presença, treinos e histórico.
   - Refinar **Morador/Aluno** com KPIs, próximas aulas, inscrições, pagamentos e comunicados.
   - Integrar a navegação dessas telas no menu lateral e na barra interna de personas.

4. **Adicionar a tela CFO/Leads enviada no HTML**
   - Criar uma página do plano CFO de extração de leads usando o conteúdo do arquivo `cfo_leads_extraction_plan.html` adaptado para React/Tailwind e design tokens.
   - Incluir métricas, tiers, funil financeiro, LTV, responsáveis e botões de ação.
   - Adicionar rota e item de menu, provavelmente em 9FIT/Marketing ou Hub de Agentes.

5. **Habilitar skills anexadas para os agentes**
   - Importar as definições das skills enviadas:
     - SDR Habilitor
     - Growth Manager Performance Marketing
     - Finance Contabilidade
     - Administrativo RH Junior
     - Mariana Skill
     - Instagram Story Funnel Optimizer
     - Supra Skill
   - Criar um catálogo interno de skills usado pelo Hub de Agentes.
   - Mapear skills para agentes existentes:
     - SDR Agent: `sdr-habilitor`, plano CFO/leads e `process_leads_v3.py` como lógica de geração de abordagem.
     - Billing/Financeiro: `finance-contabilidade`.
     - Content/Marketing: `growth-manager-performance-marketing` e `instagram-story-funnel-optimizer`.
     - Onboarding/Reativação/Suporte: `mariana-skill`.
     - RON Core: `supra-skill` como orquestração.
     - RH/Admin: `administrativo-rh-junior`.

6. **Permitir execução de ações nos agentes**
   - Atualizar a Edge Function `agent-hub-chat` para validar inputs com Zod e aceitar um modo de ação controlado.
   - Adicionar ações seguras por agente, por exemplo:
     - SDR: gerar mensagem personalizada para lead, marcar lead como contatado, agendar follow-up via `system_events`/logs.
     - Billing: criar notificação de cobrança e registrar log.
     - Content: criar rascunho em `content_drafts`.
     - Suporte: classificar/responder ticket.
     - RON Core: orquestrar e sugerir ação, sem mutação automática quando for arriscado.
   - Registrar todas as execuções em `agent_logs` com status, input/output e latência.
   - No frontend, mostrar botões de ações rápidas por agente e o resultado da execução.

7. **Conectar o plano CFO/leads aos agentes**
   - Usar o conteúdo do HTML e o script Python enviado como regra de negócio para gerar abordagens por categoria/persona.
   - Expor no Hub de Agentes ações como “Script Tier 1 LinkedIn” e “Cadência SDR Ironman”.
   - Opcionalmente salvar mensagens geradas como observação do lead ou rascunho de comunicação, dependendo do dado disponível no banco.

8. **Verificação final**
   - Validar navegação: `/login`, `/select-context`, `/sindico`, `/morador`, `/coach`, `/corp`, `/agents` e nova rota CFO.
   - Validar que as telas não ficam piscando e não redirecionam indevidamente.
   - Validar que os agentes conseguem responder e executar ações sem expor service role no frontend.

## Arquivos principais envolvidos
- `src/App.tsx`
- `src/components/AppSidebar.tsx`
- `src/layouts/PersonaLayout.tsx`
- `src/hooks/useOperationalContext.tsx`
- `src/pages/Login.tsx`
- `src/pages/SelectContext.tsx`
- `src/pages/sindico/SindicoHome.tsx`
- `src/pages/coach/CoachHome.tsx`
- `src/pages/morador/MoradorHome.tsx`
- `src/pages/AgentsHub.tsx`
- Nova página CFO/leads
- `supabase/functions/agent-hub-chat/index.ts`

## Observações técnicas
- Não vou mexer em `types.ts` manualmente.
- Se for necessário criar tabelas novas para skills/configurações persistentes, a migration terá `GRANT` imediatamente após cada `CREATE TABLE`.
- As ações dos agentes serão executadas server-side na Edge Function; o frontend nunca receberá `service_role_key`.