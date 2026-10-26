# Fase 1 — Morador

Atualizado em 26/10/2026 após implementação. Escopo: telas → ações → dados/permissões → lacunas → critérios de conclusão. A QA visual das quatro contas será realizada pelo usuário.

| Tela / rota | Ações implementadas | Dados e permissão |
|---|---|---|
| Entrada `/entrada` | Selecionar condomínio, informar nome/unidade/e-mail, solicitar confirmação e iniciar vínculo autenticado. | Catálogo público mínimo; cadastro somente para o e-mail confirmado da sessão. |
| Convite `/convite/:token` | Criar conta ou entrar, aceitar convite válido e abrir triagem. | Token, validade e e-mail verificados no servidor. |
| Triagem `/morador/onboarding` | Consentimento, restrições, lesões, histórico, cirurgias, dor, alertas, observações e objetivo; concluir cadastro. | Próprio aluno e condomínio; casos de risco entram na revisão profissional. |
| Hoje `/morador` | Check-in diário, abrir treino e eventos, consultar comunicados e indicadores pessoais. | Próprio vínculo; consultas filtradas pelo condomínio. |
| Meu treino, aba do painel | Iniciar, marcar exercícios, registrar carga, salvar progresso, pausar, retomar, concluir e enviar feedback; abrir vídeo HTTPS. | Treino vigente e sessão do próprio aluno; validação dos exercícios no servidor. |
| Aulas, aba do painel | Inscrever e cancelar inscrição; consultar capacidade e presença. | Aula futura da organização, sem ultrapassar vagas ou duplicar matrícula. |
| Eventos `/morador/eventos` | Inscrever, lista de espera, cancelar e fazer check-in no horário. | Evento publicado e próprio aluno do condomínio. |
| Agenda `/morador/agenda` | Consultar próximos eventos e abrir inscrição. | Agenda da organização ativa. |
| Reservas e serviços `/morador/operacao` | Reservar área, consultar histórico, cancelar reserva futura, solicitar serviço, aceitar orçamento e cancelar solicitação. | Próprio aluno; conflito de horários bloqueado; cobrança criada somente no aceite. |
| Profissionais `/morador/staff` | Consultar métodos/profissionais, escolher data, solicitar reserva, atualizar confirmação e pedir cancelamento. | Reserva e crédito no servidor; falhas confirmadas geram estorno único. |
| Suporte, aba do painel | Abrir WhatsApp configurado ou criar e acompanhar chamado interno. | Chamados do próprio solicitante/condomínio. |
| Mais e perfil `/morador/perfil` | Consultar cobranças, marcar aviso lido, editar nome/telefone/unidade e preferência de avisos, recuperar senha e sair. | Campos pessoais permitidos; créditos, papéis e organização protegidos. |

Lacunas operacionais: configuração Staff e confirmação de entrega de e-mail dependem das contas externas. Cancelamento Staff é encaminhado ao atendimento e confirmado pelo fornecedor; crédito não é devolvido antecipadamente. Cobranças são acompanhadas pelo sistema; esta entrega não cria um checkout de cartão/Pix externo.

Critério de conclusão da QA: nova conta completa entrada → triagem → treino → execução/feedback; opera aula/evento/reserva/serviço e suporte; não lê ou altera dados de outro morador. Conferir também tela pequena, voltar/atualizar e sessão expirada.

