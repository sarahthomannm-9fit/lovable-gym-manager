
## Plano

### 1. Corrigir bug de "piscar" (flicker)
O preview fica piscando porque os providers de auth/contexto operacional re-renderizam em loop quando `ensureOrgForPersona` muda estado a cada render. Vou:
- Em `useOperationalContext.tsx`: estabilizar `ensureOrgForPersona` com `useCallback` sem dependências mutáveis; usar ref para `activeOrg`; só chamar `setActiveOrg` quando o id realmente muda.
- Em `AuthContext.tsx`: garantir que `setSession` só dispara em mudança real (evita cascata).
- Nas 3 home pages (Sindico/Coach/Corp): chamar `ensureOrgForPersona` apenas uma vez via `useEffect` com array `[]` + guard.

### 2. Banco — novas tabelas para integração FitPro
Migration criando:

**`fitmanager_connections`**
- id uuid PK, professor_id uuid (refs auth.users), api_key_hash text, api_key_prefix text (8 chars visíveis), status text ('active'|'revoked'), last_sync_at timestamptz, created_at, updated_at
- RLS: professor lê/gerencia só as próprias; admin gerencia todas; service_role full
- GRANTs para authenticated + service_role
- Índice em api_key_hash

**`fitmanager_events`**
- id uuid PK, connection_id uuid (FK), event_type text, fitpro_student_id text, fitpro_professor_id text, payload jsonb, created_at
- RLS: professor lê eventos da própria conexão; admin lê todos
- GRANTs

### 3. Edge function `fitmanager-api`
`supabase/functions/fitmanager-api/index.ts` com:
- CORS via `npm:@supabase/supabase-js@2/cors`
- Roteamento manual pelo `url.pathname` (sem framework)
- Validação de inputs com Zod (`npm:zod`)
- Auth: lê `x-api-key`, faz `sha256` e busca por `api_key_hash`. Se inválida → 401 genérico. Atualiza `last_sync_at`.
- Endpoints:
  - `GET /v1/health` → status público
  - `POST /v1/fitpro/connect` → registra metadados iniciais, retorna info da conexão
  - `POST /v1/fitpro/sync` → grava evento `sync`
  - `POST /v1/fitpro/student-context` → busca aluno por id/email e retorna treinos/checkins
  - `GET /v1/fitpro/students` → lista alunos do professor
  - `GET /v1/fitpro/classes` → lista aulas do professor
  - `POST /v1/fitpro/check-in` → cria registro em `checkins`
  - `GET /v1/fitpro/student-checkins` → checkins do aluno
- Toda chamada grava em `fitmanager_events`
- `verify_jwt = false` (auth via api-key)

### 4. Geração de API Key (server-side)
Edge function adicional `fitmanager-api-key` (chamada pelo admin autenticado via JWT):
- `POST /generate` → gera chave aleatória `fm_live_<32 bytes hex>`, salva hash sha256 + prefix, retorna chave bruta UMA vez
- `POST /rotate` → revoga atual + gera nova
- `POST /revoke` → marca status='revoked'

### 5. UI Admin "Integração com FitPro"
- Nova página `src/pages/admin/FitProIntegration.tsx`
- Rota `/admin/fitpro` em `App.tsx` (admin only)
- Item no sidebar
- Componentes:
  - Card "Sua API Key": botão Gerar/Rotacionar/Revogar, status, prefixo, last_sync_at
  - Dialog mostrando chave bruta com copy-to-clipboard (mostrada uma vez)
  - Tabela últimos 20 eventos (`fitmanager_events`)
  - Documentação básica dos endpoints

### 6. QA
- Verificar que flicker sumiu no `/painel` e personas
- `curl` no `/v1/health` e `/v1/fitpro/students` com api-key gerada

## Arquivos
- `src/hooks/useOperationalContext.tsx` (fix flicker)
- `src/contexts/AuthContext.tsx` (fix flicker)
- `src/pages/sindico/SindicoHome.tsx`, `coach/CoachHome.tsx`, `corp/CorpHome.tsx` (guard effect)
- Migration nova
- `supabase/functions/fitmanager-api/index.ts`
- `supabase/functions/fitmanager-api-key/index.ts`
- `src/pages/admin/FitProIntegration.tsx`
- `src/App.tsx`, `src/components/AppSidebar.tsx`
