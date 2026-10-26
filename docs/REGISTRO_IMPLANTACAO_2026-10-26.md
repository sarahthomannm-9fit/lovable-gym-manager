# Implantação — 26/10/2026

## Publicação comprovada

- Repositório oficial: `sarahthomannm-9fit/lovable-gym-manager`, branch `main`.
- Código publicado: `f582668b9e2059145d586adcbc3456220f72a079`.
- Aplicativo: https://lovable-gym-manager.lovable.app
- Identidade consultada no domínio publicado: `/build-info.json` retornou revisão `f582668b9e20`, ambiente `production`, `localChanges: false`, geração `2026-10-26T21:51:15.021Z` (18:51:15 em São Paulo).
- Build local do Vite concluído. Há aviso de tamanho do bundle, sem impedimento de compilação.

Não foram criados nem executados testes automatizados nesta rodada. Confirmação de publicação, retorno da API administrativa do Auth e leitura de cadastros não substituem a QA funcional das quatro personas, que permanece com o responsável.

## Banco implantado

Projeto Supabase do produto: `jobytedbdptuncvobarw`. O projeto separado da Staff não foi alterado.

| Migration local | Versão registrada no banco |
|---|---|
| `20261026201623_close_condominium_authorization_gaps.sql` | `20261026215023` |
| `20261026201955_unify_condominium_dashboard_metrics.sql` | `20261026215032` |
| `20261026202149_protect_persona_transitions_and_consent.sql` | `20261026215035` |
| `20261026203705_idempotent_resident_operations_and_credit_ledger.sql` | `20261026215038` |
| `20261026213306_enforce_commercial_operation_prerequisites.sql` | `20261026215041` |

As cinco aplicações retornaram sucesso. A diferença de timestamps decorre da aplicação via conector. Conciliar esse histórico antes de futuros deploys por CLI; não reaplicar migrations por divergência do nome local. As doze migrations anteriores da conversa já estavam no banco e não foram reaplicadas.

## Funções publicadas

`manage-users` v26; `send-organization-invite` v7; `agent-daily-reports` v21; `agent-workflow-worker` v15; `staff-booking` v2; `staff-webhook` v5.

O provisionamento de senhas usou a API administrativa do Auth, com função temporária limitada às contas expressamente indicadas e autenticada por segredo aleatório de curta duração. Ao terminar, a função `pilot-access-provisioning` foi substituída por resposta 410 e passou a exigir JWT. Não resta operação de provisionamento disponível nesse endpoint. Senhas e segredos não foram gravados no repositório.

## Configuração real do piloto

As contas indicadas pelo responsável foram preparadas para síndico, coach, morador e admin. O síndico recebeu vínculo no Maison Guimet; o coach já possuía vínculo e recebeu o cadastro profissional ativo que faltava; o morador recebeu conta, cadastro e vínculo. A conta administrativa existente teve apenas a senha redefinida a pedido. Nenhuma das três outras contas recebeu privilégio global de admin. Credenciais foram entregues ao responsável no chat.

## Entrega operacional ainda pendente

Faltam os dados e a execução reais: WhatsApp e horário de suporte; áreas autorizadas; serviços contratados; infraestrutura aprovada; agenda de aulas; Health Day; consentimento e triagem do morador; revisão e publicação do treino pelo profissional. Nenhuma dessas entregas foi simulada ou marcada como realizada.

O painel administrativo mostra os pré-requisitos e bloqueia a ativação enquanto estiverem incompletos. Publicação do aplicativo não equivale a aprovação comercial. O próximo passo é preencher a operação real e o responsável fazer a QA dos quatro acessos.
