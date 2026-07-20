## Plano de implementação

### 1. Corrigir acesso dos admins Sara e Rony de forma consistente
- Confirmado no banco: os dois usuários existem, estão com e-mail confirmado e `role = admin`.
- Atualizar o fluxo de senha usando uma ação confiável no Supabase para forçar novamente a senha `54967554` nos dois usuários.
- Ajustar a função `setup-users` para ficar idempotente e segura operacionalmente: recria/atualiza os dois admins, confirma e-mail, garante role `admin` e vínculos às organizações base quando existirem.
- Validar login real no preview com Playwright para os dois e-mails: login → redirecionamento para `/painel` → acesso a `/select-context`, `/sindico` e `/morador` sem travar/piscar.

### 2. Transformar `docs/marketing-funcional-9fit.md` em estrutura operacional dentro do app
- Criar uma tela/hub admin “Operação 9FIT” baseada no documento salvo, com:
  - posicionamento central “Portaria eletrônica do fitness”;
  - rotas reais por persona;
  - checklist de demo/venda;
  - “o que vender” e “o que nunca comunicar”;
  - atalhos diretos para Síndico, Coach, Morador, Corporate, Pipeline, Contratos, Relatório e Integração FitPro.
- Registrar rota protegida para admin, por exemplo `/operacao-9fit`.
- Adicionar item visível no menu admin: “Operação 9FIT”.

### 3. Completar as telas/fluxos com os anexos operacionais
- Síndico (`/sindico`): evoluir o relatório mensal para seguir o Doc 5:
  - adesão;
  - frequência/check-ins;
  - planos de treino;
  - plantão presencial;
  - financeiro resumido;
  - recomendações 9FIT;
  - exportação CSV mais completa.
- Coach (`/coach`): estruturar rotina operacional do Doc 2 e Doc 1:
  - fila de anamnese;
  - aprovação/criação de treino;
  - plantões/visitas;
  - checklist de QR instalado, comunicado enviado e contrato pendente/assinado.
- Morador (`/morador`): garantir que a entrega reflita o documento:
  - Hoje;
  - treino do dia;
  - check-in via QR/ação rápida;
  - aulas;
  - pagamentos;
  - comunicados/suporte.
- Admin/Painel (`/painel` + novo hub): conectar comercial, contratos, organizações, personas e documentação operacional.

### 4. Dados de uso e rastreabilidade
- Revisar se os fluxos principais registram eventos nas tabelas já existentes (`system_events`, `checkins`, `pessoa_eventos`, `agent_logs`) sem criar promessa fora de escopo.
- Quando necessário, adicionar registros leves de eventos nas ações principais: baixar relatório, trocar persona, solicitar cobrança, publicar comunicado, registrar check-in.

### 5. Validação final
- Rodar validação funcional no preview:
  - login com `roni.comercial19@gmail.com`;
  - login com `sarahthomannm@gmail.com`;
  - navegação `/painel` → `/select-context` → `/sindico` → `/morador`;
  - download CSV do síndico;
  - acesso ao novo hub “Operação 9FIT”.
- Corrigir qualquer loop/flicker encontrado antes de finalizar.

### Observação de escopo
Não vou implementar nesta rodada itens explicitamente fora de escopo no documento: assinatura eletrônica de contrato, portal público de onboarding automático de condomínios e BI agregado cross-condomínio.