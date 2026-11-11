# Morador — diagnóstico e plano específico

Data: 10/11/2026. O diagnóstico abaixo registra a base anterior às correções. Os quatro pacotes foram implementados nesta data; resultados e limites estão em [Entrega técnica do morador](../ENTREGA_MORADOR_2026-11-10.md). A QA funcional será executada pelo responsável. O frontend permanece local; banco e funções implantados constam do registro de entrega.

## 1. Promessa do produto

O morador abre a Portaria Fitness do condomínio, identifica seu próximo passo e consegue executá-lo: entrar, responder à triagem, aguardar a avaliação, receber um treino revisado e registrar a prática. Eventos e serviços complementam essa rotina. A interface precisa funcionar para quem tem pouca familiaridade com aplicativos, inclusive durante a recepção do Health Day.

Para o prédio de 80 apartamentos, apartamentos não equivalem a usuários: uma unidade pode ter mais de um morador. O ensaio precisa contemplar vários moradores na mesma unidade e os 40–50 participantes previstos no evento. Esses números não constituem comprovação de capacidade ou desempenho.

## 2. O que existe no código

| Frente | Implementação encontrada | Limite atual |
| --- | --- | --- |
| Entrada | `/entrada`, condomínio, nome, e-mail, unidade, link por e-mail e login por senha | Recuperação depende da configuração de Auth; armazenamento local participa da entrada |
| Evento sem conta | `/health-day/:eventId`, consulta pública mínima e solicitação de inscrição | Pré-inscrição não confirma vaga nem libera acesso ao treino |
| Vínculo | `useAlunoVinculo`, busca por usuário e contexto; tentativa de vincular cadastro existente | Falha de consulta pode terminar como ausência de vínculo; múltiplos vínculos exigem contexto |
| Triagem | Consentimento versionado, sete perguntas PAR-Q, objetivo, experiência e informações de saúde | Formulário extenso; rascunho anterior ao envio não é recuperado; envio salvo tem retomada própria |
| Decisão | Captura canônica, fila, bloqueio por risco e confirmação profissional | As migrations e funções novas dessa frente continuam dependentes de implantação |
| Hoje | Saudação, próximo passo, treino, presença, eventos e atividades | Informações carregadas em cadeia; falhas e números vazios não são diferenciados em todos os blocos |
| Treino | Exercícios do dia, séries, repetições, carga, descanso, vídeo; iniciar/salvar/pausar/retomar/concluir | Observações individuais do exercício não aparecem no cartão revisado; falta tratamento explícito de alterações não salvas |
| Aulas | Inscrever/cancelar e estado de presença | Aulas aparecem na página inicial, enquanto Agenda lista somente eventos |
| Eventos | Inscrição, espera, cancelamento e check-in | Algumas consultas não descartam respostas tardias após troca de contexto |
| Serviços | Reservas de áreas e solicitações com proposta/aceite/cancelamento | Percurso separado do agendamento Staff e do restante da agenda |
| Profissionais | Catálogo Staff, solicitação com protocolo, crédito e acompanhamento | Integração externa precisa estar configurada; solicitação não equivale a confirmação |
| Perfil e suporte | Nome, telefone, unidade, avisos opcionais, recuperação de senha, chamados e WhatsApp configurado | Saúde não tem histórico/correção acessível nessa tela; contato de suporte não identifica necessariamente o coach |

## 3. Jornada desejada por momento

