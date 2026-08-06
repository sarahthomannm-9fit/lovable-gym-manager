# 9FIT — Reorganização do menu, RPCs de dashboard e validação das personas

Objetivo: aplicar a estrutura enviada (menu reorganizado + prompts) sobre os fluxos já existentes, ligar os painéis das personas às funções oficiais do banco e validar login/acesso de ponta a ponta.

## Estado atual verificado

- Organizações: 4 ativas, sem duplicidade (Central Park, TechCorp, Studio Personal 9FIT, Studio Premium SP). Os registros duplicados citados no chat não existem mais.
- Vínculos: Sara tem `admin` + `sindico` no Central Park (papel duplicado), além de professor/corporate nas demais. Rony tem manager/sindico/professor/corporate.
- Dashboards: `dashboard_sindico`, `dashboard_coach`, `dashboard_morador` existem no banco, mas só o Studio usa RPC. Síndico, Coach, Morador e Corporativo montam tudo com consultas soltas nas tabelas.
- Menu: várias entradas da estrutura enviada ainda não existem (Mercados, Relatórios automáticos, Produtos & Equipamentos agrupados) e nomes divergem.

## O que será feito

### 1. Limpeza de vínculos (migração)
- Remover o papel `sindico` duplicado da Sara no Central Park (ela já é `admin` lá).
- Garantir unicidade de papel por (organização, usuário, papel) permanece intacta.

### 2. Menu reorganizado conforme o arquivo enviado
Reescrever a navegação do sidebar nas seções:
- **Central de Operações** (renomeia "Control Plane"): Control Plane, Pipeline comercial, Clientes ativos, Alunos, Check-in.
- **Assessoria Esportiva** (nova): Aulas, Planos de treino, Treinos, Avaliações físicas, Aulas experimentais, Coaches.
- **Mercados** (nova): Condomínios, Corporativo, Estúdios/Academias — cada uma abre uma lista de organizações daquele tipo com KPIs.
- **Financeiro**: acrescenta Contratos & Propostas; mantém o resto.
- **Marketing & Captação**: mantém, remove "Insights IA" do menu.
- **Inteligência 9FIT**: Hub de Agentes, RON — Agente CEO (renomeia), Insights por mercado, Plano CFO, Relatórios automáticos (novo).
- **Personas**: Síndico, Coach, Corporativo, Morador, Trocar contexto.
- **Administração**: Usuários, Organizações, Produtos & Equipamentos; Integração FitPro sai do menu (rota continua acessível).

### 3. Telas novas
- `/mercados/:tipo` — lista organizações do tipo com alunos ativos, receita do mês, adesão e atalho para o painel da persona.
- `/relatorios/automaticos` — leitura de `agent_reports` com filtro por agente/data e geração sob demanda.

### 4. Painéis das personas ligados às RPCs
- Síndico, Coach e Morador passam a carregar os números principais via `supabase.rpc('dashboard_sindico'|'dashboard_coach'|'dashboard_morador')`, mantendo as consultas complementares só para listas e ações (check-in, tickets, aprovação de treino).
- Corporativo usa `dashboard_sindico` da organização corporativa.
- Tratamento de erro e estado vazio padronizados, sem tela travada em "Carregando".

### 5. Validação autenticada
- Executar o fluxo real com a sessão do preview: login → `/painel` → `/sindico` → `/coach` → `/corp` → `/morador` → `/select-context`, com screenshots e verificação de console/rede.
- Conferir que cada persona vê dados (não vazio) e que as ações principais gravam no banco.

## Detalhes técnicos

- Arquivos principais: `src/components/AppSidebar.tsx`, `src/App.tsx`, `src/pages/sindico/SindicoHome.tsx`, `src/pages/coach/CoachHome.tsx`, `src/pages/morador/MoradorHome.tsx`, `src/pages/corp/CorpHome.tsx`, novos `src/pages/mercados/MercadoLista.tsx` e `src/pages/relatorios/RelatoriosAutomaticos.tsx`.
- Uma única migração: `DELETE` do vínculo duplicado. Nenhuma mudança de schema é necessária — as RPCs e políticas já existem.
- Nenhuma alteração em `types.ts` (gerado pelo Supabase).
