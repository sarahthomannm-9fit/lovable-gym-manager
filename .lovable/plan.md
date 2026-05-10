
# Plano: Modos Operacionais do GymManager (Admin / Síndico / Professor / Corporate)

## Princípio

O GymManager continua sendo **a base** — todo o código atual (alunos, pagamentos, aulas, agentes IA, marketing) permanece. Adicionamos uma **camada de contexto** que:

1. Identifica o papel do usuário no login.
2. Escolhe a organização (se ele pertence a mais de uma).
3. Renderiza um **layout/dashboard dedicado** para a persona, lendo dos mesmos dados.
4. Restringe acesso por RLS (cada persona só vê o que pode).

**Apenas Admin acessa o sistema completo.** Os outros entram em uma "casca" focada na função deles.

```text
            LOGIN
              │
   ┌──────────┴──────────┐
   │  Detecta papéis     │
   └──────────┬──────────┘
              │
   ┌──────────┼──────────┬──────────┐
   ▼          ▼          ▼          ▼
 ADMIN     SÍNDICO   PROFESSOR  CORPORATE(RH)
 /painel   /sindico  /coach    /corp
 (full)    (read-    (gestão   (read-only
           mostly)   própria)  empresa)
```

## 1. Banco de dados (1 migration)

### 1.1 Expandir o enum de papéis

```sql
ALTER TYPE app_role ADD VALUE 'sindico';
ALTER TYPE app_role ADD VALUE 'professor';
ALTER TYPE app_role ADD VALUE 'corporate';
```

### 1.2 Tabela `organizations`

Representa qualquer "cliente operacional": condomínio, empresa corporativa, ou negócio de um professor.

```sql
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,            -- 'condominio' | 'corporate' | 'professor' | 'studio'
  cnpj text,
  contato_nome text,
  contato_email text,
  contato_telefone text,
  status text DEFAULT 'ativo',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

### 1.3 Tabela `organization_members`

Liga usuário ↔ organização ↔ papel naquela org. Um usuário pode ser síndico de 2 condomínios; admin global tem acesso transversal.

```sql
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  papel app_role NOT NULL,       -- sindico | professor | corporate
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id, papel)
);
```

### 1.4 Escopo dos alunos

```sql
ALTER TABLE public.alunos ADD COLUMN organization_id uuid REFERENCES organizations(id);
CREATE INDEX idx_alunos_org ON public.alunos(organization_id);
```

Alunos antigos ficam com `NULL` e continuam visíveis apenas para Admin.

### 1.5 Função helper + RLS

```sql
CREATE FUNCTION public.user_has_org(_user uuid, _org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = _user AND organization_id = _org
  );
$$;
```

RLS em `organizations` e `organization_members`: admin vê tudo (`is_admin(auth.uid())`); demais veem apenas as orgs onde têm membership.

## 2. Frontend — camada de contexto

### 2.1 Hook `useOperationalContext`

Retorna `{ role, organizationId, organization, switchOrg() }`. Lê:
- papel global em `user_roles` (admin tem prioridade);
- memberships em `organization_members`;
- org selecionada em `localStorage` (`9fit:active_org`).

### 2.2 Tela de seleção `/select-context`

Mostrada após login **se** o usuário tem múltiplos papéis ou pertence a múltiplas orgs. Cards grandes com o tipo (Condomínio X, Empresa Y, Meu negócio…). Admin vê um botão extra "Acessar como Admin (visão completa)".

### 2.3 Roteamento por persona em `App.tsx`

Adicionar três grupos de rotas, cada uma com seu **layout próprio** (não a `AppSidebar` atual):

| Persona | Rota base | Layout | Páginas iniciais |
|---|---|---|---|
| Admin | `/painel`, `/alunos`, … | `AppSidebar` (atual, intacto) | tudo que já existe |
| Síndico | `/sindico` | `SindicoLayout` (header simples, sem sidebar) | Visão Geral, Alunos do Condomínio, Aulas da Semana, Comunicados |
| Professor | `/coach` | `CoachLayout` (mobile-first) | Hoje, Meus Alunos, Minhas Aulas, Receitas |
| Corporate | `/corp` | `CorpLayout` (read-only executivo) | Visão Geral, Funcionários Ativos, Adesão, Relatório Mensal |

Guard `RoleRoute`: se papel ≠ esperado, redireciona para `/select-context`.

### 2.4 Login redireciona pelo papel

Em `Login.tsx` após `signInWithPassword`:

```ts
const role = await fetchPrimaryRole();
const memberships = await fetchMemberships();
if (role === 'admin') navigate('/painel');
else if (memberships.length > 1) navigate('/select-context');
else navigate(routeForRole(role));
```

## 3. Conteúdo de cada modo (v1 pragmática)

### Admin (sem mudança)
Continua usando `AppSidebar` com tudo. Ganha apenas duas seções novas no menu: **Organizações** (CRUD em `organizations`) e **Membros** (atribuir usuário→org→papel).

### Síndico — `/sindico`
Read-mostly. 4 cards de KPI do condomínio (alunos ativos, presença na semana, aulas confirmadas, comunicados pendentes) + lista dos alunos do condomínio + agenda da semana. Botão único de ação: "Solicitar à equipe 9FIT" (cria `support_ticket` com `category='condominio'`).

### Professor — `/coach`
Mobile-first. Tabs: **Hoje** (aulas do dia + check-in rápido), **Alunos** (apenas os vinculados a ele via `aulas`/`treinos`), **Receita** (lista de pagamentos onde ele é o profissional). Reutiliza componentes existentes filtrados.

### Corporate (RH) — `/corp`
Read-only executivo. KPIs da empresa (funcionários elegíveis, adesão %, sessões/mês, NPS) + tabela de funcionários ativos + botão "Baixar relatório PDF" (usa edge function existente / a criar depois). Sem ações operacionais.

## 4. Segurança

- RLS de `alunos` mantém Admin com acesso total; síndico/professor/corporate veem apenas registros com `organization_id` ∈ suas memberships.
- Edge functions já autenticadas continuam usando `getUser()`.
- A seleção de org é validada server-side em todas as queries (não confiar no `localStorage`).

## 5. Ordem de execução

1. Migration (enum + 2 tabelas + coluna em alunos + RLS).
2. Hook `useOperationalContext` + tela `/select-context`.
3. Layouts (`SindicoLayout`, `CoachLayout`, `CorpLayout`) — cada um é um shell de 80 linhas.
4. Páginas v1 de cada persona (1 dashboard com dados reais via Supabase scoped).
5. Roteamento + guards + redirect no login.
6. CRUD de organizações e membros para o Admin.

## Fora do escopo desta entrega

- Pricing/billing automatizado por organização.
- White-label visual por org (logo/cor próprios).
- Mobile app nativo do professor.
- Integração com WhatsApp/Instagram dos agentes (segue na próxima rodada).

## O que NÃO muda

Tudo que o Admin já usa hoje (`/painel`, `/alunos`, `/agents`, marketing, relatórios). Os novos modos são **adições paralelas**, não refatoração.
