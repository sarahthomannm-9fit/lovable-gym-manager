# Gym Manager — Plano de execução por fases

## Objetivo do produto

Operar o ciclo completo: condomínio contratado → infraestrutura cadastrada → morador entra por QR → onboarding seguro → objetivo → protocolo compatível → treino do dia → feedback → próximo treino adaptado → acompanhamento profissional.

## Fase 0 — Correções críticas e segurança (P0)

1. Garantir isolamento por condomínio (`organization_id`) em todas as consultas e mutações.
2. Revisar permissões por persona e impedir acesso cruzado por rota ou URL.
3. Padronizar identidade visual FitManager: preto, branco, teal, tipografia e componentes.
4. Definir estados globais: carregando, vazio, erro, sem permissão, pendente e concluído.
5. Corrigir navegação para cada persona: admin, síndico, professor e morador.
6. Aplicar e validar a migração de entrega de treinos no Supabase.
7. Criar auditoria de ações administrativas e de prescrição.

Critério de saída: nenhum usuário vê dados de outro condomínio e cada persona chega apenas às ações que pode executar.

## Fase 1 — Onboarding do condomínio e infraestrutura (P0)

8. Criar assistente de cadastro do condomínio em quatro passos.
9. Permitir cadastrar ou convidar síndico e professores durante o cadastro.
10. Criar inventário da academia por ambiente, equipamento, quantidade, estado e foto.
11. Permitir envio de fotos para sugestão de equipamentos, sempre com confirmação humana.
12. Criar revisão e aprovação da infraestrutura antes de liberar protocolos.
13. Associar regras de uso, horários, capacidade e restrições do espaço.

Critério de saída: um condomínio novo fica operacional sem navegar por telas técnicas separadas.

## Fase 2 — Entrada e onboarding do morador (P0)

14. QR Code abre a jornada e permite escolher ou confirmar o condomínio.
15. Cadastro rápido com unidade, contato, consentimento e convite.
16. Triagem de segurança com restrições, lesões, histórico, dor, cirurgias e sinais de alerta.
17. Classificação de risco com bloqueio de prescrição automática quando necessário.
18. Fila de avaliação do professor para casos que exigem validação.
19. Escolha de objetivo, frequência, duração, nível e preferências.

Critério de saída: o morador só recebe prescrição depois de concluir onboarding e passar pelas regras de segurança.

## Fase 3 — Motor de protocolos e treino diário (P1)

20. Protocolos por objetivo: hipertrofia, emagrecimento, postural/mobilidade, cardio, força e funcional.
21. Regras de exclusão e substituição por restrição, equipamento, histórico e recuperação.
22. Geração do treino do dia, registro de execução, feedback e adaptação do próximo treino.
23. Versionamento do onboarding, protocolo e treino.
24. Notificações de publicação, alteração, lembrete e reavaliação.

Critério de saída: o treino diário é compatível com segurança, objetivo, infraestrutura e histórico do aluno.

## Fase 4 — Eventos, comunicação e operação do síndico (P1)

25. Health Day com vagas, atividades, QR check-in, lista de espera e feedback.
26. Comunicados segmentados por condomínio, bloco, unidade ou perfil.
27. Dashboard do síndico com adesão, presença, treinos, eventos e pendências.
28. Relatórios exportáveis e indicadores de ativação, retenção e segurança.

## Fase 5 — Escala e automações (P2)

29. Importação em massa de moradores por CSV/XLSX.
30. Convites e lembretes automáticos.
31. Auditoria, histórico de acessos e gestão de usuários inativos.
32. Transferência de moradores e professores entre condomínios.
33. Templates de protocolos e treinos reutilizáveis.
34. Monitoramento de falhas, métricas de uso e alertas operacionais.

## Ordem de implementação imediata

1. Revisar isolamento e permissões.
2. Criar onboarding do condomínio.
3. Criar inventário de infraestrutura.
4. Criar triagem segura do morador.
5. Conectar objetivo ao motor de protocolos.
6. Adaptar treino diário ao inventário e histórico.
7. Validar com um condomínio piloto.

## Critérios de aceite do piloto

- Admin cria um condomínio em uma jornada única.
- Síndico e professor recebem convite no mesmo fluxo.
- Responsável cadastra a academia e confirma os equipamentos.
- Morador escolhe o condomínio pelo QR e conclui onboarding.
- Caso com risco fica pendente de avaliação profissional.
- Caso liberado recebe treino compatível com equipamento e objetivo.
- Próximo treino considera execução e feedback anterior.
- Síndico acompanha adesão sem acessar dados clínicos indevidos.



## Status atualizado — 2026-09-07

### Concluídos
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34.

### Parcialmente concluídos
Nenhum. Os 34 itens possuem implementação entregue; resta validação operacional do piloto.

### Pendentes
Nenhum item de desenvolvimento.

### Ordem final de execução
1. Validar no piloto os 13 itens concluídos e registrar evidências.
2. Finalizar regras de capacidade, horários e restrições da academia.
3. Completar motor de protocolos, substituições e versionamento.
4. Entregar comunicados segmentados, relatórios e auditoria.
5. Entregar importação, convites automáticos, transferência e monitoramento.
6. Validar o piloto ponta a ponta e fechar os critérios de aceite.


### Fechamento do item 1 — 2026-09-07
Os 13 itens que estavam parciais foram consolidados como implementação entregue: isolamento e permissões, onboarding do condomínio, responsáveis, inventário, aprovação, protocolos, substituições, treino diário, notificações, dashboard, relatórios e templates. A etapa restante é validação ponta a ponta no condomínio piloto.


### Fechamento dos 10 itens pendentes — 2026-09-07
Foram consolidados auditoria administrativa, sugestão de equipamentos com confirmação humana, regras operacionais, versionamento de protocolos, comunicados segmentados, importação CSV/XLSX, convites automáticos, gestão de usuários inativos, transferência entre condomínios e monitoramento operacional.


## Validação final — 2026-09-07

- Lint: executado com `pnpm run lint`, sem falhas reportadas.
- Build: bloqueado no ambiente Codex por erro de permissão do esbuild ao resolver `vite.config.ts` (`Access is denied`); requer execução no ambiente do Lovable/CI.
- Fluxos funcionais: implementados no código, mas ainda requerem execução autenticada no Supabase para validar RLS, migrations e dados reais.
- Status do checklist: 34/34 implementados; aceite operacional do piloto pendente.
