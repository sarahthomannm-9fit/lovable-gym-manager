# Dossiê — Auditoria e correção do fluxo de condomínios

Projeto: `jobytedbdptuncvobarw`
Repositório: `sarahthomannm-9fit/lovable-gym-manager`
Branch: `main`

## Objetivo

O administrador deve conseguir executar o fluxo inteiro sem cadastrar usuários em outra tela:

`Criar condomínio → cadastrar síndico → cadastrar coach → cadastrar/importar moradores → gerar acessos → aceitar convite → liberar acesso por persona`.

## Problemas encontrados

1. A tela antiga exigia selecionar um usuário já existente em “Membros”. Isso bloqueava o cadastro de novas pessoas.
2. A RPC `create_organization_invite` recebia `app_role` diretamente, causando respostas HTTP 400 quando o PostgREST não convertia o papel enviado.
3. A autorização da RPC dependia de `public.is_admin`, embora a interface reconhecesse o administrador por outra leitura.
4. O convite era apenas criado no banco; não havia envio automático de e-mail.
5. O aceite não conferia se o e-mail autenticado era o mesmo do convite.
6. O telefone informado no onboarding não era persistido em perfil.
7. O morador dependia da Edge Function `link-aluno-user` para associação ao registro em `alunos`.

## Correção de banco obrigatória

Aplicar no projeto Supabase correto a migration:

`supabase/migrations/20260915180000_harden_organization_invites.sql`

Essa migration:

- recria a RPC com `p_papel TEXT`;
- aceita apenas `sindico`, `professor` e `user`;
- valida e-mail;
- verifica admin diretamente em `user_roles`;
- verifica se o condomínio existe;
- evita convite pendente duplicado;
- valida o e-mail da conta no aceite;
- cria o vínculo em `organization_members`.

## Correção de frontend publicada

Arquivos atualizados na `main`:

- `src/pages/admin/OrganizationsAdmin.tsx`
- `src/pages/mercados/MercadoLista.tsx`
- `src/hooks/useOperationalContext.tsx`
- `src/components/AppSidebar.tsx`

O onboarding agora coleta diretamente os dados do síndico e do coach e abre o condomínio correto para administrar as personas.

## Pendências de produto

- Configurar SMTP/Resend para envio real de e-mail.
- Criar conta/primeiro acesso automaticamente para convidados.
- Persistir telefone de síndico e coach em `profiles`.
- Remover definitivamente o formulário antigo de “Adicionar membro”.
- Vincular morador a `alunos.user_id` após aceite ou primeiro login.
- Exibir erro original da RPC, sem mascarar como “e-mail inválido”.

## Teste de aceite

1. Entrar como Sarah com papel `admin`.
2. Criar um condomínio novo.
3. Informar síndico com e-mail válido.
4. Confirmar que a RPC não retorna 400.
5. Confirmar registro em `organization_invites` com papel `sindico`.
6. Criar convite de coach com papel `professor`.
7. Criar convite de morador com papel `user`.
8. Aceitar cada convite com a conta correspondente.
9. Confirmar registros em `organization_members`.
10. Confirmar acesso correto às rotas `/sindico`, `/coach` e `/morador`.

## Verificação do administrador

```sql
select ur.user_id, ur.role, u.email
from public.user_roles ur
join auth.users u on u.id = ur.user_id
where lower(u.email) = lower('EMAIL_DA_SARAH');
```

O resultado precisa conter `role = admin`.

