> Implantação posterior confirmada: frontend, cinco migrations e seis funções publicados em 26/10/2026. Consulte [Registro de implantação](REGISTRO_IMPLANTACAO_2026-10-26.md) para revisão publicada, versões e pendências reais. A referência abaixo ao pacote local descreve o estado anterior à publicação.

> Atualização de 26/10/2026: consulte [Correções dos relatórios](CORRECOES_RELATORIOS_2026-10-26.md). As alterações posteriores são locais e não foram testadas nesta rodada por solicitação do responsável. Evidências anteriores não validam o código atual nem confirmam implantação.

# QA — Maison Guimet — quatro personas

26/10/2026. Use quatro contas distintas, sem compartilhar sessão. Selecione Maison Guimet em cada acesso. Admin visualizar a tela de morador não substitui testar um morador real.

## 1. Morador

- [ ] Abrir /entrada, selecionar condomínio, cadastrar nome/unidade/e-mail e confirmar acesso; testar também convite.
- [ ] Concluir triagem e objetivo; verificar consentimento obrigatório e que um caso de risco aparece para o coach.
- [ ] Conferir treino publicado, exercícios do dia, séries/repetições/descanso e vídeo disponível.
- [ ] Iniciar, marcar exercícios/carga, salvar, pausar, atualizar a página, retomar e concluir com feedback.
- [ ] Verificar que não conclui com exercício pendente nem cria segunda conclusão ao repetir o clique.
- [ ] Inscrever/cancelar aula; conferir vagas e histórico de presença.
- [ ] Inscrever em evento, entrar em espera quando lotado, cancelar e fazer check-in somente no horário permitido.
- [ ] Reservar área; tentar conflito, consultar histórico e cancelar futura.
- [ ] Solicitar serviço; receber orçamento do síndico/admin, aceitar e conferir cobrança; testar cancelamento antes do pagamento.
- [ ] Staff: consultar catálogo, escolher data e solicitar. Sem integração, mostrar erro explícito sem debitá-lo; com integração, conferir confirmação, crédito e pedido de cancelamento.
- [ ] Abrir chamado, ler resposta; editar perfil/preferência, marcar aviso lido, recuperar senha e sair.

## 2. Coach

- [ ] Aceitar convite, entrar e conferir condomínio/funcionário ativo.
- [ ] Abrir agenda e chamada da aula; registrar presença apenas de aluno inscrito.
- [ ] Buscar alunos; confirmar entrada do morador após triagem mesmo sem treino anterior.
- [ ] Abrir /coach/revisoes, ler saúde e justificar aprovação/revisão.
- [ ] Criar treino no editor completo; segurança pendente bloqueia publicação.
- [ ] Publicar e conferir o mesmo plano na conta do morador.
- [ ] Revisar com exercícios e justificativa; conferir versão anterior revisada e nova ativa.
- [ ] Conferir histórico e feedback deixado pelo morador.

## 3. Síndico

- [ ] Conferir indicadores, moradores/unidades, agenda e profissionais do Maison Guimet.
- [ ] Salvar metas, atualizar e conferir persistência; registrar e concluir ação de ativação.
- [ ] Criar/editar rascunho, publicar comunicado e conferir leitura no morador; arquivar.
- [ ] Criar/editar/publicar Health Day, copiar link, consultar participantes e exportar CSV.
- [ ] Conferir limite de vagas, promover espera, cancelar participante e encerrar/cancelar evento.
- [ ] Em /sindico/operacao, consultar/cancelar reserva futura e registrar utilização encerrada.
- [ ] Cotar serviço e conferir aceite pelo morador; concluir execução.
- [ ] Abrir/responder/resolver atendimento autorizado. Confirmar que não recebe anamnese no painel.

## 4. Admin

- [ ] Selecionar organização e conferir que todas as abas usam o mesmo contexto.
- [ ] Editar configuração, perfil operacional, suporte e playbook; registrar/aprovar equipamentos reais.
- [ ] Criar/copiar/cancelar convite, testar aceitação; testar e-mail somente com destinatário autorizado.
- [ ] Criar conta, alterar papel, ativar/desativar e vincular aluno; não permitir perder o próprio admin.
- [ ] Associar/remover vínculo por organização; coach deve ter funcionário ativo e vínculo correspondente.
- [ ] Operar reservas, serviços e chamados em /admin/solicitacoes.
- [ ] Criar/aprovar/rejeitar workflow, executar suportado e consultar saída; tarefa sem handler exige avaliação humana.
- [ ] Conferir auditorias de acessos/prescrições, filtros, paginação e CSV.
- [ ] Conferir integração/relatórios configurados. Limpeza de demo só deve ser testada em outra organização marcada como demo.

## Acessos e comportamento compartilhado

- [ ] Acesso sem sessão abre login; senha incorreta e sessão expirada exibem erro recuperável.
- [ ] Morador, coach e síndico não entram em rotas administrativas por URL.
- [ ] Usuário de outro condomínio não lê aluno/saúde/sessão/solicitação do Maison Guimet.
- [ ] Morador não edita créditos, papel ou organização.
- [ ] Trocar condomínio não mantém linhas do contexto anterior.
- [ ] Testar tela pequena, teclado, carregamento, lista vazia, falha de rede e novo clique.
- [ ] Repetir entrada/convite/recuperação e principal jornada após publicar o frontend no domínio final.

## Evidências técnicas já obtidas

- 11 testes automatizados de decisão de acesso passaram (scripts/access.test.mjs).
- TypeScript e ESLint sem erros nos módulos validados; build de produção gerado.
- scripts/persona-transactional-qa.sql passou: convites, vínculo, perfil, inscrição idempotente/cancelamento, conflito de reserva, triagem, publicação/revisão, sessão completa, evento, serviço/cobrança e crédito/estorno.
- scripts/persona-rls-qa.sql passou com SET LOCAL ROLE authenticated: leitura própria, isolamento entre condomínios, bloqueio de edição de crédito e autoelevação de papel; RPC de crédito restrita ao servidor.
- Fixtures dos testes foram revertidas; consulta final confirmou zero organizações de teste restantes.
- QA visual, e-mails e reservas externas reais ainda não foram realizados nesta entrega.
