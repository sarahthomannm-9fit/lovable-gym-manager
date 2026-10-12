# Alinhar Morador, Síndico, Coach e Adm aos loops de experiência

Este trabalho é grande, então vou fazer em 4 etapas, nesta ordem: Coach → Morador → Síndico → Adm. Ao final de cada etapa o app continua funcionando. Nenhuma função que já existe será removida, só reorganizada. A visão Corporativo não muda.

## Etapa 0 — Ajustes gerais (valem para todas as telas)
- Corrigir o rótulo "NINE LIVING" que fica por cima do título "Meu dia" no topo de cada visão.
- Todas as abas ficam em uma única linha. Se não couberem, rolam para o lado (no celular primeiro). Nunca quebram para uma segunda linha.
- Mensagens claras em português quando não houver dados: "sem vínculo com condomínio" aparece diferente de "ainda sem dados".
- Aviso "Acesso suspenso" para Morador, Síndico e Coach quando o condomínio estiver suspenso.

## Etapa 1 — Coach
- Novas abas: Aulas | Fila | Alunos | Treinos | Histórico. A aba "Operação" sai do Coach.
- Tela inicial: aulas de hoje, botão "Iniciar aula" (liberado 15 min antes) e quantas anamneses estão na fila.
- Aulas: próximos 7 dias em destaque. "Iniciar aula" abre a lista de presença com os check-ins. Aula com inscritos só pode ser cancelada, não apagada.
- Fila: anamneses pendentes. "Revisar" abre só para leitura. "Criar treino" usa o formulário de treino que já existe (4 a 12 semanas, no mínimo 3 exercícios) e notifica o aluno.
- Alunos: filtros Ativos / Treino pendente / Revisão vencida, busca e detalhes. "Revisões" vira um filtro com contador de pendentes.
- Revisão: cria uma nova versão do treino, guarda a anterior, pede o motivo e notifica o aluno.
- Treinos: os treinos deste coach (ativos e inativos) e a taxa de adesão.
- Histórico: períodos de 30, 90 ou 365 dias, com totais.

## Etapa 2 — Morador
- Tela inicial: "Próxima aula" com Check-in, "Meus treinos" e "Comunicados" com contador de não lidos.
- Check-in liberado 15 min antes (ou a regra que já estiver no código). Bloqueado se a aula já passou ou foi cancelada. Mostra uma mensagem de confirmação.
- Grade de aulas por semana ou mês, com selos Inscrito / Lotado / Cancelado. Só aparecem aulas ativas do próprio condomínio.
- Treinos aparecem só depois que a anamnese foi enviada. Cada treino tem "Abrir treino" e "Marcar concluído".
- Anamnese com barra de progresso e botão "Enviar para o Coach".
- Comunicados do mais novo ao mais antigo, urgentes em destaque, e marcados como lidos ao abrir.
- Botão flutuante de suporte: perguntas frequentes e "Falar com suporte".
- Pagamento: plano, valor e vencimento, botão de renovar (PIX, cartão ou débito, usando o que já existe) e um aviso gentil se estiver atrasado.

## Etapa 3 — Síndico
- Indicadores: total de alunos, inscrições ativas, frequência e próximas aulas. Alertas e gráfico de frequência das últimas 4 semanas.
- Alunos: tabela com busca e filtros, e "Ver detalhes".
- Grade de aulas: cores por ocupação e aviso quando duas aulas usam o mesmo horário ou espaço.
- Comunicados: lista dos enviados com quantas pessoas viram, e "Novo comunicado" com tipo (Aviso, Promo ou Evento), envio agora ou agendado, destinatários e pré-visualização. O comunicado aparece na hora para Morador e Coach.
- Metas do condomínio: frequência (%), novos inscritos, horários e capacidade. Só aceita números positivos.
- Chat apenas com o Adm.

## Etapa 4 — Adm
- O contexto atual (Condomínios, Coaches, Academias, Studios ou Clínicas) aparece no topo, com troca pelo seletor que já existe.
- Visão geral das origens: status, alunos ativos, frequência e MRR, com filtro Ativo / Inativo / Risco e busca.
- Detalhe de uma origem, com abas:
  - Cadastral: CNPJ travado depois da ativação, e-mail único e histórico de alterações.
  - Financeiro: "Gerar cobrança" só para fatura vencida. "Suspender acesso" pede motivo, anotação, opção de avisar o síndico e confirmação dupla. Também dá para desbloquear.
  - Uso: quantidade de pessoas e aulas, e as últimas ações.
  - Onboarding / Roteiro de visita: o conteúdo que saiu do Coach.
- Novo cadastro em 5 passos, criar comunicado e criar evento (a data precisa ser futura).

## Detalhes técnicos
- As abas viram um componente compartilhado com `overflow-x-auto` e `whitespace-nowrap`. O topo do `PersonaLayout` passa a empilhar o rótulo e o título com o espaço certo.
- A seção Operação é extraída de `CoachHome` para um componente usado em `OrganizationsAdmin`.
- Os dados vêm das tabelas que já existem: `aulas`, `aulas_inscritos`, `checkins`, `anamnese_respostas`, `treinos_ia_fila`, `treinos`/`planos_treino`, `notificacoes` (`data_leitura` mostra se foi lido), `pagamentos`, `organizations` (`status` e `metadata`), `eventos_condominio` e `system_events` (histórico).
- Suspensão: `organizations.status = 'suspenso'`, lido pelo `useOperationalContext`.
- Cada consulta é filtrada pelo condomínio ativo, seguindo as regras de acesso que já existem no banco.
- Possíveis faltas no banco, que vão para o relatório final sem inventar dados:
  - faturas por condomínio (hoje só existem pagamentos por aluno);
  - versões de treino com motivo da revisão;
  - contagem de visualizações por comunicado enviado em grupo;
  - campo de espaço/sala nas aulas, para checar conflitos;
  - endereço e banner/CTA de eventos;
  - chat em tempo real entre Síndico e Adm.
- Se algum campo pequeno for indispensável (por exemplo o motivo da revisão), eu peço sua aprovação antes de alterar o banco. Se não, guardo em `metadata`.
