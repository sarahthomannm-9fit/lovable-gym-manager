## Plano de implementação

Vou tratar isso como correção crítica de produto: deixar o sistema navegável, com rotas reais, estados de tela consistentes, personas funcionais e ações executivas registrando no banco com toast.

### 1. Estabilizar acesso, sessão e contexto operacional
- Corrigir o fluxo de `AuthProvider`, `OperationalContextProvider`, `ProtectedRoute` e `RoleRoute` para evitar telas presas em “Carregando”.
- Garantir que admin navegue por todas as interfaces sem depender de membership.
- Garantir que usuários não-admin entrem na persona correta via `organization_members`.
- Ajustar leitura de role/contexto para não falhar silenciosamente quando `user_roles` ou `organization_members` retornarem erro.
- Se necessário, aplicar ajuste mínimo de RLS/GRANT sem criar novas tabelas: permitir que usuário autenticado leia o próprio papel em `user_roles`, mantendo admin seguro.

### 2. Criar navegação única e consistente
- Criar uma fonte única de navegação para:
  - Admin/Core Gym Manager
  - Síndico
  - Morador/Aluno
  - Coach/Professor
  - Corporativo
  - Hub de Agentes IA
  - Painel Admin: Retenção, Inadimplência, Pipeline, Agenda
- Atualizar sidebar e navegação superior para usarem a mesma matriz de rotas.
- Remover links quebrados, duplicados ou que levam para estados vazios sem orientação.
- Garantir que todos os itens visíveis tenham rota real e tela renderizável.

### 3. Completar telas e estados de cada persona
Implementar telas com estados claros: carregando, vazio, erro, pronto, ação executando e sucesso.

#### Síndico
- Dashboard com métricas, inadimplentes, aulas, comunicados e chamados 9FIT.
- Fluxo de cobrança: registra em `support_tickets` + toast.
- Fluxo de comunicado: registra em `notificacoes` + toast.
- Visual baseado no HTML enviado de Síndico, adaptado ao design system atual.

#### Coach/Professor
- Dashboard “Meu dia” baseado no HTML enviado de Professor.
- Aulas de hoje, agenda, alunos, presença, treinos, histórico e feedback.
- Ação de presença: registra em `checkins` + toast.
- Ação de feedback: registra em `support_tickets` ou `pessoa_eventos` conforme encaixe existente, sem nova tabela.

#### Corporativo
- Resumo executivo, funcionários/elegíveis, engajamento, faturamento e exportação CSV.
- Solicitação de relatório executivo: registra em `support_tickets` + toast.
- Estados vazios quando não houver empresa, alunos ou pagamentos.

#### Morador/Aluno
- Área do aluno com próxima aula, pagamentos, presenças, comunicados e inscrição em aula.
- Inscrição: registra em `aulas_inscritos` + toast.
- Evitar fallback perigoso que mostra “primeiro aluno” para usuário comum; fallback só no preview admin.

### 4. Garantir painel admin comercializável
- Validar rotas do painel admin:
  - `/painel`
  - `/painel/retencao`
  - `/painel/inadimplencia`
  - `/painel/pipeline`
  - `/painel/agenda`
- Garantir que a sidebar exponha essas rotas claramente.
- Manter o core Gym Manager como admin/original, sem quebrar módulos existentes.

### 5. Modo simulação executivo
- Padronizar ações executivas para sempre:
  - validar dados mínimos;
  - registrar evento no banco existente (`support_tickets`, `system_events`, `notificacoes`, `checkins` ou `aulas_inscritos`);
  - exibir toast de sucesso/erro;
  - atualizar a lista/estado após ação.
- Não criar schema novo sem necessidade.

### 6. QA funcional final
- Validar rotas principais sem tela presa:
  - `/painel`
  - `/select-context`
  - `/sindico`
  - `/coach`
  - `/corp`
  - `/morador`
  - `/agents`
- Validar que admin consegue alternar entre todas as personas.
- Validar que cada persona tem conteúdo, estado vazio e ações funcionais.
- Validar console/network para identificar erros Supabase ou rotas quebradas.

## Arquivos principais a atualizar
- `src/App.tsx`
- `src/components/RoleRoute.tsx`
- `src/components/AppSidebar.tsx`
- `src/layouts/PersonaLayout.tsx`
- `src/hooks/useOperationalContext.tsx`
- `src/pages/SelectContext.tsx`
- `src/pages/sindico/SindicoHome.tsx`
- `src/pages/coach/CoachHome.tsx`
- `src/pages/corp/CorpHome.tsx`
- `src/pages/morador/MoradorHome.tsx`
- Possível novo arquivo de configuração: `src/config/navigation.ts`
- Possível novo hook utilitário: `src/hooks/usePersonaWorkspace.ts`

## Critério de aceite
- Nenhum link principal da sidebar/personas fica sem tela real.
- Admin consegue navegar por core, síndico, coach, corporativo e morador.
- Cada persona tem dashboard funcional com estados de loading/vazio/erro/pronto.
- Cada ação executiva grava no Supabase e exibe toast.
- O sistema deixa de travar em “Carregando” nas rotas de persona.