| Momento | Ação principal do morador | Estado que deve compreender | Dependência operacional |
| --- | --- | --- | --- |
| Antes do evento | Solicitar inscrição com os dados previstos | Solicitação recebida; vaga só quando confirmada | Admin/síndico publicam evento e capacidade reais |
| Recepção | Confirmar presença com a equipe | Confirmado, espera ou presença registrada | Recepção verifica identidade e vaga no servidor |
| Ainda no evento | Abrir QR e confirmar e-mail | Conta e vínculo do condomínio corretos | Link/redirect de Auth funcionando no celular |
| Após confirmar acesso | Autorizar e preencher triagem | Dados enviados ou salvos aguardando conclusão do envio | Captura, fila e função de decisão implantadas |
| Aguardando profissional | Consultar a situação e pedir ajuda | Avaliação necessária ou treino em preparação | Coach acompanha fila; produto não inventa prazo |
| Primeiro treino | Ler prescrição e iniciar sessão | Plano vigente, exercícios do dia e execução iniciada | Publicação profissional, infraestrutura e acesso válidos |
| Durante a prática | Marcar exercício, informar carga, salvar ou pausar | O que está salvo e o que ainda está no dispositivo | Persistência e recuperação de falhas |
| Após a prática | Concluir e registrar observação | Sessão concluída uma única vez | Coach recebe o acompanhamento autorizado |
| Retorno na semana | Retomar rotina e ver próxima atividade | Dia de treino, descanso ou plano a renovar | Agenda e vigência consistentes |
| Uso recorrente | Consultar agenda, avisos, reservas, serviços e perfil | Estado de cada solicitação e canal de atendimento | Síndico/admin mantêm operação atualizada |

## 4. Direção de arte e navegação

A página Hoje terá uma ação principal orientada pelo estado atual. Sem triagem, preencher; com envio interrompido, concluir envio; em avaliação, consultar orientação e suporte; com sessão disponível, iniciar ou retomar; após conclusão, ver o resultado. Dia sem exercício não oferece início de sessão.

Proposta de navegação principal: Hoje, Treino, Agenda e Mais. Hoje é o retorno previsível. Agenda reúne compromissos pessoais e atividades disponíveis, distinguindo inscrição de confirmação. Mais concentra perfil, serviços, profissionais, pagamentos e ajuda conforme o contrato. No celular, usar navegação compacta, sem duas faixas concorrentes de links.

Cartões de exercícios precisam priorizar nome completo, prescrição, orientação do coach e registro da execução. Carga prescrita e carga realizada têm rótulos diferentes. Vídeo tem nome acessível, não apenas um ícone. Cor acompanha texto de estado; o acabamento deve respeitar os tokens da marca e verificar contraste, tamanho de toque, zoom e foco.

Não repetir a decisão de preencher triagem em diversos cartões. Não chamar check-in de treino concluído. Não usar estado vazio para encobrir erro de consulta. Dados opcionais, cobranças e ofertas não disputam a ação principal de saúde e prática.

## 5. Lacunas e checklist de implementação

P0 impede confiança na jornada principal. P1 completa a operação cotidiana. P2 melhora acabamento e acompanhamento. Esta é a lista que orientou a fase; consultar o registro de entrega para o resultado da implementação e executar o checklist de QA para homologar o comportamento.

