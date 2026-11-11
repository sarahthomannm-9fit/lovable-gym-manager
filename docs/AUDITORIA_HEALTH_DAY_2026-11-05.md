# Auditoria de prontidão do Health Day Nine Living

Data da auditoria: 05/11/2026. Escopo: operação exclusivamente digital do Health Day da segunda semana de dezembro de 2026, para um condomínio de 80 apartamentos, estimativa de 40 a 50 participantes e limite de 50 vagas. O playbook recebido é a referência operacional. O dia e o horário exatos ainda precisam constar no cadastro do evento.

**Parecer: entrega bloqueada para operação exclusiva.** Foram revisados código, migrations e metadados e contagens do Supabase em leitura. Não foi executado ensaio com as contas do evento, teste de carga, medição de rede na quadra ou teste de comunicação real. A consulta encontrou zero eventos entre 7 e 13/12/2026, zero inscrições Health Day e zero publicações de treino registradas. A RPC da nova Portaria ainda não está implantada.

## Registro de achados

| ID | Prioridade | Frente e evidência | Condição de fechamento |
|---|---|---|---|
| HD-01 | P0 | O evento ainda não está cadastrado na janela auditada. O formulário em src/pages/sindico/HealthDay.tsx inicia com 15 vagas. | Admin configura condomínio, local, data, horário, janela de check-in e 50 vagas. Sara valida o link e os dois QR nos dispositivos reais. |
| HD-02 | P0 | src/App.tsx protege /morador/eventos. src/pages/morador/Events.tsx exige aluno vinculado. O link copiado pelo síndico aponta para essa rota. | Pré-inscrição sem conta coleta nome, WhatsApp, unidade e objetivo. Cadastro externo não ocupa vaga sem a validação de vínculo definida pela operação. Dois moradores da mesma unidade podem participar. |
| HD-03 | P0 | O check-in existente é do próprio aluno. O painel administrativo apresenta lista, promoção e cancelamento. Não foi identificado balcão expresso com permissão dedicada. | Sara pesquisa pelo nome, unidade ou telefone, confirma presença, cadastra passante e corrige erro com histórico. Meta do playbook de até 10 s para check-in do inscrito, medida na quadra. |
| HD-04 | P0 | A rotina autenticada serializa inscrição na linha do evento. O cadastro expresso ainda não existe nesse contador. Há ordem de travas diferente no SQL histórico da inscrição e da gestão, o que exige reprodução concorrente. | Uma única alocação para todos os canais. Com 49 vagas ocupadas e dois pedidos concorrentes, uma confirmação e uma espera. Cancelamento, promoção, ausência e repetição são coerentes em dois aparelhos. Nenhuma presença se perde. |
| HD-05 | P0 | A interface do morador libera o botão de check-in pela data. A função de banco impõe também horário de início e fim. O playbook pede chegada 10 min antes. | Janela de recepção abre antes do treino conforme o cronograma. A interface mostra horários corretos e diferencia chegada antecipada, evento aberto e encerrado. |
| HD-06 | P0 | O fluxo de evento registra inscrição e presença. Não foi encontrada decisão separada de participação no treino presencial. | Rony distingue presença, elegibilidade para a atividade e pendência de avaliação. Sara e síndico não precisam ver respostas de saúde. Um caso bloqueado pode participar das partes permitidas do evento sem ser liberado para o treino. |
| HD-07 | P0 | O fluxo de recepção depende de chamadas online. Não foi identificado mecanismo de operação local com sincronização para a recepção. | Ensaio corta a conexão durante a entrada. A equipe continua em modo digital e reconcilia as ações após reconectar. A mesma vaga não pode ser confirmada em dois dispositivos desconectados. Testar reinício e perda de um aparelho. |
| HD-08 | P0 | A Portaria nova está no repositório. A RPC de envio de triagem não está em produção. O catálogo tem três protocolos iniciantes sem exercícios completos, conforme checagem anterior. | Participante do evento vincula sua conta sem criar inscrição duplicada. PAR-Q sem alerta aguarda decisão, caso sinalizado fica bloqueado, professor publica e aluno executa e conclui a sessão. Protocolo completo ou capacidade de prescrição manual comprovada. |
| HD-09 | P0 | A rota de gestão permite síndico e admin. O papel operacional dedicado da recepção e o isolamento de Sara, Rony e Silvia precisam de homologação. | Testar contas separadas, negação entre condomínios, operação limitada à recepção e acesso a dados de saúde só para perfis autorizados. Confirmar o comportamento por URL e API. |
| HD-10 | P1 | Não foi demonstrado fluxo completo para lembretes D-10, D-5, D-1 e pós-evento com base de inscritos e preferências. | Validar contatos operacionais e ofertas como finalidades distintas, opt-out comercial, reenvio idempotente e falhas. Alegação de 80% usa 40 confirmações reais de 50. |
| HD-11 | P1 | O playbook condiciona buffet e brinde ao cadastro e usa cartão QR para continuidade. Não foi identificada marcação integrada de entrega e associação ao onboarding. | Sara distingue presença, brinde entregue e onboarding iniciado. Releitura do QR mantém o mesmo vínculo. Rony e Silvia recebem objetivos agregados conforme o papel. |
| HD-12 | P1 | Capacidade técnica e capacidade humana de prescrever após o evento ainda não medidas. Não há evidência de entrega imediata de treino a partir do QR. | Ensaio com volume do evento e cronômetro. Medir tempo do balcão e vazão de revisão/publicação. Comunicar prazo de entrega compatível com a operação do professor. |
| HD-13 | P1 | Produção física, mídia e Recovery Station estão no playbook. Não há evidência de vistoria, liberação dos arquivos gráficos, validação do cardápio, sinalização ou conferência do orçamento. | Sara e responsáveis fecham o checklist físico conforme o playbook. Testar QR impresso, carga e descarga, conectividade, montagem e fluxo presencial. |
| HD-14 | P1 | A equipe ainda não demonstrou recuperação operacional ou trilha completa de alterações durante um evento. | Admin acompanha fila, lotação e falhas. Conferir histórico com ator e horário, recuperação de erro e reconciliação de presença, brinde e treino sem expor dados clínicos. |

P0 impede a entrega no escopo de operação exclusivamente digital. P1 precisa de evidência ou decisão explícita de escopo antes do evento.

## Ensaio de aceite

1. Criar um Health Day de teste com 50 vagas e contas separadas de recepção, professor, síndico, admin e moradores.
2. Inscrever participantes sem conta, repetir submissões e simular pico. Concorrer pela vaga 50 e conferir lista de espera, cancelamento e promoção.
3. Usar os celulares da operação na quadra. Registrar chegadas de inscritos e passantes, medir o tempo de atendimento e simular perda de rede, reenvio e reinício.
4. Testar vínculo de morador, tentativa de acesso de outro condomínio, edição no balcão e privacidade de dados clínicos.
5. Usar o QR impresso. Testar um PAR-Q elegível e um com alerta. Publicar o treino elegível, abrir no app, pausar, reabrir e concluir. Confirmar a permanência do bloqueio no outro caso.
6. Conferir lotação, presença, brinde, onboarding, publicação e conclusão nas visões autorizadas. Registrar evidência, responsável, resultado e pendências por achado.

Referências de implementação: src/App.tsx, src/pages/sindico/HealthDay.tsx, src/pages/morador/Events.tsx, supabase/migrations/20261012150548_complete_existing_health_day_model.sql e docs/VALIDACAO_PORTARIA_ELETRONICA.md.
