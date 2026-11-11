# Evidências de produto do Health Day

Coleta de 05/11/2026. Escopo de 80 apartamentos, 50 vagas e operação exclusivamente no Nine Living. A consulta ao Supabase foi somente leitura e retornou contagens agregadas do projeto.

## Evidência observada em produção

| Indicador | Resultado |
| --- | ---: |
| Eventos cadastrados | 0 |
| Eventos de 7 a 13/12/2026 | 0 |
| Inscrições e presenças | 0 / 0 |
| Alunos com conta vinculada | 4 |
| Anamneses com status preenchido | 0 |
| Triagens estruturadas com consentimento e risco baixo | 0 |
| Linhas na fila de treino | 0 |
| Publicações de treino e sessões registradas | 0 / 0 |
| Protocolos ativos | 3 |

A consulta de 05/11 confirmou ausência das RPCs health_day_impact e submit_resident_portaria em produção. A checagem anterior do catálogo confirmou três protocolos iniciantes e zero protocolos com exercícios suficientes para publicação direta. O código local da Portaria e do painel de impacto é evidência de implementação, sem registro de uso do evento.

## Evidência técnica e operacional por perfil

| Perfil e frente | Evidência disponível | Evidência de aceite em aberto |
| --- | --- | --- |
| Morador no evento | Código e RPCs de inscrição, espera e check-in com conta vinculada | Inscrição sem conta, chegada expressa, vínculo do participante e comprovação de presença no mesmo cadastro |
| Morador na ativação | Onboarding e triagem no código local. Testes locais cobriram PAR-Q positivo, compatibilidade de protocolo e ausência de protocolo | QR impresso, confirmação de conta, triagem vinculada ao participante e compreensão do próximo passo sem auxílio |
| Morador no dia a dia | Tela e RPCs de treino e sessão. Registro histórico de teste transacional com dados fictícios | Primeira sessão real de homologação, retomada após reabrir o app, conclusão e retorno em outro dia |
| Coach | Editor manual, biblioteca e fila no código. Teste SQL local da Portaria cobriu bloqueio, rollback, reenvio, encaminhamento e revisão | Operação com login de professor, entrega ao aluno correto e tempo medido de revisão, publicação e acompanhamento |
| Síndico | Painel local de 7 e 30 dias, com teste SQL de sessões concluídas, retorno e acesso negado. O banco de produção ainda não oferece a RPC | Conferir contagens contra as sessões do ensaio com perfil de síndico. Comparar o uso após presença com o uso anterior do mesmo grupo |
| Admin e recepção | QA histórico documenta testes técnicos de acesso, transações e isolamento em dados fictícios | Configurar evento, validar permissões de Sara e dos demais perfis, simular a vaga 50, recuperar perda de rede e auditar correções |

O QA histórico de outubro registrou 11 testes de acesso, testes SQL de transações e RLS, TypeScript e build. Os dados fictícios foram revertidos. Essa evidência é da versão registrada em outubro. A versão nova teve verificações locais próprias de TypeScript, build e SQL, conforme os registros de implementação. A jornada visual com as contas finais, a rede da quadra e o uso após o evento continuam sem evidência.

## Medições a produzir no ensaio

- Registrar a passagem presença → conta vinculada → triagem enviada → treino publicado → primeira sessão → retorno. Usar a mesma pessoa de teste e timestamps de cada passagem.
- Separar primeira sessão no app, reativação e continuidade. Definir o período de inatividade antes de classificar reativação. O painel atual observa atividade após o check-in e não estabelece causalidade.
- Medir tempo de recepção e tempo de decisão do coach. Registrar volume, casos encaminhados, prescrições manuais, tempo até publicação e idade da pendência mais antiga.
- Reproduzir última vaga, reenvio, operação com dois aparelhos, perda de rede e acesso de outro condomínio. Guardar resultado esperado, observado, versão, perfil e evidência sem dados de saúde identificáveis.
- Validar um caso elegível até o segundo dia de treino e um caso com alerta até o bloqueio. Conferir reflexo no painel agregado e na auditoria.

## Referências locais

- QA_QUATRO_PERSONAS_MAISON_GUIMET.md
- REGISTRO_IMPLANTACAO_2026-10-26.md
- AUDITORIA_HEALTH_DAY_2026-11-05.md
- CHECKLIST_MORADOR_COACH_HEALTH_DAY.md
- CHECKLIST_IMPACTO_HEALTH_DAY.md
- VALIDACAO_PORTARIA_ELETRONICA.md