| ID | Prioridade | Correção específica | Evidência no código / critério de conclusão |
| --- | --- | --- | --- |
| MOR-01 | P0 | Distinguir falha de vínculo, ausência de cadastro e necessidade de escolher condomínio | `useAlunoVinculo` captura falha sem expor erro. Mostrar recuperação correta sem sugerir cadastro duplicado |
| MOR-02 | P0 | Limpar todos os dados e formulários ao trocar usuário/condomínio; descartar respostas antigas | `MoradorHome` mantém vários estados até novas consultas; `Events` e `Agenda` não protegem todas as respostas tardias. Nenhum dado de A aparece em B |
| MOR-03 | P0 | Separar erro, carregamento, vazio e conteúdo por bloco | Hoje ignora vários erros retornados; Agenda começa vazia. Falha de pagamento ou aula não vira “em dia” ou “nenhuma atividade” |
| MOR-04 | P0 | Fechar entrada e retorno do link no condomínio correto, inclusive navegador diferente | `ResidentEntry` usa localStorage e metadata de entrada. Verificar e-mail confirmado, redirects, convites e vínculo no servidor; armazenamento desabilitado não pode impedir desnecessariamente a entrada |
| MOR-05 | P0 | Fazer o estado de triagem carregável, recuperável e atualizável | `ResidentFitnessStatus` não trata erro da RPC nem oferece atualizar. Distinguir falha de consulta de treino em preparação; permitir consultar após publicação |
| MOR-06 | P0 | Impedir ações incoerentes de sessão em todos os acessos | Hoje já distingue descanso; aba Treino ainda exibe iniciar sem sessão mesmo com lista vazia. Concluir só durante execução válida; servidor continua validando |
| MOR-07 | P0 | Mostrar prescrição completa e observações profissionais | Cartão mostra séries/repetições/carga/descanso/vídeo, sem observações do exercício. Conferir fidelidade ao plano publicado e vigência |
| MOR-08 | P0 | Tratar progresso não salvo e recuperação de erro de sessão | Progresso fica em estado React até salvar. Indicar alterações pendentes, preservar após falha, evitar abandono silencioso e confirmar resultado no servidor; não prometer modo offline |
| MOR-09 | P0 | Corrigir semântica das métricas e repetição do check-in | Hoje usa `checkins` para dizer “Você treinou” e incrementa contagem local após sucesso sem distinguir replay. Separar presença de sessão concluída e reconciliar contagem oficial |
| MOR-10 | P0 | Fechar implantação da entrada/triagem com testes integrados | Migrations de novembro e `triagem-decidir` ainda não confirmadas em produção. Conferir contrato de RPC, permissões, Auth e publicação conjunta |
| MOR-11 | P1 | Simplificar triagem em etapas compreensíveis, mantendo captura canônica | Hoje reúne vários campos e sete perguntas no percurso. Explicar progresso, campos opcionais e revisão final; preservar respostas durante navegação. Não guardar saúde em localStorage como solução automática |
| MOR-12 | P1 | Definir reavaliação e correção de informações de saúde | Encaminhar ao profissional, mostrar orientação e preservar histórico. Não oferecer autoliberação de risco nem alterar decisão clínica pelo perfil |
| MOR-13 | P1 | Unificar navegação e manter destino ao atualizar ou voltar | `PersonaLayout` tem cinco links; Home adiciona cinco abas e link repetido. Uma estrutura consistente com URLs para os destinos essenciais |
| MOR-14 | P1 | Transformar Agenda em agenda do morador | Hoje Agenda consulta somente eventos. Incluir inscrições em aulas, eventos, reservas e serviços confirmados com origem, data local e status |
| MOR-15 | P1 | Tornar evento legível de ponta a ponta | Distinguir pedido, confirmado, espera, presença, cancelamento e encerramento. Oferta e capacidade seguem o servidor; não reofertar evento passado como disponível |
| MOR-16 | P1 | Dar visibilidade ao handoff para o coach | Avaliação/publicação precisam de orientação e canal verificável. Suporte genérico do condomínio não deve se apresentar como contato individual do professor |
| MOR-17 | P1 | Corrigir resumo financeiro e estados de cobrança | `status !== 'pago'` inclui cancelados no total pendente. Definir pendente/atrasado/pago/cancelado, tratar erro e deixar origem/valor claros |
| MOR-18 | P1 | Integrar solicitações, Staff, créditos e suporte sem confirmação falsa | Solicitação enviada, confirmação externa, crédito reservado e cancelamento solicitado permanecem distintos. Sem integração, explicar indisponibilidade e impedir reserva |
| MOR-19 | P1 | Tornar todas as datas coerentes com o dia local | Home mistura `new Date(data)` e datas locais. Conferir data de aula, vigência, mês, evento e sessão perto da meia-noite e virada do mês |
| MOR-20 | P1 | Aplicar regras de visibilidade por serviço contratado e autorização | Verificar links e ações além do `FeatureGate` de Staff; esconder indisponibilidade comercial não substitui autorização no banco |
| MOR-21 | P2 | Completar acessibilidade e consistência visual | Rótulo de vídeo, nomes sem truncamento essencial, foco após etapas/erro, contraste dos botões azuis com texto preto, alvos de toque e zoom |
| MOR-22 | P2 | Mostrar evolução baseada em sessões e período explícito | Histórico simples de sessões concluídas, retomada, frequência real e plano vigente. Separar indicador individual do agregado de impacto do evento |
| MOR-23 | P2 | Reduzir espera e custo das consultas de Hoje | Carregamento encadeado bloqueia toda a página. Agrupar consultas independentes e carregar secundárias quando necessárias; medir antes/depois |
| MOR-24 | P1 | Documentar consentimento e preferências sem misturar finalidades | Avisos opcionais, consentimento de saúde e comunicação comercial precisam de controles próprios. Cancelar avisos opcionais não altera liberação de treino |

