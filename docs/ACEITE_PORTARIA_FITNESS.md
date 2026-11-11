# Aceite técnico e operacional da Portaria Fitness

Verificação de produção em 06/11/2026. As funções de recepção, onboarding da Portaria, criação de protocolos, acompanhamento do professor e prontidão do admin ainda não estavam disponíveis no projeto publicado. A consulta foi somente leitura.

## Pacote para homologação

| Ordem | Migration local | Entrega |
| --- | --- | --- |
| 1 | 20261105110224_portaria_eletronica_fitness.sql | Captura, consentimento, fila, decisão e publicação |
| 2 | 20261105215843_health_day_impact.sql | Impacto do Health Day após o check-in |
| 3 | 20261105222724_fitness_usage.sql | Uso contínuo e acompanhamento do coach |
| 4 | 20261105223500_health_day_entry.sql | Pré-inscrição, recepção, vagas e entrada por e-mail confirmado |
| 5 | 20261105224436_resident_fitness_status.sql | Estado da triagem no app do morador |
| 6 | 20261107005330_workout_protocol_authoring.sql | Protocolo reutilizável a partir de treino publicado |
| 7 | 20261107010303_fitness_delivery_readiness.sql | Painel de prontidão do admin |

Conferir as versões registradas no ambiente alvo antes de aplicar. O registro de implantação de outubro documenta divergências entre timestamps locais e remotos. Aplicar primeiro em ambiente isolado, publicar anamnese-public e triagem-decidir com o código compartilhado e publicar o frontend no mesmo ambiente. Verificar o domínio e a versão antes do ensaio.

## Aceite com contas reais de homologação

- [ ] Admin prepara um condomínio de teste, equipa a academia, vincula professor e síndico e configura o evento com 50 vagas.
- [ ] Recepção confere o vínculo e registra presença de uma pessoa sem conta. Testar QR de inscrição, QR do cartão e QR permanente da academia.
- [ ] Duas pessoas concorrem pela última vaga. Conferir uma confirmação, uma espera, reenvio e operação em dois aparelhos.
- [ ] Simular queda de conexão na quadra. Registrar capacidade e tempo de recuperação. A recepção atual depende de conexão.
- [ ] Morador vincula a presença pelo e-mail confirmado, conclui o PAR-Q e entende o próximo passo sem ajuda.
- [ ] Professor confirma um protocolo completo ou publica pelo editor. Conferir a correspondência entre prévia, plano publicado e exercícios no app do aluno.
- [ ] Morador salva, pausa, fecha, reabre, retoma e conclui. Em outro dia, conclui uma segunda sessão.
- [ ] Professor confere a execução e o síndico confere os agregados de uso. Admin compara o painel de prontidão com as evidências do ensaio.
- [ ] Segundo morador sinaliza alerta no PAR-Q. O treino permanece indisponível até decisão profissional registrada.
- [ ] Professor de outro condomínio e síndico tentam acessar dados fora da autorização. Verificar a negação pelas telas e pela API.

Registrar versão, perfil, aparelho, resultado observado e evidência de cada etapa. Os testes locais de componentes e SQL não substituem esse percurso completo.

## Resultado técnico de 06/11/2026

Oito cenários SQL com banco isolado e dados fictícios passaram. Eles cobriram recepção e vagas, captura e bloqueio da Portaria, estado da triagem, criação de protocolo, sessão de treino, acompanhamento do coach, impacto do evento e prontidão do admin. Os três testes Deno da triagem também passaram. A consulta ao Supabase confirmou os pré-requisitos de autorização, consentimento e prontidão e encontrou zero grupos de anamneses duplicadas na fila. O projeto consultado não possui branch de homologação.

## Recuperação de tentativa na recepção

No balcão da recepção, interromper a rede logo após reservar ou marcar presença de uma pré-inscrição. Repetir com um participante de vaga já confirmada e conferir que as duas origens compartilham a fila. Confirmar que a tentativa aparece pendente, recarregar a mesma aba e reenviar após reconectar. Conferir que apenas uma vaga ou presença foi registrada mesmo se o primeiro pedido chegou ao servidor. Com a lista já carregada, registrar tentativas de pessoas diferentes e confirmar que a fila é reenviada na ordem de chegada. Interromper o reenvio no meio e confirmar que somente as tentativas restantes ficam na aba. A confirmação de vaga ou presença exige conexão. O ensaio deve incluir falha antes e depois da gravação.
