# Dossiê — Fluxo de condomínios e acessos

## Objetivo

Garantir que a administradora consiga cadastrar um condomínio e liberar os acessos sem precisar criar usuários manualmente antes.

## Fluxo esperado

**Admin**
→ cria o condomínio
→ informa o síndico responsável
→ gera o convite
→ envia o link por e-mail

**Síndico**
→ acessa o link
→ cria ou confirma o acesso
→ informa nome e telefone no primeiro acesso
→ entra no painel do condomínio

**Coach**
→ recebe convite com papel de coach
→ realiza o primeiro acesso
→ entra no fluxo operacional de treinos e alunos

**Morador**
→ é cadastrado individualmente ou via CSV
→ recebe convite
→ realiza o primeiro acesso
→ fica vinculado ao condomínio

## Estado atual do código

O código já foi publicado na branch `main` do repositório `sarahthomannm-9fit/lovable-gym-manager`.

Implementado:

- lista de condomínios carregando todas as organizações para administradores;
- abertura direta do condomínio pela tela de mercados;
- onboarding guiado de condomínio;
- cadastro de síndico e coach no mesmo fluxo;
- cadastro individual e importação de moradores por CSV;
- convite público com redirecionamento para login;
- primeiro acesso com nome e telefone;
- vinculação do usuário ao condomínio após aceitar o convite;
- painel inicial conforme o contexto operacional;
- status de entrega dos convites;
- expiração de convites vencidos;
- fallback da tela enquanto a tabela de entregas ainda não foi criada;
- organização visual da barra lateral em ação principal e intra-fluxos.

## Pendências técnicas

### 1. Criar a tabela base de convites

Migration necessária:

`supabase/migrations/20260907400000_organization_invites.sql`

→ cria `public.organization_invites`
→ permite gerar tokens
→ permite registrar e aceitar convites

### 2. Aplicar o endurecimento de convites

Migration:

`supabase/migrations/20260915180000_harden_organization_invites.sql`

→ valida e-mail
→ limita papéis válidos
→ evita convites pendentes duplicados
→ corrige permissões administrativas

### 3. Aplicar o Lote 1

Migration:

`supabase/migrations/20260920130000_batch1_condominium_security.sql`

→ cria índices
→ reforça RLS
→ habilita expiração automática
→ melhora a leitura de condomínios e membros

### 4. Aplicar a vinculação de moradores

Migration:

`supabase/migrations/20260920120000_complete_resident_invite_link.sql`

→ aceita o convite
→ cria o vínculo em `organization_members`
→ atualiza o perfil
→ vincula o morador ao registro correspondente

### 5. Aplicar o Lote 5

Migration:

`supabase/migrations/20260920140000_batch5_invite_delivery_tracking.sql`

→ cria `organization_invite_deliveries`
→ registra tentativas de envio
→ mostra status `sent`, `failed` ou `not_configured`

### 6. Configurar o provedor de e-mail

No Supabase, configurar:

`RESEND_API_KEY`
→ autoriza o envio

`RESEND_FROM_EMAIL`
→ define o remetente verificado

`APP_URL`
→ faz o link apontar para o Manager correto

`SUPABASE_SERVICE_ROLE_KEY`
→ permite registrar o resultado do envio com segurança

### 7. Publicar a Edge Function

`supabase/functions/send-organization-invite/index.ts`

→ recebe o convite criado
→ monta o link `/convite/:token`
→ envia o e-mail
→ registra sucesso ou falha

## Ordem segura de execução

Migration base
→ endurecimento de convites
→ vinculação de moradores
→ Lote 1
→ Lote 5
→ variáveis do Resend
→ deploy da Edge Function
→ teste de convite de síndico
→ teste de coach
→ teste de morador

## Critérios de aceite

- Admin consegue criar um condomínio sem selecionar usuário previamente.
- E-mail inválido é recusado com mensagem clara.
- Síndico recebe link apontando para o Manager.
- Link não abre o Lovable como destino final.
- Usuário não autenticado é levado ao login e retorna ao convite.
- Primeiro acesso solicita nome e telefone.
- Após aceitar, o usuário aparece como membro do condomínio.
- Morador importado por CSV recebe convite correspondente.
- Convite vencido não pode ser aceito.
- Administrador consegue ver o status da entrega.
- Reenvio não cria duplicidade pendente.

## Bloqueio atual

O código está publicado, mas a ativação do banco ainda depende da execução das migrations no projeto Supabase `jobytedbdptuncvobarw`.

Sem aplicar a migration base:

`organization_invites` não existe
→ a RPC de convite retorna erro 400 ou 42P01
→ o e-mail não pode ser enviado

Sem aplicar o Lote 5:

`organization_invite_deliveries` não existe
→ o rastreamento detalhado fica indisponível
→ o fallback da interface mantém a tela funcionando, mas não registra a entrega.

## Próximo passo

Executar as migrations na ordem indicada, configurar o Resend, publicar a Edge Function e validar um convite real de síndico do início ao fim.