## 6. Dados e contratos a preservar

| Domínio | Fonte / operação | Regra |
| --- | --- | --- |
| Identidade | Auth, `alunos`, `organization_members`, `start_resident_onboarding` | E-mail verificado e vínculo por condomínio; mesmo apartamento aceita pessoas distintas |
| Entrada do evento | `health_day_preinscricoes`, `health_day_inscricoes`, recepção | Pré-inscrição, vaga e presença são estados diferentes; sem exposição pública da lista |
| Saúde | `anamnese_respostas`, projeção `student_safety_onboarding`, `treinos_ia_fila` | Captura canônica; novas respostas não apagam auditoria; risco continua bloqueando leitura/execução indevida |
| Situação | `resident_fitness_status`, `student_workout` | Não inferir liberação no frontend. Plano e sessão resolvidos no servidor |
| Prescrição | `treinos`, publicação profissional e exercícios | Morador executa e registra; não altera a prescrição publicada |
| Execução | `workout_sessions`, `save_workout_session` | Reenvio sem duplicidade; salvar não reinicia; pausa/retomada preservam progresso |
| Presença | `checkins`, `record_daily_checkin` | Check-in diário não comprova treino concluído |
| Atividades | `aulas_inscritos`, eventos e reservas | Capacidade, conflito e cancelamento validados no servidor |
| Atendimento | Chamados, solicitações, Staff e crédito | Protocolo rastreável e estados reais; nada confirmado só pela tentativa de envio |

O síndico recebe dados operacionais autorizados, não a anamnese. O coach acessa o necessário dentro do seu escopo. A visualização administrativa não substitui um ensaio com conta real de morador. Mudanças de papel, crédito e situação cadastral não pertencem ao formulário pessoal.

## 7. Quatro pacotes da fase morador

| Ordem | Pacote | Itens | Saída verificável |
| --- | --- | --- | --- |
| 1 | Entrada e confiança | MOR-01 a 05, 10, 11, 12, 24 | Pessoa chega ao condomínio correto, envia uma captura e entende a situação mesmo com falha de rede |
| 2 | Treino e retorno | MOR-06 a 09, 16, 19, 22 | Prescrição legível, sessão coerente, progresso preservado e métricas corretas |
| 3 | Rotina do condomínio | MOR-14, 15, 17, 18, 20 | Agenda e serviços com estados reais, cobranças corretas e permissões preservadas |
| 4 | Navegação e acabamento | MOR-13, 21, 23 e regressão dos anteriores | Uma navegação compreensível e experiência responsiva, acessível e sem vazamento entre contextos |

Prioridade de entrega: confiança de entrada e treino antes de ampliar indicadores e ofertas. A direção visual começa no primeiro pacote e consolida-se no quarto. Não esperar o quarto para corrigir controles essenciais inacessíveis.

## 8. Checklist de QA para o responsável

Registrar versão, ambiente, data, conta de teste, resultado observado e evidência sem dados de saúde identificáveis.

