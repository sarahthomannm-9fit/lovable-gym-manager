# Design da Portaria Eletrônica do Fitness

## Jornada e responsabilidades

O admin prepara o condomínio. O morador entra pelo QR e envia a triagem. O professor recebe a fila, decide e publica o treino. O morador executa a sessão. O síndico acompanha os indicadores agregados do condomínio.

| Persona | Tela de entrada | Conteúdo principal | Ação primária |
| --- | --- | --- | --- |
| Morador | Meu treino | Situação atual da triagem ou sessão do dia | Concluir triagem, iniciar ou retomar treino |
| Professor | Fila de atendimento | Pendências por prioridade, morador, motivo e próximo passo | Avaliar caso ou revisar e publicar |
| Síndico | Operação do condomínio | Cadastros, treinos publicados e sessões concluídas por período | Filtrar período e acompanhar adesão |
| Admin | Implantação e auditoria | QR, vínculos, equipe, inventário, catálogo e histórico de decisões | Corrigir pendências da implantação |

## Morador

A tela mostra um estado por vez. Use texto junto à cor para indicar a situação.

| Estado | Mensagem | Ação |
| --- | --- | --- |
| Cadastro incompleto | Conclua seu cadastro para enviar a triagem | Continuar cadastro |
| Triagem incompleta | Responda às sete perguntas de segurança | Continuar triagem |
| Envio interrompido após salvar | Suas respostas foram salvas. Falta concluir o envio | Tentar novamente |
| Aguardando decisão | Sua triagem está com a equipe do condomínio | Voltar ao início |
| Treino publicado e sessão prevista | Seu treino de hoje está disponível | Iniciar treino |
| Treino publicado e dia sem sessão | Hoje não há sessão programada | Voltar ao início |
| Sessão pausada | Seu progresso foi salvo | Retomar treino |
| Sessão concluída | Sessão registrada | Voltar ao início |

Durante a sessão, mostre exercícios na ordem prescrita, séries, repetições, carga, descanso e orientações. Ao voltar ao app, recupere o progresso salvo. O morador só consulta o próprio cadastro, treino e sessões.

## Professor

A fila separa sugestões prontas para revisão de casos encaminhados para avaliação profissional. Cada item mostra morador, data, motivo e próxima ação. O professor só opera os alunos autorizados no condomínio ativo.

- **Revisar sugestão.** Mostrar protocolo, frequência e exercícios. O professor pode ajustar dias, ordem, séries, repetições, carga, descanso e orientações. Um protocolo completo permite confirmar a publicação após conferir os exercícios.
- **Avaliar caso.** Mostrar a triagem autorizada, pedir justificativa e registrar a decisão. Se houver liberação profissional, o professor pode prescrever no editor.
- **Publicar.** Conferir aluno, data de início e exercícios. Se a publicação falhar, manter o rascunho e informar a causa. A publicação confirmada muda o estado do treino do morador.

## Síndico

Mostrar indicadores agregados do condomínio ativo com período visível. Distinguir treinos publicados de sessões concluídas. Exibir zero quando não houver registros e um aviso de indisponibilidade quando a consulta falhar. As telas e consultas do perfil excluem respostas do PAR-Q, histórico de saúde e justificativas clínicas.

## Admin

Mostrar o estado da implantação por condomínio. Os itens de verificação são QR ativo, professor vinculado, inventário aprovado e disponibilidade de protocolos completos. A auditoria registra quem decidiu, quando e para qual condomínio. A administração da operação usa os dados necessários à configuração e à auditoria.

## Critérios de aceite

| Cenário | Resultado esperado |
| --- | --- |
| Admin prepara o piloto | QR aponta para o condomínio certo, equipe tem os vínculos corretos e existe protocolo completo para o teste em um clique |
| Morador elegível envia o PAR-Q | Caso entra na fila correta e treino aguarda publicação do professor |
| Professor publica um plano | Morador correto recebe os exercícios e parâmetros. Reenvio da mesma publicação não duplica o plano |
| Morador pausa, reabre e conclui | App recupera o progresso e registra uma conclusão |
| Morador responde Sim no PAR-Q | Caso vai para avaliação profissional e o treino segue bloqueado antes da decisão |
| Síndico consulta o período | Indicadores refletem publicação e conclusão. A consulta às respostas de saúde é negada |
| Professor de outro condomínio tenta abrir o caso | Fila e ações de revisão ou publicação ficam inacessíveis |

Este documento descreve o desenho de produto e os critérios de homologação. As telas e os indicadores propostos devem ser conferidos com as quatro contas em ambiente de teste.
