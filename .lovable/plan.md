## Diagnóstico do estado atual

Reproduzi o fluxo no preview e mapeei por que as telas não estão entregues:

1. **`/sindico` trava em "Carregando…"** — `useOperationalContext.load()` pode lançar (ex.: query a `organization_members` falha silenciosamente) e nunca chama `setLoading(false)`. Resultado: `RoleRoute` fica eternamente no skeleton.
2. **Admin sem `activeOrg` selecionada** entra em qualquer persona, mas o `useEffect` de cada dashboard tem `if (!activeOrg) return;` e a tela fica vazia, sem call-to-action.
3. **PersonaLayout não tem sidebar nem links cruzados** — quem entra como Síndico/Coach/Corp/Morador só vê o conteúdo da persona; não há como voltar ao Painel, abrir o Hub de Agentes ou navegar para Admin sem usar URL manual. O admin precisa de navegação livre entre todas as interfaces.
4. **Rota `/morador` desprotegida por papel** — qualquer authenticated entra, sem fallback de seleção de org para admin preview.
5. **Sidebar principal não expõe atalhos para as personas**, então a "navegação inconsistente" é real.
6. **Botões executivos** das personas (Solicitar cobrança, Publicar comunicado, etc.) já gravam em `support_tickets` / `notificacoes`, mas falham silenciosamente quando `activeOrg` está nulo.

## Mudanças propostas

### 1. Estabilizar o contexto operacional
- `useOperationalContext.tsx`: envolver `load()` em `try/finally` para garantir `setLoading(false)`. Logar erro no console.
- Quando `memberships` query falhar, retornar lista vazia em vez de quebrar.

### 2. Garantir org ativa quando admin entra em persona
- Criar helper `ensureOrgForPersona(tipo)` em `useOperationalContext` que, se `isAdmin && !activeOrg`, busca a primeira `organizations` do tipo correspondente e seta como ativa.
- Chamar dentro de `SindicoHome`, `CoachHome`, `CorpHome`, `MoradorHome` antes de carregar dados. Se ainda assim não houver org, renderizar empty state com botão "Selecionar organização" → `/select-context`.

### 3. PersonaLayout com navegação completa
- Adicionar barra de navegação superior com links: **Painel (admin)**, **Síndico**, **Coach**, **Corporativo**, **Morador**, **Hub de Agentes**, **Admin · Organizações** — visíveis apenas para admin; usuários não-admin veem apenas as personas que possuem membership.
- Manter botões "Trocar contexto" e "Sair".
- Mostrar selector compacto de organização (dropdown) quando o usuário tem múltiplas memberships do mesmo tipo OU é admin.

### 4. Sidebar principal expõe personas
- `AppSidebar.tsx`: nova categoria **"PERSONAS"** com itens Síndico / Coach / Corporativo / Morador / Selecionar contexto, visível para admin (e itens individuais para usuários com membership do papel correspondente).

### 5. Proteção e roteamento
- `App.tsx`: envolver `/morador` em `RoleRoute allow={['user','admin','sindico','corporate','professor']}` para aceitar qualquer authenticated mas registrar a entrada.
- Adicionar `/painel` como link direto no PersonaLayout para admin (atalho rápido).

### 6. Persona dashboards — robustez
Para cada um (`SindicoHome`, `CoachHome`, `CorpHome`, `MoradorHome`):
- Estado `pageStatus: 'loading' | 'no-org' | 'ready' | 'error'`.
- Empty state amigável quando `no-org` com CTA "Selecionar organização".
- Toast claro em falhas das ações (cobrança, comunicado, ticket).
- Garantir que botões fiquem desabilitados durante operações assíncronas.

### 7. SelectContext — fluxo
- Após admin clicar em "preview", se nenhuma org existe daquele tipo, criar empty state pedindo para cadastrar via `/admin/organizacoes` (já existe).
- Mostrar contador de orgs disponíveis em cada card.

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useOperationalContext.tsx` | try/finally em `load`, helper `ensureOrgForPersona` |
| `src/layouts/PersonaLayout.tsx` | navegação superior completa + selector de org |
| `src/components/AppSidebar.tsx` | nova categoria "PERSONAS" |
| `src/components/RoleRoute.tsx` | mensagem clara quando bloqueado |
| `src/pages/sindico/SindicoHome.tsx` | empty state, ensureOrg, status |
| `src/pages/coach/CoachHome.tsx` | idem |
| `src/pages/corp/CorpHome.tsx` | idem |
| `src/pages/morador/MoradorHome.tsx` | idem + proteção de rota |
| `src/pages/SelectContext.tsx` | contador, empty state |
| `src/App.tsx` | RoleRoute em `/morador` |

## Fora de escopo
- Não cria novas tabelas nem migrações (todos os recursos já existem no banco).
- Não altera regras de negócio dos agentes IA nem o Painel admin.
- Não muda estilo/design system — apenas adiciona elementos de navegação consistentes com o tema atual.

## Critério de aceitação
1. Admin entra em `/sindico`, `/coach`, `/corp`, `/morador` direto pela sidebar e a página renderiza dentro de 2s (sem ficar em "Carregando…").
2. Quando admin não selecionou org, cada persona puxa automaticamente uma org compatível ou mostra empty state com CTA.
3. PersonaLayout exibe atalhos para todas as outras personas + Painel + Hub de Agentes para admin.
4. Sidebar principal mostra atalhos para personas para admin.
5. Botões executivos (cobrança, comunicado, ticket, inscrição) geram registros no banco e mostram toast de sucesso/erro.
6. Usuário não-admin que não tem membership é redirecionado para `/select-context` com mensagem explicativa.