- [ ] MOR-Q01 — Entrar pelo QR do condomínio público, confirmar e-mail e chegar ao vínculo correto.
- [ ] MOR-Q02 — Condomínio por convite rejeita entrada indevida; convite válido cria um único vínculo.
- [ ] MOR-Q03 — Dois moradores da mesma unidade possuem contas e cadastros separados.
- [ ] MOR-Q04 — Pré-inscrição do Health Day não confirma vaga; lotação leva à espera; recepção confirma presença uma única vez.
- [ ] MOR-Q05 — Abrir o link de acesso em outro navegador; link expirado e reenvio têm recuperação compreensível.
- [ ] MOR-Q06 — Consentimento recusado e PAR-Q incompleto impedem envio; respostas válidas geram uma captura.
- [ ] MOR-Q07 — PAR-Q positivo ou sinal de risco encaminha à avaliação e mantém treino bloqueado conforme regra do servidor.
- [ ] MOR-Q08 — Falha depois de salvar respostas permite concluir o mesmo envio, sem duplicar fila ou captura.
- [ ] MOR-Q09 — Após publicação pelo coach, atualizar mostra o plano correto, com observações e parâmetros completos.
- [ ] MOR-Q10 — Dia de descanso, plano expirado e cadastro suspenso não oferecem execução indevida.
- [ ] MOR-Q11 — Iniciar, registrar cargas, salvar, pausar, recarregar e retomar preservam o resultado.
- [ ] MOR-Q12 — Falha ao salvar preserva alterações; conclusão repetida não duplica sessão; sessão concluída fica somente para consulta.
- [ ] MOR-Q13 — Check-in repetido não aumenta contagem; presença e treino concluído aparecem separadamente.
- [ ] MOR-Q14 — Inscrição, lotação, cancelamento, presença e evento encerrado aparecem com o estado correto.
- [ ] MOR-Q15 — Proposta de serviço, aceite, cancelamento e crédito seguem o status real; integração indisponível não confirma reserva.
- [ ] MOR-Q16 — Cobrança cancelada não é pendência; falha de consulta não aparece como “em dia”.
- [ ] MOR-Q17 — Trocar condomínio e conta durante consulta lenta ou formulário preenchido não mistura dados nem destinatário de ação.
- [ ] MOR-Q18 — Conta de morador não acessa outro morador, não muda papel/crédito e não altera a prescrição.
- [ ] MOR-Q19 — Conferir celular, teclado, zoom, nomes longos, vídeo acessível e foco após erros.
- [ ] MOR-Q20 — Conferir aula/evento/vigência perto da meia-noite e na virada de mês.
- [ ] MOR-Q21 — Ensaio completo: evento → conta → triagem → revisão do coach → primeiro treino → retorno em outro dia.
- [ ] MOR-Q22 — Falha de consulta em cada bloco oferece recuperação e não inventa zero, ausência de atividades ou ausência de cadastro.
- [ ] MOR-Q23 — Adesão e retirada de comunicação comercial são salvas separadamente dos avisos do aplicativo e do consentimento de saúde; recarregar confirma a preferência, sem alterar o treino.

## 9. Dependências recebidas e devolvidas

Do admin: condomínio ativo, entrada configurada, infraestrutura aprovada, profissionais vinculados, serviços contratados e canal de suporte. Do coach: fila atendida, revisão de segurança, plano completo e publicação. Do síndico/recepção: evento publicado, capacidade, verificação e presença.

O morador devolve presença verificada, triagem para os profissionais autorizados, sessões registradas, solicitações e leitura de comunicados. O acompanhamento do coach e os indicadores agregados devem usar essas ocorrências reais. Não há evidência de causalidade do evento apenas porque alguém treinou nos 7/30 dias seguintes.

## 10. Fontes verificadas

- [Entrada](../../src/pages/morador/ResidentEntry.tsx), [pré-inscrição](../../src/pages/morador/HealthDayEntry.tsx) e [vínculo](../../src/hooks/useAlunoVinculo.ts).
- [Triagem](../../src/pages/morador/OnboardingMorador.tsx), [situação](../../src/pages/morador/ResidentFitnessStatus.tsx) e [RPC de situação](../../supabase/migrations/20261105224436_resident_fitness_status.sql).
- [Hoje e treino](../../src/pages/morador/MoradorHome.tsx), [layout](../../src/layouts/PersonaLayout.tsx) e [rotas](../../src/App.tsx).
- [Eventos](../../src/pages/morador/Events.tsx), [agenda](../../src/pages/morador/Agenda.tsx), [reservas e serviços](../../src/pages/morador/OperacaoAreas.tsx) e [profissionais](../../src/pages/morador/MoradorStaff.tsx).
- [Perfil](../../src/pages/morador/Profile.tsx), [impacto morador/coach](../CHECKLIST_MORADOR_COACH_HEALTH_DAY.md) e [aceite da Portaria](../ACEITE_PORTARIA_FITNESS.md).
- Arquitetura fornecida pelo usuário, extraída em `Nine Living - Extracao/01-docx-completo.md`, e playbook Health Day do anexo original. Requisitos do material foram tratados como referência de produto, separados dos comandos do usuário.
